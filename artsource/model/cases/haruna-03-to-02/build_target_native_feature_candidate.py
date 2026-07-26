from __future__ import annotations

"""Build an isolated 02-native Haruna face candidate for human review.

The target 02 atlas owns every skin, hair, contour, and chin pixel. Source 03
contributes only sparse expression ink and the mouth core. The script never
writes runtime assets or character TypeScript.
"""

import csv
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi
from skimage.restoration import inpaint_biharmonic


CASE_ROOT = Path(__file__).resolve().parent
CONFIG_PATH = CASE_ROOT / "target-native-feature-config.json"
COORDINATE_MAP_PATH = CASE_ROOT.parent.parent / "official-face-coordinate-map.csv"
OUTPUT_ROOT = CASE_ROOT / "outputs" / "target-native-features-v2"
ASSET_ROOT = CASE_ROOT / "assets" / "target-native-features-v2"
CONFIG = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
FRAME_COUNT = int(CONFIG["frameCount"])


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


def texture_path(value: str) -> Path:
    parts = Path(value.replace("/", "\\")).parts
    if parts and parts[0].lower() == "texture2d":
        parts = parts[1:]
    return TEXTURE_ROOT.joinpath(*parts)


def region_path(row: dict[str, str], kind: str) -> Path:
    return texture_path(row["eye_file" if kind == "eye" else "mouth_file"])


def target_body_path() -> Path:
    path = (CASE_ROOT / CONFIG["targetBody"]).resolve()
    if not path.is_file():
        raise FileNotFoundError(f"Missing configured runtime target body: {path}")
    return path


def body_crop(body: Image.Image, kind: str, size: tuple[int, int]) -> Image.Image:
    row = next(iter(TARGET_ROWS.values()))
    x, y = int(row[f"{kind}_x"]), int(row[f"{kind}_y"])
    width, height = int(row[f"{kind}_width"]), int(row[f"{kind}_height"])
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


def load_frames(path: Path, size: tuple[int, int]) -> list[Image.Image]:
    width, height = size
    atlas = Image.open(path).convert("RGBA").resize(
        (width, height * FRAME_COUNT),
        Image.Resampling.BILINEAR,
    )
    return [atlas.crop((0, frame * height, width, (frame + 1) * height)) for frame in range(FRAME_COUNT)]


def polygon_mask(size: tuple[int, int], polygons: list[list[list[int]]]) -> np.ndarray:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    for polygon in polygons:
        draw.polygon([tuple(point) for point in polygon], fill=255)
    return np.asarray(mask, dtype=np.uint8) > 0


def edge_connected(mask: np.ndarray, edges: list[str]) -> np.ndarray:
    seeds = np.zeros_like(mask, dtype=bool)
    if "top" in edges:
        seeds[0] = mask[0]
    if "bottom" in edges:
        seeds[-1] = mask[-1]
    if "left" in edges:
        seeds[:, 0] = mask[:, 0]
    if "right" in edges:
        seeds[:, -1] = mask[:, -1]
    return ndi.binary_propagation(seeds, mask=mask)


def target_hair_mask(frame: Image.Image) -> np.ndarray:
    settings = CONFIG["regions"]["eye"]["targetHair"]
    pixels = np.asarray(frame.convert("RGBA"), dtype=np.int16)
    red, green, blue, alpha = [pixels[..., channel] for channel in range(4)]
    red_delta, green_delta = settings["purpleDelta"]
    purple = (blue - red >= red_delta) & (blue - green >= green_delta) & (blue >= 55) & (alpha > 200)
    connected = edge_connected(purple, list(settings["edge"]))
    return ndi.binary_dilation(connected, iterations=int(settings["dilate"]))


def transform_layer(image: Image.Image, transform: dict[str, list[float]]) -> Image.Image:
    scale_x, scale_y = transform["scale"]
    translate_x, translate_y = transform["translate"]
    width, height = image.size
    scaled = image.resize((round(width * scale_x), round(height * scale_y)), Image.Resampling.BICUBIC)
    result = Image.new(image.mode, image.size, 0)
    origin = (
        round((width - scaled.width) / 2 + translate_x),
        round((height - scaled.height) / 2 + translate_y),
    )
    result.paste(scaled, origin)
    return result


def mask_image(mask: np.ndarray) -> Image.Image:
    return Image.fromarray(np.uint8(np.clip(mask, 0.0, 1.0) * 255.0), "L")


def inpaint_target(target: Image.Image, cleanup: np.ndarray, protect: np.ndarray | None = None) -> Image.Image:
    effective = cleanup & ~protect if protect is not None else cleanup
    rgba = np.asarray(target.convert("RGBA"), dtype=np.float32) / 255.0
    cleaned_rgb = inpaint_biharmonic(rgba[..., :3], effective, channel_axis=-1)
    cleaned = np.dstack([cleaned_rgb, rgba[..., 3]])
    cleaned[~effective] = rgba[~effective]
    return Image.fromarray(np.uint8(np.clip(cleaned, 0.0, 1.0) * 255.0), "RGBA")


def composite_with_coverage(target: Image.Image, source: Image.Image, coverage: np.ndarray) -> Image.Image:
    layer = source.copy().convert("RGBA")
    source_alpha = np.asarray(layer.getchannel("A"), dtype=np.float32) / 255.0
    layer.putalpha(mask_image(source_alpha * np.clip(coverage, 0.0, 1.0)))
    result = target.copy().convert("RGBA")
    result.alpha_composite(layer)
    return result


def ink_coverage(source: Image.Image, polygons: list[list[list[int]]]) -> np.ndarray:
    rgb = np.asarray(source.convert("RGB"), dtype=np.float32)
    luma = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    floor = float(CONFIG["extraction"]["inkLumaFloor"])
    ceiling = float(CONFIG["extraction"]["inkLumaCeiling"])
    coverage = np.clip((ceiling - luma) / (ceiling - floor), 0.0, 1.0)
    return coverage * polygon_mask(source.size, polygons)


def remove_small_components(mask: np.ndarray) -> np.ndarray:
    labels, count = ndi.label(mask)
    minimum = int(CONFIG["extraction"]["minimumComponentPixels"])
    keep = np.zeros_like(mask, dtype=bool)
    for label in range(1, count + 1):
        component = labels == label
        if int(component.sum()) >= minimum:
            keep |= component
    return keep


def isolated_mouth_mask(
    image: Image.Image,
    roi_polygons: list[list[list[int]]],
    seed_polygons: list[list[list[int]]],
    luma_ceiling: float,
    color_distance_floor: float,
    dilation: int,
) -> np.ndarray:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.float32)
    rgb = rgba[..., :3]
    luma = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    roi = polygon_mask(image.size, roi_polygons)
    seed = polygon_mask(image.size, seed_polygons)
    inner = ndi.binary_erosion(roi, iterations=3)
    border = roi & ~inner & (rgba[..., 3] > 128)
    if not np.any(border):
        raise ValueError("Mouth ROI has no opaque border pixels for its local skin reference.")
    skin_reference = np.median(rgb[border], axis=0)
    color_distance = np.sqrt(np.mean((rgb - skin_reference) ** 2, axis=2))
    selected = ((luma <= luma_ceiling) | (color_distance >= color_distance_floor)) & roi

    roi_boundary = roi & ~ndi.binary_erosion(roi, iterations=1)
    labels, count = ndi.label(selected)
    keep = np.zeros_like(selected, dtype=bool)
    minimum = int(CONFIG["extraction"]["minimumComponentPixels"])
    for label in range(1, count + 1):
        component = labels == label
        if int(component.sum()) < minimum:
            continue
        if np.any(component & roi_boundary):
            continue
        if not np.any(component & seed):
            continue
        keep |= component

    keep = ndi.binary_closing(keep, iterations=1)
    keep = ndi.binary_fill_holes(keep)
    return ndi.binary_dilation(keep, iterations=dilation)


def mouth_coverage(source: Image.Image, region: dict[str, object]) -> np.ndarray:
    selected = isolated_mouth_mask(
        source,
        region["sourceMouthPolygons"],
        region["sourceMouthSeedPolygons"],
        float(CONFIG["extraction"]["mouthLumaCeiling"]),
        float(CONFIG["extraction"]["mouthColorDistanceFloor"]),
        int(CONFIG["extraction"]["mouthSupportDilation"]),
    )
    details = ink_coverage(source, region.get("sourceDetailPolygons", []))
    sigma = float(CONFIG["extraction"]["featureMaskSigma"])
    mouth = ndi.gaussian_filter(selected.astype(np.float32), sigma=sigma)
    return np.maximum(np.clip(mouth, 0.0, 1.0), details)


def target_blush_coverage(target: Image.Image) -> np.ndarray:
    rgb = np.asarray(target.convert("RGB"), dtype=np.float32)
    redness = rgb[..., 0] - (rgb[..., 1] + rgb[..., 2]) / 2.0
    floor = float(CONFIG["extraction"]["targetBlushRednessFloor"])
    ceiling = float(CONFIG["extraction"]["targetBlushRednessCeiling"])
    coverage = np.clip((redness - floor) / (ceiling - floor), 0.0, 1.0)
    roi = polygon_mask(target.size, CONFIG["regions"]["eye"]["targetBlushPolygons"])
    return coverage * roi


def cleanup_coverage(target: Image.Image, settings: dict[str, object]) -> np.ndarray:
    roi = polygon_mask(target.size, settings["cleanupPolygons"])
    selection = settings.get("cleanupSelection", {"mode": "full-polygon"})
    if selection["mode"] == "full-polygon":
        return roi
    if selection["mode"] == "mouth-detail":
        return isolated_mouth_mask(
            target,
            settings["cleanupPolygons"],
            settings["cleanupSeedPolygons"],
            float(selection["lumaCeiling"]),
            float(selection["colorDistanceFloor"]),
            int(selection["dilate"]),
        )
    if selection["mode"] != "dark-detail":
        raise ValueError(f"Unknown cleanup selection: {selection['mode']}")
    rgb = np.asarray(target.convert("RGB"), dtype=np.float32)
    luma = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    selected = (luma <= float(selection["lumaCeiling"])) & roi
    selected = remove_small_components(selected)
    selected = ndi.binary_dilation(selected, iterations=int(selection["dilate"]))
    return selected & roi


def lock_edges(candidate: Image.Image, target: Image.Image) -> Image.Image:
    pixels = int(CONFIG["extraction"]["edgeLockPixels"])
    if pixels <= 0:
        return candidate
    result = np.asarray(candidate.convert("RGBA")).copy()
    original = np.asarray(target.convert("RGBA"))
    result[:pixels] = original[:pixels]
    result[-pixels:] = original[-pixels:]
    result[:, :pixels] = original[:, :pixels]
    result[:, -pixels:] = original[:, -pixels:]
    return Image.fromarray(result, "RGBA")


def body_edge_coverage(size: tuple[int, int], bands: dict[str, int]) -> np.ndarray:
    width, height = size
    coverage = np.zeros((height, width), dtype=np.float32)
    for side, pixels in bands.items():
        pixels = int(pixels)
        if pixels <= 0:
            continue
        ramp = np.linspace(1.0, 0.0, pixels, endpoint=False, dtype=np.float32)
        ramp = ramp * ramp * (3.0 - 2.0 * ramp)
        if side == "top":
            coverage[:pixels] = np.maximum(coverage[:pixels], ramp[:, None])
        elif side == "bottom":
            coverage[-pixels:] = np.maximum(coverage[-pixels:], ramp[::-1, None])
        elif side == "left":
            coverage[:, :pixels] = np.maximum(coverage[:, :pixels], ramp[None, :])
        elif side == "right":
            coverage[:, -pixels:] = np.maximum(coverage[:, -pixels:], ramp[None, ::-1])
        else:
            raise ValueError(f"Unknown body edge: {side}")
    return coverage


def compose_region(
    kind: str,
    target: Image.Image,
    source: Image.Image,
    body_reference: Image.Image,
    settings: dict[str, object],
) -> tuple[Image.Image, Image.Image]:
    cleanup = cleanup_coverage(target, settings)
    protected_hair = target_hair_mask(target) if kind == "eye" else np.zeros(cleanup.shape, dtype=bool)
    result = inpaint_target(target, cleanup, protected_hair)

    target_blush = np.zeros(cleanup.shape, dtype=np.float32)
    if kind == "eye" and settings.get("preserveTargetBlush"):
        target_blush = target_blush_coverage(target)
        result = composite_with_coverage(result, target, target_blush)

    coverage = (
        ink_coverage(source, settings["sourceInkPolygons"])
        if kind == "eye"
        else mouth_coverage(source, settings)
    )
    transformed_source = transform_layer(source, settings["sourceTransform"])
    transformed_coverage = np.asarray(
        transform_layer(mask_image(coverage), settings["sourceTransform"]),
        dtype=np.float32,
    ) / 255.0
    result = composite_with_coverage(result, transformed_source, transformed_coverage)
    body_edges = body_edge_coverage(target.size, CONFIG["regions"][kind]["bodyEdgeBands"])
    result = composite_with_coverage(result, body_reference, body_edges)
    result = lock_edges(result, body_reference)

    debug = Image.new("RGBA", target.size, (0, 0, 0, 0))
    debug.alpha_composite(
        composite_with_coverage(
            debug,
            Image.new("RGBA", target.size, (244, 117, 91, 170)),
            cleanup.astype(np.float32),
        )
    )
    debug.alpha_composite(
        composite_with_coverage(
            Image.new("RGBA", target.size, (0, 0, 0, 0)),
            Image.new("RGBA", target.size, (98, 206, 146, 205)),
            transformed_coverage,
        )
    )
    if kind == "eye":
        debug.alpha_composite(
            composite_with_coverage(
                Image.new("RGBA", target.size, (0, 0, 0, 0)),
                Image.new("RGBA", target.size, (92, 187, 199, 190)),
                protected_hair.astype(np.float32),
            )
        )
        debug.alpha_composite(
            composite_with_coverage(
                Image.new("RGBA", target.size, (0, 0, 0, 0)),
                Image.new("RGBA", target.size, (105, 159, 242, 170)),
                target_blush,
            )
        )
    debug.alpha_composite(
        composite_with_coverage(
            Image.new("RGBA", target.size, (0, 0, 0, 0)),
            Image.new("RGBA", target.size, (245, 192, 92, 175)),
            body_edges,
        )
    )
    return result, debug


def stack_frames(frames: list[Image.Image]) -> Image.Image:
    width, height = frames[0].size
    atlas = Image.new("RGBA", (width, height * len(frames)))
    for index, frame in enumerate(frames):
        atlas.alpha_composite(frame, (0, index * height))
    return atlas


def composite_body(body: Image.Image, eye: Image.Image, mouth: Image.Image) -> Image.Image:
    row = next(iter(TARGET_ROWS.values()))
    result = body.copy().convert("RGBA")
    result.alpha_composite(eye, (int(row["eye_x"]), int(row["eye_y"])))
    result.alpha_composite(mouth, (int(row["mouth_x"]), int(row["mouth_y"])))
    return result


def save_review_sheet(
    kind: str,
    expression_frames: dict[str, dict[str, list[Image.Image]]],
    body: Image.Image,
) -> Path:
    row = next(iter(TARGET_ROWS.values()))
    x, y = int(row[f"{kind}_x"]), int(row[f"{kind}_y"])
    width, height = tuple(CONFIG["regions"][kind]["size"])
    pad_x, pad_y = (24, 22) if kind == "eye" else (24, 20)
    crop_box = (x - pad_x, y - pad_y, x + width + pad_x, y + height + pad_y)
    tile_width = crop_box[2] - crop_box[0]
    tile_height = crop_box[3] - crop_box[1]
    caption = 26
    sheet = Image.new(
        "RGBA",
        (tile_width * FRAME_COUNT, (tile_height + caption) * len(expression_frames)),
        (18, 20, 24, 255),
    )
    draw = ImageDraw.Draw(sheet)
    for row_index, (label, regions) in enumerate(expression_frames.items()):
        row_offset = row_index * (tile_height + caption)
        for frame_index in range(FRAME_COUNT):
            composite = composite_body(body, regions["eye"][frame_index], regions["mouth"][frame_index])
            crop = composite.crop(crop_box)
            offset = frame_index * tile_width
            draw.text((offset + 5, row_offset + 5), f"{label.upper()} F{frame_index}", fill=(238, 234, 227, 255))
            sheet.alpha_composite(crop, (offset, row_offset + caption))
    path = OUTPUT_ROOT / "review" / f"target-native-features-v2-{kind}-review.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, format="PNG", optimize=True)
    return path


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    ASSET_ROOT.mkdir(parents=True, exist_ok=True)
    body = Image.open(target_body_path()).convert("RGBA")
    body_references = {
        kind: body_crop(body, kind, tuple(CONFIG["regions"][kind]["size"])) for kind in ("eye", "mouth")
    }
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

    for label, expression in CONFIG["expressions"].items():
        source_expression = expression["sourceExpression"]
        target_expression = expression["targetExpression"]
        source_frames = {
            kind: load_frames(region_path(SOURCE_ROWS[source_expression], kind), tuple(CONFIG["regions"][kind]["size"]))
            for kind in ("eye", "mouth")
        }
        target_frames = {
            kind: load_frames(region_path(TARGET_ROWS[target_expression], kind), tuple(CONFIG["regions"][kind]["size"]))
            for kind in ("eye", "mouth")
        }
        output_frames: dict[str, list[Image.Image]] = {"eye": [], "mouth": []}
        expression_metadata: dict[str, object] = {
            "sourceExpression": source_expression,
            "targetExpression": target_expression,
            "regions": {},
            "frames": [],
        }
        for frame_index in range(FRAME_COUNT):
            frame_outputs: dict[str, Image.Image] = {}
            debug_outputs: dict[str, Image.Image] = {}
            for kind in ("eye", "mouth"):
                output, debug = compose_region(
                    kind,
                    target_frames[kind][int(expression[kind]["targetFrameMap"][frame_index])],
                    source_frames[kind][frame_index],
                    body_references[kind],
                    expression[kind],
                )
                output_frames[kind].append(output)
                frame_outputs[kind] = output
                debug_outputs[kind] = debug
                debug_path = ASSET_ROOT / f"{label}-frame-{frame_index}-{kind}-ownership.png"
                debug.save(debug_path, format="PNG", optimize=True)

            candidate = composite_body(body, frame_outputs["eye"], frame_outputs["mouth"])
            candidate_path = ASSET_ROOT / f"{label}-frame-{frame_index}-candidate.png"
            candidate.save(candidate_path, format="PNG", optimize=True)
            ownership = body.copy().convert("RGBA")
            target_row = next(iter(TARGET_ROWS.values()))
            ownership.alpha_composite(debug_outputs["eye"], (int(target_row["eye_x"]), int(target_row["eye_y"])))
            ownership.alpha_composite(debug_outputs["mouth"], (int(target_row["mouth_x"]), int(target_row["mouth_y"])))
            ownership_path = ASSET_ROOT / f"{label}-frame-{frame_index}-ownership.png"
            ownership.save(ownership_path, format="PNG", optimize=True)
            expression_metadata["frames"].append(
                {
                    "frame": frame_index,
                    "candidate": candidate_path.relative_to(CASE_ROOT).as_posix(),
                    "ownership": ownership_path.relative_to(CASE_ROOT).as_posix(),
                    "regions": {
                        kind: (ASSET_ROOT / f"{label}-frame-{frame_index}-{kind}-ownership.png")
                        .relative_to(CASE_ROOT)
                        .as_posix()
                        for kind in ("eye", "mouth")
                    },
                }
            )

        for kind in ("eye", "mouth"):
            atlas = stack_frames(output_frames[kind])
            atlas_path = OUTPUT_ROOT / f"005_02_05_from_03_05_{source_expression}_target_native_features_v2_{kind}.png"
            atlas.save(atlas_path, format="PNG", optimize=True)
            expression_metadata["regions"][kind] = atlas_path.relative_to(CASE_ROOT).as_posix()
        review_frames[label] = output_frames
        metadata["expressions"][label] = expression_metadata

    metadata["reviewSheets"] = {
        "eyes": save_review_sheet("eye", review_frames, body).relative_to(CASE_ROOT).as_posix(),
        "mouth": save_review_sheet("mouth", review_frames, body).relative_to(CASE_ROOT).as_posix(),
    }
    manifest_path = OUTPUT_ROOT / "target-native-features-v2-manifest.json"
    manifest_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    register_case_candidate(metadata)
    print(f"Wrote {manifest_path}")


def register_case_candidate(metadata: dict[str, object]) -> None:
    manifest_path = CASE_ROOT / "case-manifest.json"
    case_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    acceptance = json.loads((CASE_ROOT / "acceptance-contract.json").read_text(encoding="utf-8"))
    rejected_candidate_key = "target_native_features"
    candidate_key = "target_native_features_v2"

    case_manifest["formulas"]["semantic_occlusion"].update(
        {
            "status": "rejected-human-review",
            "role": "rejected-broad-source-face-composite",
            "automatedBoundaryStatus": "rejected-by-human-native-size-review",
        }
    )
    if "semanticOcclusion" in case_manifest:
        case_manifest["semanticOcclusion"]["status"] = "rejected-human-review"
    if rejected_candidate_key in case_manifest["formulas"]:
        case_manifest["formulas"][rejected_candidate_key].update(
            {
                "status": "rejected-human-review",
                "role": "rejected-source-skin-mouth-support",
                "automatedBoundaryStatus": "rejected-by-human-native-size-review",
            }
        )
    if "targetNativeFeatures" in case_manifest:
        case_manifest["targetNativeFeatures"]["status"] = "rejected-human-review"
    case_manifest["formulas"][candidate_key] = {
        "label": CONFIG["label"],
        "status": CONFIG["status"],
        "role": "target-native-atlas-with-sparse-source-expression-features",
        "automatedBoundaryStatus": "not-applicable-human-visual-only",
        "basis": {
            "eye": "005_02_05_c native eye frames; 03 supplies sparse expression ink only",
            "mouth": "005_02_05_c native lower face and chin; 03 supplies mouth core only",
        },
    }
    case_manifest["targetNativeFeaturesV2"] = {
        "candidateId": CONFIG["candidateId"],
        "config": CONFIG_PATH.name,
        "manifest": (OUTPUT_ROOT / "target-native-features-v2-manifest.json").relative_to(CASE_ROOT).as_posix(),
        "rule": "02 owns all skin; 03 mouth pixels must be center-connected local-skin outliers that do not touch the extraction ROI boundary",
    }
    case_manifest["acceptance"]["semanticOcclusionCandidate"] = acceptance["semanticOcclusionCandidate"]
    case_manifest["acceptance"]["targetNativeFeatureCandidate"] = acceptance["targetNativeFeatureCandidate"]
    case_manifest["acceptance"]["targetNativeFeatureCandidateV2"] = acceptance["targetNativeFeatureCandidateV2"]

    for label, expression in metadata["expressions"].items():
        case_manifest["outputs"][label][candidate_key] = expression["regions"]
        for frame in expression["frames"]:
            entry = case_manifest["frames"][f"{label}-frame-{frame['frame']}"]
            entry["stages"]["candidate"][candidate_key] = frame["candidate"]
            entry["stages"]["feature_mask_v2"] = frame["ownership"]
            entry["boundaryMetrics"][candidate_key] = {
                "status": "not-applicable-sparse-feature-candidate",
                "label": "02 原生边界 + 稀疏特征 · 仅由人工看原尺寸画面",
                "reason": "Native target atlas pixels own every window edge and the chin; feature placement and expression quality still require human review.",
            }

    case_manifest["reviewSheets"][candidate_key] = metadata["reviewSheets"]
    manifest_text = json.dumps(case_manifest, ensure_ascii=False, indent=2)
    manifest_path.write_text(manifest_text, encoding="utf-8")
    (CASE_ROOT / "case-data.js").write_text(f"window.HARUNA_CASE = {manifest_text};\n", encoding="utf-8")


if __name__ == "__main__":
    main()
