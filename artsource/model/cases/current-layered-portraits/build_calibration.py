#!/usr/bin/env python3
"""Build deterministic review artifacts for the current official portrait batch.

This script never rewrites source PNGs and never registers a character in the
GAL runtime.  It validates the authoritative coordinate CSV, composes the
legacy atlases exactly as the browser renderer does, and emits calibration-only
manifests plus human-review images.
"""

from __future__ import annotations

import csv
import hashlib
import json
import shutil
import sys
from pathlib import Path
from typing import Any
from urllib.parse import quote

from PIL import Image, ImageChops, ImageDraw, ImageFont


CASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = CASE_DIR / "case-config.json"
OUTPUT_DIR = CASE_DIR / "outputs"
MANIFEST_DIR = OUTPUT_DIR / "manifests"
REVIEW_DIR = OUTPUT_DIR / "review"

REGION_KINDS = ("eyes", "mouth")
SOURCE_SUFFIX = {"eyes": "eye", "mouth": "mouth"}
BACKGROUND_COLORS = {
    "white": (255, 255, 255, 255),
    "black": (0, 0, 0, 255),
    "pink": (255, 31, 150, 255),
    "blue": (8, 104, 255, 255),
}
DEMONSTRATION_SEQUENCE = (
    {"eyes": 0, "mouth": 0},
    {"eyes": 1, "mouth": 0},
    {"eyes": 2, "mouth": 0},
    {"eyes": 1, "mouth": 0},
    {"eyes": 0, "mouth": 0},
    {"eyes": 0, "mouth": 1},
    {"eyes": 0, "mouth": 2},
    {"eyes": 0, "mouth": 1},
    {"eyes": 0, "mouth": 0},
)


def fail(message: str) -> None:
    raise RuntimeError(message)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def reset_output_directory() -> None:
    resolved_case = CASE_DIR.resolve()
    resolved_output = OUTPUT_DIR.resolve()
    if resolved_output.parent != resolved_case or resolved_output.name != "outputs":
        fail(f"refusing to reset unexpected output path: {resolved_output}")
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def png_info(path: Path) -> dict[str, Any]:
    with Image.open(path) as image:
        rgba = image.convert("RGBA")
        alpha = rgba.getchannel("A")
        return {
            "width": rgba.width,
            "height": rgba.height,
            "mode": image.mode,
            "alphaExtrema": list(alpha.getextrema()),
            "alphaBounds": list(alpha.getbbox()) if alpha.getbbox() else None,
            "sha256": sha256(path),
        }


def basename(value: str) -> str:
    return Path(value.replace("\\", "/")).name


def encoded_runtime_path(base_path: str, filename: str) -> str:
    return f"{base_path.rstrip('/')}/{quote(filename, safe='._-')}"


def load_coordinate_records(csv_path: Path, family_id: str) -> list[dict[str, str]]:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = [
            row
            for row in csv.DictReader(handle)
            if row.get("record_type") == "atlas_pair" and row.get("family_id") == family_id
        ]
    if not rows:
        fail(f"{family_id}: coordinate CSV contains no atlas_pair rows")
    return rows


def unique_value(rows: list[dict[str, str]], field: str) -> str:
    values = {row.get(field, "") for row in rows}
    if len(values) != 1:
        fail(f"{rows[0]['family_id']}: {field} is not unique: {sorted(values)}")
    return next(iter(values))


def integer_value(rows: list[dict[str, str]], field: str) -> int:
    return int(unique_value(rows, field))


def atlas_filename(family_id: str, expression: str, kind: str) -> str:
    return f"{family_id}_{expression}_{SOURCE_SUFFIX[kind]}.png"


def assert_dimensions(label: str, info: dict[str, Any], expected: dict[str, int]) -> None:
    observed = (info["width"], info["height"])
    wanted = (expected["width"], expected["height"])
    if observed != wanted:
        fail(f"{label}: expected {wanted[0]}x{wanted[1]}, got {observed[0]}x{observed[1]}")


def prepare_character(config: dict[str, Any], csv_path: Path, expected_dimensions: dict[str, Any]) -> dict[str, Any]:
    family_id = config["familyId"]
    rows = load_coordinate_records(csv_path, family_id)
    expected_expressions = list(config["expressions"])
    csv_expressions = sorted({row["expression_id"] for row in rows})
    if csv_expressions != sorted(expected_expressions):
        fail(f"{family_id}: CSV expressions {csv_expressions} != config {sorted(expected_expressions)}")

    for row in rows:
        if row["coordinate_status"] != "resolved" or row["official_face_enabled"].lower() != "true":
            fail(f"{family_id}/{row['expression_id']}: official coordinate row is not resolved and enabled")

    canvas = {
        "width": integer_value(rows, "canvas_width"),
        "height": integer_value(rows, "canvas_height"),
        "origin": "top-left",
        "axes": "x-right-y-down",
    }
    regions = {
        "eyes": {
            "x": integer_value(rows, "eye_x"),
            "y": integer_value(rows, "eye_y"),
            "width": integer_value(rows, "eye_width"),
            "height": integer_value(rows, "eye_height"),
            "feather": 0,
        },
        "mouth": {
            "x": integer_value(rows, "mouth_x"),
            "y": integer_value(rows, "mouth_y"),
            "width": integer_value(rows, "mouth_width"),
            "height": integer_value(rows, "mouth_height"),
            "feather": 0,
        },
    }
    if (canvas["width"], canvas["height"]) != (
        expected_dimensions["body"]["width"],
        expected_dimensions["body"]["height"],
    ):
        fail(f"{family_id}: unexpected logical canvas {canvas}")

    asset_dir = (CASE_DIR / config["assetDirectory"]).resolve()
    body_path = asset_dir / config["body"]
    mask_path = asset_dir / config["mask"]
    if not body_path.is_file() or not mask_path.is_file():
        fail(f"{family_id}: body or mask is missing")
    if basename(unique_value(rows, "body_file")) != config["body"]:
        fail(f"{family_id}: configured body does not match coordinate CSV")
    if basename(unique_value(rows, "mask_file")) != config["mask"]:
        fail(f"{family_id}: configured mask does not match coordinate CSV")

    source_files: dict[str, dict[str, Any]] = {
        "body": {"name": config["body"], "path": body_path, "info": png_info(body_path)},
        "mask": {"name": config["mask"], "path": mask_path, "info": png_info(mask_path)},
    }
    assert_dimensions(f"{family_id} body", source_files["body"]["info"], expected_dimensions["body"])
    assert_dimensions(f"{family_id} mask", source_files["mask"]["info"], expected_dimensions["mask"])
    if source_files["body"]["info"]["alphaExtrema"] != [255, 255]:
        fail(f"{family_id}: body must be fully opaque before the mask is applied")
    if source_files["mask"]["info"]["alphaExtrema"] == [255, 255]:
        fail(f"{family_id}: mask alpha contains no transparent pixels")

    declared_missing = {
        expression: sorted(kinds) for expression, kinds in config.get("declaredMissing", {}).items()
    }
    expression_records: dict[str, Any] = {}
    observed_missing: dict[str, list[str]] = {}
    for expression in expected_expressions:
        files: dict[str, Any] = {}
        missing: list[str] = []
        for kind in REGION_KINDS:
            filename = atlas_filename(family_id, expression, kind)
            path = asset_dir / filename
            if not path.is_file():
                missing.append(kind)
                files[kind] = None
                continue
            info = png_info(path)
            assert_dimensions(f"{family_id}/{expression} {kind}", info, expected_dimensions[kind])
            files[kind] = {"name": filename, "path": path, "info": info}
        if missing:
            observed_missing[expression] = sorted(missing)
        expected_missing = declared_missing.get(expression, [])
        if sorted(missing) != expected_missing:
            fail(
                f"{family_id}/{expression}: observed missing {sorted(missing)} "
                f"!= declared {expected_missing}"
            )
        expression_records[expression] = {
            "status": "complete" if not missing else "incomplete",
            "missing": sorted(missing),
            "files": files,
        }

    if set(declared_missing) - set(expected_expressions):
        fail(f"{family_id}: declaredMissing contains unknown expressions")
    default_expression = config["defaultExpressionId"]
    if expression_records[default_expression]["status"] != "complete":
        fail(f"{family_id}: default expression {default_expression} is incomplete")

    return {
        "config": config,
        "rows": rows,
        "assetDir": asset_dir,
        "canvas": canvas,
        "regions": regions,
        "sourceFiles": source_files,
        "expressions": expression_records,
        "observedMissing": observed_missing,
        "coordinateEvidence": {
            "recordCount": len(rows),
            "coordinateStatus": unique_value(rows, "coordinate_status"),
            "officialFaceEnabled": unique_value(rows, "official_face_enabled").lower() == "true",
            "coordinateSource": unique_value(rows, "coordinate_source"),
            "eyeCoordinateMethod": unique_value(rows, "eye_coord_method"),
            "mouthCoordinateMethod": unique_value(rows, "mouth_coord_method"),
            "eyeEdgeMse": float(unique_value(rows, "eye_edge_mse")),
            "mouthEdgeMse": float(unique_value(rows, "mouth_edge_mse")),
        },
    }


def resized_frame(path: Path, region: dict[str, int], frame: int, frame_count: int) -> Image.Image:
    with Image.open(path) as image:
        atlas = image.convert("RGBA").resize(
            (region["width"], region["height"] * frame_count),
            Image.Resampling.BILINEAR,
        )
    top = frame * region["height"]
    return atlas.crop((0, top, region["width"], top + region["height"]))


def compose(
    prepared: dict[str, Any],
    expression: str,
    eye_frame: int | None,
    mouth_frame: int | None,
) -> Image.Image:
    with Image.open(prepared["sourceFiles"]["body"]["path"]) as source:
        composite = source.convert("RGBA")
    expression_record = prepared["expressions"][expression]
    for kind, frame in (("eyes", eye_frame), ("mouth", mouth_frame)):
        file_record = expression_record["files"][kind]
        if frame is None or file_record is None:
            continue
        region = prepared["regions"][kind]
        patch = resized_frame(file_record["path"], region, frame, 3)
        composite.alpha_composite(patch, (region["x"], region["y"]))

    with Image.open(prepared["sourceFiles"]["mask"]["path"]) as mask_source:
        mask_alpha = mask_source.convert("RGBA").getchannel("A").resize(composite.size, Image.Resampling.BILINEAR)
    composite.putalpha(ImageChops.multiply(composite.getchannel("A"), mask_alpha))
    return composite


def label(draw: ImageDraw.ImageDraw, text: str, xy: tuple[int, int]) -> None:
    draw.rectangle((xy[0] - 4, xy[1] - 3, xy[0] + max(40, len(text) * 7) + 4, xy[1] + 14), fill=(8, 10, 14, 220))
    draw.text(xy, text, fill=(255, 255, 255, 255), font=ImageFont.load_default())


def build_expression_review(prepared: dict[str, Any]) -> Path:
    config = prepared["config"]
    family_id = config["familyId"]
    eye_y = prepared["regions"]["eyes"]["y"]
    mouth_y = prepared["regions"]["mouth"]["y"]
    crop_box = (300, max(0, eye_y - 110), 720, min(1024, mouth_y + 145))
    crop_width = crop_box[2] - crop_box[0]
    crop_height = crop_box[3] - crop_box[1]
    panel_width = crop_width + 20
    panel_height = crop_height + 34
    expression_height = panel_height * 2
    sheet = Image.new(
        "RGBA",
        (panel_width * 3, expression_height * len(config["expressions"])),
        (18, 21, 27, 255),
    )
    for expression_index, expression in enumerate(config["expressions"]):
        record = prepared["expressions"][expression]
        status = record["status"]
        for lane_index, varying_kind in enumerate(REGION_KINDS):
            for frame in range(3):
                eye_frame = frame if varying_kind == "eyes" and record["files"]["eyes"] else 0
                mouth_frame = frame if varying_kind == "mouth" and record["files"]["mouth"] else 0
                if record["files"]["eyes"] is None:
                    eye_frame = None
                if record["files"]["mouth"] is None:
                    mouth_frame = None
                composite = compose(prepared, expression, eye_frame, mouth_frame)
                crop = composite.crop(crop_box)
                x = frame * panel_width + 10
                y = expression_index * expression_height + lane_index * panel_height + 28
                sheet.alpha_composite(crop, (x, y))
                missing = ",".join(record["missing"]) if record["missing"] else "none"
                text = f"{expression} {varying_kind}[{frame}] {status} missing={missing}"
                label(ImageDraw.Draw(sheet), text, (frame * panel_width + 8, expression_index * expression_height + lane_index * panel_height + 7))
    path = REVIEW_DIR / f"{config['id']}-expression-frame-review.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, optimize=False)
    return path


def build_mask_review(prepared: dict[str, Any]) -> Path:
    config = prepared["config"]
    expression = config["defaultExpressionId"]
    portrait = compose(prepared, expression, 0, 0).resize((512, 512), Image.Resampling.LANCZOS)
    sheet = Image.new("RGBA", (1024, 1024), (0, 0, 0, 255))
    for index, (name, color) in enumerate(BACKGROUND_COLORS.items()):
        panel = Image.new("RGBA", (512, 512), color)
        panel.alpha_composite(portrait)
        label(ImageDraw.Draw(panel), f"{config['id']} mask on {name}", (10, 10))
        sheet.alpha_composite(panel, ((index % 2) * 512, (index // 2) * 512))
    path = REVIEW_DIR / f"{config['id']}-mask-background-review.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, optimize=False)
    return path


def build_neutral_contact(prepared_characters: list[dict[str, Any]]) -> Path:
    panel_width, panel_height = 512, 552
    sheet = Image.new("RGBA", (panel_width * 2, panel_height * 2), (18, 21, 27, 255))
    for index, prepared in enumerate(prepared_characters):
        config = prepared["config"]
        expression = config["defaultExpressionId"]
        portrait = compose(prepared, expression, 0, 0).resize((512, 512), Image.Resampling.LANCZOS)
        panel = Image.new("RGBA", (panel_width, panel_height), (18, 21, 27, 255))
        panel.alpha_composite(portrait)
        eyes = prepared["regions"]["eyes"]
        mouth = prepared["regions"]["mouth"]
        label(
            ImageDraw.Draw(panel),
            f"{config['id']} {config['familyId']} eyes={eyes['x']},{eyes['y']},{eyes['width']},{eyes['height']} mouth={mouth['x']},{mouth['y']},{mouth['width']},{mouth['height']}",
            (8, 526),
        )
        sheet.alpha_composite(panel, ((index % 2) * panel_width, (index // 2) * panel_height))
    path = REVIEW_DIR / "four-portrait-neutral-contact.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, optimize=False)
    return path


def build_motion_sequence(prepared: dict[str, Any]) -> Path:
    """Render one row-major nine-frame viewing sequence for the default pair.

    The ordering is a calibration demonstration chosen for legibility.  It is
    not evidence of the original game's timing or expression semantics.
    """

    config = prepared["config"]
    expression = config["defaultExpressionId"]
    eye_y = prepared["regions"]["eyes"]["y"]
    mouth_y = prepared["regions"]["mouth"]["y"]
    crop_box = (300, max(0, eye_y - 110), 720, min(1024, mouth_y + 145))
    crop_width = crop_box[2] - crop_box[0]
    crop_height = crop_box[3] - crop_box[1]
    panel_width = crop_width + 20
    panel_height = crop_height + 38
    header_height = 34
    sheet = Image.new(
        "RGBA",
        (panel_width * 3, header_height + panel_height * 3),
        (18, 21, 27, 255),
    )
    draw = ImageDraw.Draw(sheet)
    label(
        draw,
        f"{config['id']}/{expression} viewing sequence only; original timing and semantics unverified",
        (8, 8),
    )
    for index, frame in enumerate(DEMONSTRATION_SEQUENCE):
        composite = compose(prepared, expression, frame["eyes"], frame["mouth"])
        crop = composite.crop(crop_box)
        column = index % 3
        row = index // 3
        panel_x = column * panel_width
        panel_y = header_height + row * panel_height
        sheet.alpha_composite(crop, (panel_x + 10, panel_y + 30))
        label(
            ImageDraw.Draw(sheet),
            f"{index + 1:02d}/09 eyes[{frame['eyes']}] mouth[{frame['mouth']}]",
            (panel_x + 8, panel_y + 7),
        )
    path = REVIEW_DIR / f"{config['id']}-default-motion-sequence.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, optimize=False)
    return path


def expression_manifest(prepared: dict[str, Any], expression: str) -> dict[str, Any]:
    config = prepared["config"]
    record = prepared["expressions"][expression]
    files: dict[str, str | None] = {}
    for kind in REGION_KINDS:
        file_record = record["files"][kind]
        files[kind] = (
            encoded_runtime_path(config["runtimeBasePath"], file_record["name"]) if file_record else None
        )
    return {
        "id": expression,
        "status": record["status"],
        "eyes": files["eyes"],
        "mouth": files["mouth"],
        "missing": record["missing"],
        "blinking": "pending-human-semantic-review",
        "promotionAllowed": False,
    }


def build_model_manifest(
    prepared: dict[str, Any],
    expected_dimensions: dict[str, Any],
    selected_expression: str | None = None,
) -> dict[str, Any]:
    config = prepared["config"]
    default_expression = selected_expression or config["defaultExpressionId"]
    if prepared["expressions"][default_expression]["status"] != "complete":
        fail(f"{config['familyId']}/{default_expression}: cannot emit a loadable manifest for an incomplete pair")
    default_record = expression_manifest(prepared, default_expression)
    body_path = encoded_runtime_path(config["runtimeBasePath"], config["body"])
    mask_path = encoded_runtime_path(config["runtimeBasePath"], config["mask"])
    regions = {
        kind: {key: value for key, value in prepared["regions"][kind].items() if key != "feather"}
        | {"feather": 0}
        for kind in REGION_KINDS
    }
    return {
        "schemaVersion": 1,
        "id": f"{config['familyId']}-{default_expression}" if selected_expression else config["familyId"],
        "characterId": config["id"],
        "displayName": config["displayName"],
        "status": "calibration-only-awaiting-human-review",
        "promotionAllowed": False,
        "runtimeRegistration": "not-connected",
        "formatProfile": "legacy-compatible",
        "canvas": {"width": prepared["canvas"]["width"], "height": prepared["canvas"]["height"]},
        "files": {
            "body": body_path,
            "mask": mask_path,
            "eyes": default_record["eyes"],
            "mouth": default_record["mouth"],
        },
        "expectedDimensions": expected_dimensions,
        "regions": regions,
        "frameCount": {"eyes": 3, "mouth": 3},
        "defaultExpressionId": default_expression,
        "expression": {
            "id": default_expression,
            "eyes": default_record["eyes"],
            "mouth": default_record["mouth"],
            "blinking": True,
            "blinkingReview": "pending-human-semantic-review",
        },
        "expressions": {
            expression: expression_manifest(prepared, expression)
            for expression in config["expressions"]
        },
        "calibrationNotes": {
            "layerOrder": ["body", "eyes", "mouth", "full-composite-alpha-mask"],
            "galStage": "not-authoritative-and-not-part-of-rig",
            "incompleteExpressions": "diagnostic-only",
        },
    }


def source_evidence(prepared: dict[str, Any], csv_path: Path) -> dict[str, Any]:
    config = prepared["config"]
    expressions: dict[str, Any] = {}
    for expression, record in prepared["expressions"].items():
        expressions[expression] = {
            "status": record["status"],
            "missing": record["missing"],
            "files": {
                kind: file_record["info"] if file_record else None
                for kind, file_record in record["files"].items()
            },
        }
    return {
        "familyId": config["familyId"],
        "coordinateMap": {
            "path": "../../official-face-coordinate-map.csv",
            "sha256": sha256(csv_path),
            **prepared["coordinateEvidence"],
        },
        "body": prepared["sourceFiles"]["body"]["info"],
        "mask": prepared["sourceFiles"]["mask"]["info"],
        "expressions": expressions,
    }


def main() -> int:
    config = read_json(CONFIG_PATH)
    csv_path = (CASE_DIR / config["coordinateMap"]).resolve()
    if not csv_path.is_file():
        fail(f"coordinate map not found: {csv_path}")
    expected_dimensions = config["expectedDimensions"]
    prepared_characters = [
        prepare_character(character, csv_path, expected_dimensions)
        for character in config["characters"]
    ]

    reset_output_directory()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST_DIR.mkdir(parents=True, exist_ok=True)
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)

    combined_characters: dict[str, Any] = {}
    review_files: list[str] = []
    for prepared in prepared_characters:
        config_item = prepared["config"]
        model_manifest = build_model_manifest(prepared, expected_dimensions)
        manifest_path = MANIFEST_DIR / f"{config_item['id']}-{config_item['familyId']}.portrait.json"
        write_json(manifest_path, model_manifest)
        expression_manifest_paths: dict[str, str] = {}
        expression_manifest_dir = MANIFEST_DIR / config_item["id"]
        for expression, record in prepared["expressions"].items():
            if record["status"] != "complete":
                continue
            expression_path = expression_manifest_dir / f"{config_item['familyId']}-{expression}.portrait.json"
            write_json(
                expression_path,
                build_model_manifest(prepared, expected_dimensions, selected_expression=expression),
            )
            expression_manifest_paths[expression] = expression_path.relative_to(CASE_DIR).as_posix()
        expression_review = build_expression_review(prepared)
        mask_review = build_mask_review(prepared)
        motion_review = build_motion_sequence(prepared)
        review_files.extend(
            [
                expression_review.relative_to(CASE_DIR).as_posix(),
                mask_review.relative_to(CASE_DIR).as_posix(),
                motion_review.relative_to(CASE_DIR).as_posix(),
            ]
        )
        combined_characters[config_item["id"]] = {
            "manifest": manifest_path.relative_to(CASE_DIR).as_posix(),
            "expressionManifests": expression_manifest_paths,
            "modelManifest": model_manifest,
            "sourceEvidence": source_evidence(prepared, csv_path),
        }

    neutral_contact = build_neutral_contact(prepared_characters)
    review_files.append(neutral_contact.relative_to(CASE_DIR).as_posix())
    combined_manifest = {
        "schemaVersion": 1,
        "caseId": config["caseId"],
        "generatedFor": "2026-08-10",
        "classification": "layered-sprite-atlas",
        "status": "calibration-generated-human-review-pending",
        "promotionAllowed": False,
        "runtimeRegistration": "not-connected",
        "sourceAssetMutation": False,
        "coordinateAuthority": {
            "path": "../../official-face-coordinate-map.csv",
            "sha256": sha256(csv_path),
            "selection": "record_type=atlas_pair AND exact family_id",
        },
        "sampling": {
            "mask": "full-stage alpha; bilinear 512x512 -> 1024x1024",
            "eyes": "bilinear full atlas 256x512 -> 230x393, then explicit 131px frame crops",
            "mouth": "bilinear full atlas 256x256 -> 230x171, then explicit 57px frame crops",
            "layerOrder": ["body", "eyes", "mouth", "full-composite-alpha-mask"],
        },
        "demonstrationSequence": {
            "purpose": "static-row-major-viewing-sequence",
            "officialTimingEvidence": False,
            "expressionSemanticsEvidence": False,
            "frames": list(DEMONSTRATION_SEQUENCE),
        },
        "characters": combined_characters,
        "reviewArtifacts": sorted(review_files),
        "humanReview": {
            "status": "pending",
            "acceptanceContract": "../acceptance-contract.json",
            "expressionSemantics": "unassigned",
            "runtimePromotion": "complete-pairs-require-explicit-human-acceptance; incomplete-pairs-also-require-exact-missing-layer-repair",
        },
    }
    combined_path = OUTPUT_DIR / "calibration-manifest.json"
    write_json(combined_path, combined_manifest)

    complete_count = sum(
        1
        for prepared in prepared_characters
        for record in prepared["expressions"].values()
        if record["status"] == "complete"
    )
    incomplete_count = sum(len(prepared["observedMissing"]) for prepared in prepared_characters)
    print(
        f"PASS: {len(prepared_characters)} families, {complete_count} complete expression pairs, "
        f"{incomplete_count} incomplete diagnostics"
    )
    print(f"manifest: {combined_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # keep CLI failure concise and visible
        print(f"FAIL: {error}", file=sys.stderr)
        raise
