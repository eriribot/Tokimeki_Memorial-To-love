from __future__ import annotations

"""Build the read-only Haruna 03 -> 02 study case.

This script intentionally writes only to this case directory. It does not touch
the production model page, character definitions, or source PNGs.
"""

import csv
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw
from skimage.color import rgb2gray
from skimage.filters import threshold_otsu
from skimage.morphology import binary_closing, binary_dilation, disk, remove_small_objects
from skimage.registration import optical_flow_tvl1
from skimage.transform import warp


CASE_ROOT = Path(__file__).resolve().parent
ASSET_ROOT = CASE_ROOT / "assets"
OUTPUT_ROOT = CASE_ROOT / "outputs"
CONFIG = json.loads((CASE_ROOT / "case-config.json").read_text(encoding="utf-8"))
ACCEPTANCE_CONTRACT = json.loads((CASE_ROOT / "acceptance-contract.json").read_text(encoding="utf-8"))
COORDINATE_MAP_PATH = (CASE_ROOT / CONFIG["coordinateMap"]).resolve()


def load_family_rows(family_id: str) -> list[dict[str, str]]:
    with COORDINATE_MAP_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = [
            row
            for row in csv.DictReader(handle)
            if row["record_type"] == "atlas_pair" and row["family_id"] == family_id
        ]
    if not rows:
        raise ValueError(f"Coordinate map has no atlas rows for {family_id}.")
    if any(row["coordinate_status"] != "resolved" or row["official_face_enabled"].lower() != "true" for row in rows):
        raise ValueError(f"Coordinate map has unresolved or disabled face coordinates for {family_id}.")
    return rows


def common_value(rows: list[dict[str, str]], field: str) -> str:
    values = {row[field] for row in rows}
    if len(values) != 1:
        raise ValueError(f"Family {rows[0]['family_id']} has inconsistent {field}: {sorted(values)}")
    return next(iter(values))


SOURCE_ROWS = load_family_rows(CONFIG["sourceFamilyId"])
TARGET_ROWS = load_family_rows(CONFIG["targetFamilyId"])
SOURCE_ROW_BY_EXPRESSION = {row["expression_id"]: row for row in SOURCE_ROWS}
TARGET_ROW_BY_EXPRESSION = {row["expression_id"]: row for row in TARGET_ROWS}

TEXTURE_ROOT = Path(common_value(TARGET_ROWS, "texture_root"))
if Path(common_value(SOURCE_ROWS, "texture_root")) != TEXTURE_ROOT:
    raise ValueError("Source and target families must resolve under the same texture root.")


def texture_path(relative_path: str) -> Path:
    parts = Path(relative_path.replace("/", "\\")).parts
    if parts and parts[0].lower() == "texture2d":
        parts = parts[1:]
    return TEXTURE_ROOT.joinpath(*parts)


CANVAS = (int(common_value(TARGET_ROWS, "canvas_width")), int(common_value(TARGET_ROWS, "canvas_height")))
if CANVAS != (
    int(common_value(SOURCE_ROWS, "canvas_width")),
    int(common_value(SOURCE_ROWS, "canvas_height")),
):
    raise ValueError("Source and target logical canvases must match.")

EYE_SIZE = (int(common_value(TARGET_ROWS, "eye_width")), int(common_value(TARGET_ROWS, "eye_height")))
MOUTH_SIZE = (int(common_value(TARGET_ROWS, "mouth_width")), int(common_value(TARGET_ROWS, "mouth_height")))
SOURCE_EYE_SIZE = (int(common_value(SOURCE_ROWS, "eye_width")), int(common_value(SOURCE_ROWS, "eye_height")))
SOURCE_MOUTH_SIZE = (int(common_value(SOURCE_ROWS, "mouth_width")), int(common_value(SOURCE_ROWS, "mouth_height")))
if EYE_SIZE != SOURCE_EYE_SIZE or MOUTH_SIZE != SOURCE_MOUTH_SIZE:
    raise ValueError("This case requires matching source and target eye/mouth window sizes.")

WINDOWS_02 = {
    "eye": (int(common_value(TARGET_ROWS, "eye_x")), int(common_value(TARGET_ROWS, "eye_y"))),
    "mouth": (int(common_value(TARGET_ROWS, "mouth_x")), int(common_value(TARGET_ROWS, "mouth_y"))),
}
WINDOWS_03 = {
    "eye": (int(common_value(SOURCE_ROWS, "eye_x")), int(common_value(SOURCE_ROWS, "eye_y"))),
    "mouth": (int(common_value(SOURCE_ROWS, "mouth_x")), int(common_value(SOURCE_ROWS, "mouth_y"))),
}
FRAME_COUNT = int(common_value(TARGET_ROWS, "frame_count"))
if FRAME_COUNT != int(common_value(SOURCE_ROWS, "frame_count")) or FRAME_COUNT != 3:
    raise ValueError("Runtime and case contract require exactly three atlas frames.")
EDGE_LOCK_PIXELS = int(CONFIG["algorithm"]["edgeLockPixels"])
SUPPORT_OPTIONS = CONFIG["algorithm"]["support"]
CANDIDATE_MODES = tuple(candidate["id"] for candidate in CONFIG["algorithm"]["blendCandidates"])

FLOW_OPTIONS = {
    "attachment": 15,
    "tightness": 0.3,
    "num_warp": 10,
    "num_iter": 10,
    "tol": 1e-4,
}


def rgba_array(image: Image.Image) -> np.ndarray:
    return np.asarray(image.convert("RGBA"), dtype=np.float32) / 255.0


def image_from_array(array: np.ndarray) -> Image.Image:
    return Image.fromarray(np.uint8(np.clip(array, 0.0, 1.0) * 255.0), "RGBA")


def load_frames(filename: str, size: tuple[int, int]) -> list[Image.Image]:
    """Match the established runtime sampling: resize the complete POT atlas, then split it."""
    width, height = size
    atlas = Image.open(texture_path(filename)).convert("RGBA").resize(
        (width, height * FRAME_COUNT), Image.Resampling.BILINEAR
    )
    return [atlas.crop((0, index * height, width, (index + 1) * height)) for index in range(FRAME_COUNT)]


def make_flow(target: np.ndarray, source: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    return optical_flow_tvl1(
        rgb2gray(target[..., :3]),
        rgb2gray(source[..., :3]),
        **FLOW_OPTIONS,
        prefilter=True,
    )


def warp_rgba(source: np.ndarray, flow: tuple[np.ndarray, np.ndarray]) -> np.ndarray:
    vertical, horizontal = flow
    height, width = source.shape[:2]
    rows, columns = np.meshgrid(np.arange(height), np.arange(width), indexing="ij")
    coordinates = np.array([rows + vertical, columns + horizontal])
    return np.stack(
        [warp(source[..., channel], coordinates, mode="edge", preserve_range=True) for channel in range(4)],
        axis=2,
    )


def composite(
    body: Image.Image,
    eye: Image.Image,
    mouth: Image.Image,
    windows: dict[str, tuple[int, int]],
) -> Image.Image:
    result = body.copy().convert("RGBA")
    result.alpha_composite(eye, windows["eye"])
    result.alpha_composite(mouth, windows["mouth"])
    return result


def difference_support(first: np.ndarray, second: np.ndarray) -> np.ndarray:
    first_premultiplied = np.concatenate([first[..., :3] * first[..., 3:4], first[..., 3:4]], axis=2)
    second_premultiplied = np.concatenate([second[..., :3] * second[..., 3:4], second[..., 3:4]], axis=2)
    magnitude = np.sqrt(np.mean((second_premultiplied - first_premultiplied) ** 2, axis=2))
    values = magnitude[magnitude > 1e-5]
    threshold = threshold_otsu(values) if values.size else 1.0
    support = magnitude > threshold
    support = remove_small_objects(support, min_size=8)
    return binary_closing(support, disk(int(SUPPORT_OPTIONS["closingRadius"])))


def family_feature_support(body_crop: np.ndarray, atlases: dict[str, list[Image.Image]]) -> np.ndarray:
    support = np.zeros(body_crop.shape[:2], dtype=bool)
    for frames in atlases.values():
        for frame in frames:
            support |= difference_support(body_crop, rgba_array(frame))
    return support


def prepare_blend_mask(
    target_support: np.ndarray,
    source_support: np.ndarray,
    valid_pixels: np.ndarray,
) -> np.ndarray:
    support = binary_closing(
        target_support | source_support,
        disk(int(SUPPORT_OPTIONS["closingRadius"])),
    )
    support = binary_dilation(support, disk(int(SUPPORT_OPTIONS["dilationRadius"])))
    support &= valid_pixels
    support[:EDGE_LOCK_PIXELS, :] = False
    support[-EDGE_LOCK_PIXELS:, :] = False
    support[:, :EDGE_LOCK_PIXELS] = False
    support[:, -EDGE_LOCK_PIXELS:] = False
    if not np.any(support):
        raise ValueError("Blend support is empty after enforcing the edge lock.")
    return np.uint8(support) * 255


def prepare_cleanup_mask(target_support: np.ndarray, valid_pixels: np.ndarray) -> np.ndarray:
    support = binary_closing(target_support, disk(int(SUPPORT_OPTIONS["closingRadius"])))
    support = binary_dilation(support, disk(int(SUPPORT_OPTIONS["dilationRadius"])))
    support &= valid_pixels
    support[:EDGE_LOCK_PIXELS, :] = False
    support[-EDGE_LOCK_PIXELS:, :] = False
    support[:, :EDGE_LOCK_PIXELS] = False
    support[:, -EDGE_LOCK_PIXELS:] = False
    if not np.any(support):
        raise ValueError("Target cleanup support is empty after enforcing the edge lock.")
    return np.uint8(support) * 255


def inpaint_patch(target: np.ndarray, mask: np.ndarray) -> np.ndarray:
    target_bgr = np.uint8(np.clip(target[..., :3], 0.0, 1.0) * 255.0)[..., ::-1]
    cleaned_bgr = cv2.inpaint(
        target_bgr,
        mask,
        float(SUPPORT_OPTIONS["inpaintRadius"]),
        cv2.INPAINT_TELEA,
    )
    cleaned_rgb = cleaned_bgr[..., ::-1].astype(np.float32) / 255.0
    result = np.dstack([cleaned_rgb, target[..., 3]])
    result[mask == 0] = target[mask == 0]
    return result


def seamless_clone_patch(source: np.ndarray, target: np.ndarray, mask: np.ndarray, mode: str) -> np.ndarray:
    flags = {
        "poisson_mixed": cv2.MIXED_CLONE,
        "poisson_normal": cv2.NORMAL_CLONE,
    }
    source_bgr = np.uint8(np.clip(source[..., :3], 0.0, 1.0) * 255.0)[..., ::-1]
    target_bgr = np.uint8(np.clip(target[..., :3], 0.0, 1.0) * 255.0)[..., ::-1]
    height, width = mask.shape
    blended_bgr = cv2.seamlessClone(source_bgr, target_bgr, mask, (width // 2, height // 2), flags[mode])
    blended_rgb = blended_bgr[..., ::-1].astype(np.float32) / 255.0
    result = np.dstack([blended_rgb, target[..., 3]])
    result[mask == 0] = target[mask == 0]
    result[:EDGE_LOCK_PIXELS, :] = target[:EDGE_LOCK_PIXELS, :]
    result[-EDGE_LOCK_PIXELS:, :] = target[-EDGE_LOCK_PIXELS:, :]
    result[:, :EDGE_LOCK_PIXELS] = target[:, :EDGE_LOCK_PIXELS]
    result[:, -EDGE_LOCK_PIXELS:] = target[:, -EDGE_LOCK_PIXELS:]
    return result


def boundary_metrics(candidate: np.ndarray, target: np.ndarray, mask: np.ndarray) -> dict[str, float | int]:
    candidate_bytes = np.uint8(np.clip(candidate, 0.0, 1.0) * 255.0)
    target_bytes = np.uint8(np.clip(target, 0.0, 1.0) * 255.0)
    height, width = mask.shape
    rows, columns = np.meshgrid(np.arange(height), np.arange(width), indexing="ij")
    edge = (
        (rows < EDGE_LOCK_PIXELS)
        | (rows >= height - EDGE_LOCK_PIXELS)
        | (columns < EDGE_LOCK_PIXELS)
        | (columns >= width - EDGE_LOCK_PIXELS)
    )
    outside_support = mask == 0
    edge_delta = np.abs(candidate_bytes[edge].astype(np.int16) - target_bytes[edge].astype(np.int16))
    outside_delta = np.abs(
        candidate_bytes[outside_support].astype(np.int16) - target_bytes[outside_support].astype(np.int16)
    )
    return {
        "edgeMaxRgbaDelta": int(edge_delta.max(initial=0)),
        "edgeMse": round(float(np.mean(edge_delta.astype(np.float32) ** 2)) if edge_delta.size else 0.0, 6),
        "outsideSupportMaxRgbaDelta": int(outside_delta.max(initial=0)),
    }


def mask_preview(body: Image.Image, masks: dict[str, np.ndarray]) -> Image.Image:
    preview = np.asarray(body.convert("RGB"), dtype=np.float32) / 255.0 * 0.38
    tint = np.zeros((1, 1, 3), dtype=np.float32)
    tint[:] = (1.0, 0.30, 0.19)
    for kind, mask in masks.items():
        x, y = WINDOWS_02[kind]
        height, width = mask.shape
        alpha = (mask.astype(np.float32) / 255.0)[..., None] * 0.76
        preview[y : y + height, x : x + width] = (
            preview[y : y + height, x : x + width] * (1.0 - alpha) + tint * alpha
        )
    return Image.fromarray(np.uint8(np.clip(preview, 0.0, 1.0) * 255.0), "RGB").convert("RGBA")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def save_stage(image: Image.Image, name: str) -> str:
    path = ASSET_ROOT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)
    return path.relative_to(CASE_ROOT).as_posix()


def save_clean_atlas(frames: list[np.ndarray], name: str) -> str:
    first = image_from_array(frames[0])
    atlas = Image.new("RGBA", (first.width, first.height * len(frames)))
    for index, frame in enumerate(frames):
        atlas.alpha_composite(image_from_array(frame), (0, index * first.height))
    path = OUTPUT_ROOT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(path, format="PNG", optimize=True)
    return path.relative_to(CASE_ROOT).as_posix()


def save_review_sheet(
    mode: str,
    kind: str,
    frames: dict[str, object],
) -> str:
    x, y = WINDOWS_02[kind]
    width, height = EYE_SIZE if kind == "eye" else MOUTH_SIZE
    pad_x, pad_y = (24, 22) if kind == "eye" else (24, 20)
    crop_box = (x - pad_x, y - pad_y, x + width + pad_x, y + height + pad_y)
    crop_width = crop_box[2] - crop_box[0]
    crop_height = crop_box[3] - crop_box[1]
    label_height = 20
    sheet = Image.new(
        "RGBA",
        (crop_width * FRAME_COUNT, (crop_height + label_height) * len(CONFIG["expressions"])),
        (24, 28, 33, 255),
    )
    draw = ImageDraw.Draw(sheet)
    for row, label in enumerate(CONFIG["expressions"]):
        for frame in range(FRAME_COUNT):
            key = f"{label}-frame-{frame}"
            candidate_path = CASE_ROOT / frames[key]["stages"]["candidate"][mode]
            source = Image.open(candidate_path).convert("RGBA")
            crop = source.crop(crop_box)
            destination_x = frame * crop_width
            destination_y = row * (crop_height + label_height)
            draw.text((destination_x + 5, destination_y + 4), f"{label.upper()}  F{frame}", fill=(238, 234, 227, 255))
            sheet.alpha_composite(crop, (destination_x, destination_y + label_height))
    path = OUTPUT_ROOT / "review" / f"{mode}-{kind}-review.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, format="PNG", optimize=True)
    return path.relative_to(CASE_ROOT).as_posix()


def main() -> None:
    ASSET_ROOT.mkdir(parents=True, exist_ok=True)
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    target_body_path = texture_path(common_value(TARGET_ROWS, "body_file"))
    source_body_path = texture_path(common_value(SOURCE_ROWS, "body_file"))
    target_body = Image.open(target_body_path).convert("RGBA")
    source_body = Image.open(source_body_path).convert("RGBA")
    target_body_crops = {
        kind: rgba_array(
            target_body.crop(
                (
                    WINDOWS_02[kind][0],
                    WINDOWS_02[kind][1],
                    WINDOWS_02[kind][0] + size[0],
                    WINDOWS_02[kind][1] + size[1],
                )
            )
        )
        for kind, size in (("eye", EYE_SIZE), ("mouth", MOUTH_SIZE))
    }

    flows: dict[str, tuple[np.ndarray, np.ndarray]] = {}
    flow_summary: dict[str, dict[str, object]] = {}
    for kind, size in (("eye", EYE_SIZE), ("mouth", MOUTH_SIZE)):
        width, height = size
        x2, y2 = WINDOWS_02[kind]
        x3, y3 = WINDOWS_03[kind]
        target_crop = rgba_array(target_body.crop((x2, y2, x2 + width, y2 + height)))
        source_crop = rgba_array(source_body.crop((x3, y3, x3 + width, y3 + height)))
        flow = make_flow(target_crop, source_crop)
        flows[kind] = flow

        rows, columns = flow
        flow_summary[kind] = {
            "verticalPercentiles": [round(float(value), 3) for value in np.percentile(rows, [1, 25, 50, 75, 99])],
            "horizontalPercentiles": [round(float(value), 3) for value in np.percentile(columns, [1, 25, 50, 75, 99])],
        }

    target_atlases = {
        expression: {
            "eye": load_frames(row["eye_file"], EYE_SIZE),
            "mouth": load_frames(row["mouth_file"], MOUTH_SIZE),
        }
        for expression, row in TARGET_ROW_BY_EXPRESSION.items()
    }
    source_expression_ids = {
        CONFIG["sourceNeutralExpression"],
        *(definition["sourceExpression"] for definition in CONFIG["expressions"].values()),
    }
    source_atlases = {
        expression: {
            "eye": load_frames(SOURCE_ROW_BY_EXPRESSION[expression]["eye_file"], EYE_SIZE),
            "mouth": load_frames(SOURCE_ROW_BY_EXPRESSION[expression]["mouth_file"], MOUTH_SIZE),
        }
        for expression in source_expression_ids
    }

    target_feature_support = {
        kind: family_feature_support(
            target_body_crops[kind],
            {expression: regions[kind] for expression, regions in target_atlases.items()},
        )
        for kind in ("eye", "mouth")
    }
    cleanup_masks = {
        kind: prepare_cleanup_mask(
            target_feature_support[kind],
            target_body_crops[kind][..., 3] > 0.5,
        )
        for kind in ("eye", "mouth")
    }
    clean_target_crops = {
        kind: inpaint_patch(target_body_crops[kind], cleanup_masks[kind])
        for kind in ("eye", "mouth")
    }
    neutral_id = CONFIG["sourceNeutralExpression"]
    registered_neutral = {
        kind: [rgba_array(frame) for frame in source_atlases[neutral_id][kind]]
        for kind in ("eye", "mouth")
    }
    registered_expressions: dict[str, dict[str, list[np.ndarray]]] = {}
    flow_comparisons: dict[str, dict[str, list[np.ndarray]]] = {}
    shared_masks: dict[str, dict[str, np.ndarray]] = {}
    support_summary: dict[str, dict[str, object]] = {}
    for label, definition in CONFIG["expressions"].items():
        expression_id = definition["sourceExpression"]
        registered_expressions[label] = {
            kind: [rgba_array(frame) for frame in source_atlases[expression_id][kind]]
            for kind in ("eye", "mouth")
        }
        flow_comparisons[label] = {
            kind: [warp_rgba(frame, flows[kind]) for frame in registered_expressions[label][kind]]
            for kind in ("eye", "mouth")
        }
        shared_masks[label] = {}
        support_summary[label] = {}
        for kind in ("eye", "mouth"):
            source_support = np.zeros(target_feature_support[kind].shape, dtype=bool)
            valid_pixels = target_body_crops[kind][..., 3] > 0.5
            for neutral_frame, expression_frame in zip(
                registered_neutral[kind],
                registered_expressions[label][kind],
                strict=True,
            ):
                source_support |= difference_support(neutral_frame, expression_frame)
                valid_pixels &= expression_frame[..., 3] > 0.5
            mask = prepare_blend_mask(target_feature_support[kind], source_support, valid_pixels)
            shared_masks[label][kind] = mask
            support_summary[label][kind] = {
                "sharedAcrossFrames": True,
                "targetCleanupPixels": int(np.count_nonzero(cleanup_masks[kind])),
                "selectedPixels": int(np.count_nonzero(mask)),
                "totalPixels": int(mask.size),
                "coveragePercent": round(float(np.count_nonzero(mask) / mask.size * 100.0), 3),
            }

    basis = {
        definition["sourceExpression"]: {
            "label": label,
            "eye": f"{CONFIG['targetFamilyId']} body eye crop",
            "mouth": f"{CONFIG['targetFamilyId']} body mouth crop",
        }
        for label, definition in CONFIG["expressions"].items()
    }
    manifest: dict[str, object] = {
        "schemaVersion": 2,
        "caseId": "haruna-03-to-02",
        "status": "candidate-awaiting-human-review",
        "promotionAllowed": False,
        "coordinateAuthority": {
            "path": str(COORDINATE_MAP_PATH),
            "sourceStatus": common_value(SOURCE_ROWS, "coordinate_status"),
            "targetStatus": common_value(TARGET_ROWS, "coordinate_status"),
            "officialFaceEnabled": True,
        },
        "source": {
            "family": CONFIG["sourceFamilyId"],
            "body": str(source_body_path),
            "bodySha256": sha256(source_body_path),
            "expressions": sorted(source_expression_ids),
            "neutral": neutral_id,
            "windows": WINDOWS_03,
        },
        "target": {
            "family": CONFIG["targetFamilyId"],
            "body": str(target_body_path),
            "bodySha256": sha256(target_body_path),
            "referenceExpressions": sorted(TARGET_ROW_BY_EXPRESSION),
            "windows": WINDOWS_02,
        },
        "canvas": {"width": CANVAS[0], "height": CANVAS[1]},
        "sampling": {
            "atlasResize": "bilinear",
            "frameCount": FRAME_COUNT,
            "eyeFrameSize": EYE_SIZE,
            "mouthFrameSize": MOUTH_SIZE,
        },
        "algorithm": CONFIG["algorithm"],
        "researchSources": CONFIG["researchSources"],
        "flow": flow_summary,
        "support": support_summary,
        "basis": basis,
        "formulas": {
            "official_window": {
                "label": "官方窗口基线",
                "status": "awaiting-human-review",
                "role": "human-review-baseline",
                "automatedBoundaryStatus": "not-applicable",
            },
            "poisson_normal": {
                "label": "Poisson 正常克隆",
                "status": "rejected-visual-artifact",
                "role": "rejected-comparison",
            },
            "poisson_mixed": {
                "label": "Poisson 混合克隆",
                "status": "rejected-visual-artifact",
                "role": "rejected-comparison",
            },
        },
        "acceptance": ACCEPTANCE_CONTRACT,
        "frames": {},
        "outputs": {},
    }

    candidate_atlas_frames = {
        label: {mode: {"eye": [], "mouth": []} for mode in CANDIDATE_MODES}
        for label in CONFIG["expressions"]
    }

    for label, definition in CONFIG["expressions"].items():
        expression_id = definition["sourceExpression"]
        for frame in range(FRAME_COUNT):
            registered_eye = registered_expressions[label]["eye"][frame]
            registered_mouth = registered_expressions[label]["mouth"][frame]
            flow_eye = flow_comparisons[label]["eye"][frame]
            flow_mouth = flow_comparisons[label]["mouth"][frame]
            masks = shared_masks[label]
            key = f"{label}-frame-{frame}"
            frame_manifest: dict[str, object] = {
                "label": label,
                "sourceExpression": expression_id,
                "frame": frame,
                "stages": {},
                "boundaryMetrics": {},
                "humanReview": {"eyes": "pending", "mouth": "pending"},
            }
            frame_manifest["stages"]["official"] = save_stage(
                composite(
                    source_body,
                    source_atlases[expression_id]["eye"][frame],
                    source_atlases[expression_id]["mouth"][frame],
                    WINDOWS_03,
                ),
                f"{key}/official.png",
            )
            frame_manifest["stages"]["direct"] = save_stage(
                composite(
                    target_body,
                    source_atlases[expression_id]["eye"][frame],
                    source_atlases[expression_id]["mouth"][frame],
                    WINDOWS_02,
                ),
                f"{key}/direct.png",
            )
            frame_manifest["stages"]["warp"] = save_stage(
                composite(
                    target_body,
                    image_from_array(flow_eye),
                    image_from_array(flow_mouth),
                    WINDOWS_02,
                ),
                f"{key}/warp.png",
            )
            frame_manifest["stages"]["basis"] = save_stage(
                composite(
                    target_body,
                    image_from_array(clean_target_crops["eye"]),
                    image_from_array(clean_target_crops["mouth"]),
                    WINDOWS_02,
                ),
                f"{key}/basis.png",
            )
            frame_manifest["stages"]["mask"] = save_stage(
                mask_preview(target_body, masks),
                f"{key}/mask.png",
            )

            candidate_paths: dict[str, str] = {}
            for mode in CANDIDATE_MODES:
                if mode == "official_window":
                    eye = registered_eye.copy()
                    mouth = registered_mouth.copy()
                else:
                    eye = seamless_clone_patch(registered_eye, clean_target_crops["eye"], masks["eye"], mode)
                    mouth = seamless_clone_patch(registered_mouth, clean_target_crops["mouth"], masks["mouth"], mode)
                candidate_atlas_frames[label][mode]["eye"].append(eye)
                candidate_atlas_frames[label][mode]["mouth"].append(mouth)
                candidate_paths[mode] = save_stage(
                    composite(target_body, image_from_array(eye), image_from_array(mouth), WINDOWS_02),
                    f"{key}/candidate-{mode}.png",
                )
                if mode == "official_window":
                    frame_manifest["boundaryMetrics"][mode] = {
                        "status": "not-applicable-official-layer-baseline",
                    }
                else:
                    frame_manifest["boundaryMetrics"][mode] = {
                        "status": "diagnostic-only-rejected-visual-artifact",
                        "eye": boundary_metrics(
                            eye,
                            target_body_crops["eye"],
                            np.maximum(masks["eye"], cleanup_masks["eye"]),
                        ),
                        "mouth": boundary_metrics(
                            mouth,
                            target_body_crops["mouth"],
                            np.maximum(masks["mouth"], cleanup_masks["mouth"]),
                        ),
                    }
            frame_manifest["stages"]["candidate"] = candidate_paths
            manifest["frames"][key] = frame_manifest

    for label, definition in CONFIG["expressions"].items():
        expression_id = definition["sourceExpression"]
        manifest["outputs"][label] = {}
        for mode in CANDIDATE_MODES:
            output_stem = f"{CONFIG['targetFamilyId']}_from_{CONFIG['sourceFamilyId'].split('_', 1)[1]}_{expression_id}_{mode}"
            manifest["outputs"][label][mode] = {
                "eye": save_clean_atlas(
                    candidate_atlas_frames[label][mode]["eye"],
                    f"{output_stem}_eye.png",
                ),
                "mouth": save_clean_atlas(
                    candidate_atlas_frames[label][mode]["mouth"],
                    f"{output_stem}_mouth.png",
                ),
            }

    manifest["reviewSheets"] = {
        mode: {
            "eyes": save_review_sheet(mode, "eye", manifest["frames"]),
            "mouth": save_review_sheet(mode, "mouth", manifest["frames"]),
        }
        for mode in CANDIDATE_MODES
    }

    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2)
    (CASE_ROOT / "case-manifest.json").write_text(manifest_text, encoding="utf-8")
    (CASE_ROOT / "case-data.js").write_text(
        f"window.HARUNA_CASE = {manifest_text};\n", encoding="utf-8"
    )
    print(f"Wrote {CASE_ROOT / 'case-manifest.json'}")


if __name__ == "__main__":
    main()
