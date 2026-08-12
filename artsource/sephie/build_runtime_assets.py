from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


ROOT = Path(__file__).resolve().parent
CANVAS_SIZE = (1024, 1024)
BACKGROUND_EDGE_WIDTH = 160
BACKGROUND_DISTANCE = 13.0
MIN_FOREGROUND_COMPONENT = 20
MAX_HAIR_GAP_AREA = 4000
BODY_OPAQUE_FROM_Y = 370


def build_runtime_body() -> None:
    source = Image.open(ROOT / "sources" / "sephie_master_face_veil_source.png").convert("RGB")
    source = source.resize(CANVAS_SIZE, Image.Resampling.LANCZOS)
    source_rgb = np.asarray(source).astype(np.float32)

    # The approved source has a nearly flat warm background. Estimate it per row
    # from both outer edges, then segment the character directly from that source.
    edge_samples = np.concatenate(
        (source_rgb[:, :BACKGROUND_EDGE_WIDTH], source_rgb[:, -BACKGROUND_EDGE_WIDTH:]), axis=1
    )
    background = np.median(edge_samples, axis=1)[:, np.newaxis, :]
    color_distance = np.linalg.norm(source_rgb - background, axis=2)
    foreground = color_distance > BACKGROUND_DISTANCE

    labels, _ = ndimage.label(foreground, structure=np.ones((3, 3), dtype=np.uint8))
    component_sizes = np.bincount(labels.ravel())
    kept_components = np.flatnonzero(component_sizes >= MIN_FOREGROUND_COMPONENT)
    kept_components = kept_components[kept_components != 0]
    silhouette = np.isin(labels, kept_components)

    filled = ndimage.binary_fill_holes(silhouette)
    holes, hole_count = ndimage.label(filled & ~silhouette, structure=np.ones((3, 3), dtype=np.uint8))
    hole_sizes = np.bincount(holes.ravel())
    repaired = silhouette.copy()
    for hole_id in range(1, hole_count + 1):
        y, _ = np.where(holes == hole_id)
        is_body_hole = y.size and y.max() >= BODY_OPAQUE_FROM_Y
        is_tiny_hair_noise = hole_sizes[hole_id] <= MAX_HAIR_GAP_AREA and y.size and y.min() < BODY_OPAQUE_FROM_Y
        if is_body_hole or is_tiny_hair_noise:
            repaired |= holes == hole_id

    # White costume pixels are too close to the warm source background for color
    # separation alone. This polygon covers only the solid torso/skirt core, not
    # the transparent gaps between the outer hair strands.
    body_core_image = Image.new("1", CANVAS_SIZE, 0)
    ImageDraw.Draw(body_core_image).polygon(
        [
            (382, 292),
            (642, 292),
            (711, 395),
            (690, 610),
            (784, 1023),
            (238, 1023),
            (330, 610),
            (313, 395),
        ],
        fill=1,
    )
    repaired |= np.asarray(body_core_image, dtype=bool)

    # Keep the interior fully opaque. Only the outer one-pixel boundary uses the
    # source/background color distance for antialiasing, avoiding a beige fringe.
    interior_distance = ndimage.distance_transform_edt(repaired)
    runtime_alpha = np.zeros(CANVAS_SIZE[::-1], dtype=np.uint8)
    runtime_alpha[interior_distance > 1.0] = 255
    boundary = repaired & (interior_distance <= 1.0)
    edge_alpha = np.clip((color_distance - 2.0) / 12.0, 0.0, 1.0)
    runtime_alpha[boundary] = np.rint(edge_alpha[boundary] * 255).astype(np.uint8)

    body = np.asarray(source).copy()
    # Remove the source background tint from antialiased edge pixels by borrowing
    # RGB from their nearest fully opaque neighbor. Alpha still carries the edge.
    semitransparent = (runtime_alpha > 0) & (runtime_alpha < 255)
    if semitransparent.any():
        _, nearest = ndimage.distance_transform_edt(runtime_alpha < 255, return_indices=True)
        body[semitransparent] = body[nearest[0][semitransparent], nearest[1][semitransparent]]
    body = np.dstack((body, runtime_alpha))
    Image.fromarray(body, "RGBA").save(ROOT / "sephie_body_runtime_v2.png", optimize=True)


if __name__ == "__main__":
    build_runtime_body()
