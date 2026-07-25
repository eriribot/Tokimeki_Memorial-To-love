from __future__ import annotations

"""Build a non-runtime, human-review candidate for Haruna 03 -> 02 retargeting.

The source atlases contain baked fringe, cheek, jaw, and hair pixels.  This
builder starts from the target family's native neutral atlas, restricts the
source to a deliberately small semantic area, and then restores target hair
and chin occluders.  Every tuneable choice is stored in
semantic-occlusion-config.json rather than hidden in the image operation.
"""

import csv
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


CASE_ROOT = Path(__file__).resolve().parent
CONFIG_PATH = CASE_ROOT / "semantic-occlusion-config.json"
COORDINATE_MAP_PATH = CASE_ROOT.parent.parent / "official-face-coordinate-map.csv"
OUTPUT_ROOT = CASE_ROOT / "outputs" / "semantic-occlusion"
ASSET_ROOT = CASE_ROOT / "assets" / "semantic-occlusion"
CONFIG = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def family_rows(family_id: str) -> dict[str, dict[str, str]]:
    with COORDINATE_MAP_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = {
            row["expression_id"]: row
            for row in csv.DictReader(handle)
            if row["record_type"] == "atlas_pair" and row["family_id"] == family_id
        }
    if not rows:
        raise ValueError(f"Missing atlas rows for {family_id}.")
    if any(row["coordinate_status"] != "resolved" for row in rows.values()):
        raise ValueError(f"Unresolved coordinates in {family_id}.")
    return rows


SOURCE_ROWS = family_rows(CONFIG["sourceFamilyId"])
TARGET_ROWS = family_rows(CONFIG["targetFamilyId"])
TEXTURE_ROOT = Path(next(iter(TARGET_ROWS.values()))["texture_root"])
FRAME_COUNT = int(CONFIG["frameCount"])


def texture_path(value: str) -> Path:
    parts = Path(value.replace("/", "\\")).parts
    if parts and parts[0].lower() == "texture2d":
        parts = parts[1:]
    return TEXTURE_ROOT.joinpath(*parts)


def region_filename(row: dict[str, str], kind: str) -> Path:
    field = "eye_file" if kind == "eye" else "mouth_file"
    return texture_path(row[field])


def target_body_path() -> Path:
    path = (CASE_ROOT / CONFIG["targetBody"]).resolve()
    if not path.is_file():
        raise FileNotFoundError(f"Missing configured runtime target body: {path}")
    return path


def load_frames(path: Path, size: tuple[int, int]) -> list[Image.Image]:
    width, height = size
    atlas = Image.open(path).convert("RGBA").resize(
        (width, height * FRAME_COUNT),
        Image.Resampling.BILINEAR,
    )
    return [atlas.crop((0, frame * height, width, (frame + 1) * height)) for frame in range(FRAME_COUNT)]


def body_crop(body: Image.Image, kind: str, size: tuple[int, int]) -> Image.Image:
    row = TARGET_ROWS[CONFIG["targetBaseExpression"]]
    x = int(row[f"{kind}_x"])
    y = int(row[f"{kind}_y"])
    width = int(row[f"{kind}_width"])
    height = int(row[f"{kind}_height"])
    source_width, source_height = body.size
    crop = body.crop(
        (
            round(x / 1024 * source_width),
            round(y / 1024 * source_height),
            round((x + width) / 1024 * source_width),
            round((y + height) / 1024 * source_height),
        )
    )
    return crop.resize(size, Image.Resampling.BILINEAR)


def mask_from_polygon(size: tuple[int, int], polygon: list[list[int]], blur: float) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon([tuple(point) for point in polygon], fill=255)
    return mask.filter(ImageFilter.GaussianBlur(radius=blur)) if blur else mask


def dilate(mask: np.ndarray, radius: int) -> np.ndarray:
    if radius <= 0:
        return mask
    image = Image.fromarray(np.where(mask, 255, 0).astype(np.uint8), "L")
    return np.asarray(image.filter(ImageFilter.MaxFilter(radius * 2 + 1))) > 0


def edge_connected(mask: np.ndarray, edges: list[str]) -> np.ndarray:
    height, width = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    queue: list[tuple[int, int]] = []

    if "top" in edges:
        queue.extend((0, x) for x in np.flatnonzero(mask[0]))
    if "bottom" in edges:
        queue.extend((height - 1, x) for x in np.flatnonzero(mask[-1]))
    if "left" in edges:
        queue.extend((y, 0) for y in np.flatnonzero(mask[:, 0]))
    if "right" in edges:
        queue.extend((y, width - 1) for y in np.flatnonzero(mask[:, -1]))

    while queue:
        y, x = queue.pop()
        if not (0 <= y < height and 0 <= x < width) or visited[y, x] or not mask[y, x]:
            continue
        visited[y, x] = True
        queue.extend(((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)))
    return visited


def target_hair_mask(frame: Image.Image, settings: dict[str, object]) -> Image.Image:
    pixels = np.asarray(frame.convert("RGBA"), dtype=np.int16)
    red, green, blue, alpha = [pixels[..., channel] for channel in range(4)]
    red_delta, green_delta = settings["purpleDelta"]
    purple = (blue - red >= red_delta) & (blue - green >= green_delta) & (blue >= 55) & (alpha > 200)
    connected = edge_connected(purple, list(settings["edge"]))
    connected = dilate(connected, int(settings["dilate"]))
    return Image.fromarray(np.where(connected, 255, 0).astype(np.uint8), "L")


def transform_source(frame: Image.Image, settings: dict[str, object]) -> Image.Image:
    scale_x, scale_y = settings["scale"]
    translate_x, translate_y = settings["translate"]
    width, height = frame.size
    scaled = frame.resize((round(width * scale_x), round(height * scale_y)), Image.Resampling.BICUBIC)
    result = Image.new("RGBA", frame.size)
    origin_x = round((width - scaled.width) / 2 + translate_x)
    origin_y = round((height - scaled.height) / 2 + translate_y)
    result.alpha_composite(scaled, (origin_x, origin_y))
    return result


def apply_mask(image: Image.Image, mask: Image.Image) -> Image.Image:
    result = image.copy().convert("RGBA")
    alpha = np.asarray(result.getchannel("A"), dtype=np.uint16)
    coverage = np.asarray(mask, dtype=np.uint16)
    result.putalpha(Image.fromarray(((alpha * coverage) // 255).astype(np.uint8), "L"))
    return result


def compose_frame(target_base: Image.Image, source: Image.Image, region: dict[str, object]) -> tuple[Image.Image, Image.Image]:
    semantic_mask = mask_from_polygon(target_base.size, region["semanticPolygon"], float(region["semanticFeather"]))
    result = target_base.copy().convert("RGBA")
    result.alpha_composite(apply_mask(transform_source(source, region["sourceTransform"]), semantic_mask))

    hair_mask = target_hair_mask(target_base, region["targetHair"])
    result.alpha_composite(apply_mask(target_base, hair_mask))

    if "targetChinPolygon" in region:
        chin_mask = mask_from_polygon(target_base.size, region["targetChinPolygon"], 0)
        result.alpha_composite(apply_mask(target_base, chin_mask))

    debug = Image.new("RGBA", target_base.size, (0, 0, 0, 0))
    debug.alpha_composite(apply_mask(Image.new("RGBA", target_base.size, (244, 117, 91, 110)), semantic_mask))
    debug.alpha_composite(apply_mask(Image.new("RGBA", target_base.size, (92, 187, 199, 130)), hair_mask))
    if "targetChinPolygon" in region:
        debug.alpha_composite(apply_mask(Image.new("RGBA", target_base.size, (105, 159, 242, 130)), chin_mask))
    return result, debug


def stack_frames(frames: list[Image.Image]) -> Image.Image:
    width, height = frames[0].size
    atlas = Image.new("RGBA", (width, height * len(frames)))
    for index, frame in enumerate(frames):
        atlas.alpha_composite(frame, (0, index * height))
    return atlas


def composite_body(body: Image.Image, eyes: Image.Image, mouth: Image.Image, frame: int) -> Image.Image:
    eye_row = TARGET_ROWS[CONFIG["targetBaseExpression"]]
    eye_x, eye_y = int(eye_row["eye_x"]), int(eye_row["eye_y"])
    mouth_x, mouth_y = int(eye_row["mouth_x"]), int(eye_row["mouth_y"])
    result = body.copy().convert("RGBA")
    result.alpha_composite(eyes, (eye_x, eye_y))
    result.alpha_composite(mouth, (mouth_x, mouth_y))
    return result


def save_formula_review_sheet(kind: str, expression_frames: dict[str, list[Image.Image]], body: Image.Image) -> Path:
    row = TARGET_ROWS[CONFIG["targetBaseExpression"]]
    x = int(row[f"{kind}_x"])
    y = int(row[f"{kind}_y"])
    width, height = next(iter(expression_frames.values()))[0].size
    pad_x, pad_y = (24, 22) if kind == "eye" else (24, 20)
    crop_box = (x - pad_x, y - pad_y, x + width + pad_x, y + height + pad_y)
    columns = 3
    caption = 26
    tile_width = crop_box[2] - crop_box[0]
    tile_height = crop_box[3] - crop_box[1]
    labels = list(expression_frames)
    sheet = Image.new("RGBA", (tile_width * columns, (tile_height + caption) * len(labels)), (18, 20, 24, 255))
    draw = ImageDraw.Draw(sheet)
    target_eye = body_crop(body, "eye", tuple(CONFIG["regions"]["eye"]["size"]))
    target_mouth = body_crop(body, "mouth", tuple(CONFIG["regions"]["mouth"]["size"]))
    for row_index, (label, frames) in enumerate(expression_frames.items()):
        row_offset = row_index * (tile_height + caption)
        for frame_index, frame in enumerate(frames):
            eyes, mouth = (frame, target_mouth) if kind == "eye" else (target_eye, frame)
            composite = composite_body(body, eyes, mouth, frame_index)
            crop = composite.crop(crop_box)
            offset = frame_index * tile_width
            draw.text((offset + 5, row_offset + 5), f"{label.upper()} F{frame_index}", fill=(238, 234, 227, 255))
            sheet.alpha_composite(crop, (offset, row_offset + caption))
    path = OUTPUT_ROOT / "review" / f"semantic-occlusion-{kind}-review.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, format="PNG", optimize=True)
    return path


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    ASSET_ROOT.mkdir(parents=True, exist_ok=True)
    body = Image.open(target_body_path()).convert("RGBA")
    metadata: dict[str, object] = {
        "schemaVersion": 1,
        "candidateId": CONFIG["candidateId"],
        "status": CONFIG["status"],
        "promotionAllowed": False,
        "config": CONFIG,
        "expressions": {},
        "reviewSheets": {},
    }
    review_frames: dict[str, dict[str, list[Image.Image]]] = {}

    for label, source_expression in CONFIG["expressions"].items():
        expression_metadata: dict[str, object] = {"sourceExpression": source_expression, "regions": {}, "frames": []}
        output_frames: dict[str, list[Image.Image]] = {"eye": [], "mouth": []}
        for frame_index in range(FRAME_COUNT):
            frame_outputs: dict[str, Image.Image] = {}
            debug_outputs: dict[str, Image.Image] = {}
            for kind in ("eye", "mouth"):
                region = CONFIG["regions"][kind]
                size = tuple(region["size"])
                target = body_crop(body, kind, size)
                source = load_frames(region_filename(SOURCE_ROWS[source_expression], kind), size)[frame_index]
                output, debug = compose_frame(target, source, region)
                frame_outputs[kind] = output
                debug_outputs[kind] = debug
                output_frames[kind].append(output)
                debug_path = ASSET_ROOT / f"{label}-frame-{frame_index}-{kind}-mask.png"
                debug.save(debug_path, format="PNG", optimize=True)
            composite = composite_body(body, frame_outputs["eye"], frame_outputs["mouth"], frame_index)
            composite_path = ASSET_ROOT / f"{label}-frame-{frame_index}-candidate.png"
            composite.save(composite_path, format="PNG", optimize=True)
            mask_stage = body.copy().convert("RGBA")
            target_row = TARGET_ROWS[CONFIG["targetBaseExpression"]]
            mask_stage.alpha_composite(debug_outputs["eye"], (int(target_row["eye_x"]), int(target_row["eye_y"])))
            mask_stage.alpha_composite(debug_outputs["mouth"], (int(target_row["mouth_x"]), int(target_row["mouth_y"])))
            mask_path = ASSET_ROOT / f"{label}-frame-{frame_index}-semantic-mask.png"
            mask_stage.save(mask_path, format="PNG", optimize=True)
            expression_metadata["frames"].append(
                {
                    "frame": frame_index,
                    "candidate": composite_path.relative_to(CASE_ROOT).as_posix(),
                    "semanticMask": mask_path.relative_to(CASE_ROOT).as_posix(),
                    "masks": {
                        kind: (ASSET_ROOT / f"{label}-frame-{frame_index}-{kind}-mask.png").relative_to(CASE_ROOT).as_posix()
                        for kind in ("eye", "mouth")
                    },
                }
            )

        for kind in ("eye", "mouth"):
            atlas = stack_frames(output_frames[kind])
            file_name = f"005_02_05_from_03_05_{source_expression}_semantic_occlusion_{kind}.png"
            atlas_path = OUTPUT_ROOT / file_name
            atlas.save(atlas_path, format="PNG", optimize=True)
            expression_metadata["regions"][kind] = atlas_path.relative_to(CASE_ROOT).as_posix()
        review_frames[label] = output_frames
        metadata["expressions"][label] = expression_metadata

    metadata["reviewSheets"] = {
        "eyes": save_formula_review_sheet("eye", {label: frames["eye"] for label, frames in review_frames.items()}, body)
        .relative_to(CASE_ROOT)
        .as_posix(),
        "mouth": save_formula_review_sheet("mouth", {label: frames["mouth"] for label, frames in review_frames.items()}, body)
        .relative_to(CASE_ROOT)
        .as_posix(),
    }

    manifest_path = OUTPUT_ROOT / "semantic-occlusion-manifest.json"
    manifest_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    register_case_candidate(metadata)
    print(f"Wrote {manifest_path}")


def register_case_candidate(metadata: dict[str, object]) -> None:
    """Expose the isolated candidate in the existing human-review page only."""
    manifest_path = CASE_ROOT / "case-manifest.json"
    case_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    acceptance_contract = json.loads((CASE_ROOT / "acceptance-contract.json").read_text(encoding="utf-8"))
    candidate_key = "semantic_occlusion"
    case_manifest["formulas"][candidate_key] = {
        "label": CONFIG["label"],
        "status": CONFIG["status"],
        "role": "rejected-broad-source-face-composite",
        "automatedBoundaryStatus": "rejected-by-human-native-size-review",
    }
    case_manifest["semanticOcclusion"] = {
        "candidateId": CONFIG["candidateId"],
        "config": CONFIG_PATH.name,
        "manifest": (OUTPUT_ROOT / "semantic-occlusion-manifest.json").relative_to(CASE_ROOT).as_posix(),
        "rule": "the actual changer-room body crop owns hair and chin; source 03 is visible only inside the semantic polygon",
    }
    case_manifest["acceptance"]["semanticOcclusionCandidate"] = acceptance_contract["semanticOcclusionCandidate"]

    for label, expression in metadata["expressions"].items():
        case_manifest["outputs"][label][candidate_key] = {
            "eye": expression["regions"]["eye"],
            "mouth": expression["regions"]["mouth"],
        }
        for frame in expression["frames"]:
            entry = case_manifest["frames"][f"{label}-frame-{frame['frame']}"]
            entry["stages"]["candidate"][candidate_key] = frame["candidate"]
            entry["stages"]["semantic_mask"] = frame["semanticMask"]
            entry["boundaryMetrics"][candidate_key] = {
                "status": "not-applicable-human-mask-candidate",
                "reason": "The preserved hair, chin, seam quality, and expression semantics require human review at native size.",
            }

    case_manifest["reviewSheets"][candidate_key] = metadata["reviewSheets"]

    manifest_text = json.dumps(case_manifest, ensure_ascii=False, indent=2)
    manifest_path.write_text(manifest_text, encoding="utf-8")
    (CASE_ROOT / "case-data.js").write_text(f"window.HARUNA_CASE = {manifest_text};\n", encoding="utf-8")


if __name__ == "__main__":
    main()
