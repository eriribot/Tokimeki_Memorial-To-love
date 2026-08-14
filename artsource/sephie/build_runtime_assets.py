from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parent
CANVAS_SIZE = (1024, 1024)
ATLAS_WINDOWS = (
    (400, 90, 225, 145),
    (420, 185, 185, 105),
)


def _borrow_nearest_opaque_rgb(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Remove baked background color from semitransparent foreground edges."""

    height, width = alpha.shape
    visible = alpha > 0
    opaque = alpha >= 240
    owner_y = np.full((height, width), -1, dtype=np.int16)
    owner_x = np.full((height, width), -1, dtype=np.int16)
    queue: deque[tuple[int, int]] = deque()

    ys, xs = np.where(opaque)
    for y, x in zip(ys.tolist(), xs.tolist(), strict=True):
        owner_y[y, x] = y
        owner_x[y, x] = x
        queue.append((y, x))

    while queue:
        y, x = queue.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            next_y, next_x = y + dy, x + dx
            if (
                0 <= next_y < height
                and 0 <= next_x < width
                and visible[next_y, next_x]
                and owner_y[next_y, next_x] < 0
            ):
                owner_y[next_y, next_x] = owner_y[y, x]
                owner_x[next_y, next_x] = owner_x[y, x]
                queue.append((next_y, next_x))

    result = rgb.copy()
    edge = visible & (alpha < 240) & (owner_y >= 0)
    result[edge] = rgb[owner_y[edge], owner_x[edge]]
    result[~visible] = 0
    return result


def build_runtime_body() -> None:
    """Build the transparent runtime portrait without filling real hair gaps."""

    trusted = np.asarray(Image.open(ROOT / "sephie_body_runtime_v7.png").convert("RGBA")).copy()
    cutout = np.asarray(Image.open(ROOT / "sephie_body_runtime_v3.png").convert("RGBA"))
    legacy_alpha = np.asarray(Image.open(ROOT / "sephie_body_alpha.png").convert("RGBA"))[..., 3]
    source = np.asarray(
        Image.open(ROOT / "sources" / "sephie_master_face_veil_source.png")
        .convert("RGB")
        .resize(CANVAS_SIZE, Image.Resampling.LANCZOS),
        dtype=np.int16,
    )

    red, green, blue = source[..., 0], source[..., 1], source[..., 2]
    mean = source.mean(axis=2)
    chroma = source.max(axis=2) - source.min(axis=2)
    confident_detail = (
        ((red - green >= 18) & (red - blue >= 5) & (red >= 120))
        | (mean < 150)
        | (chroma >= 45)
    )

    # V3 supplies the real spaces between hair strands. The legacy alpha restores
    # only high-confidence pink hair and dark linework; broad body polygons and
    # binary hole filling would bring the baked cream background back.
    alpha = cutout[..., 3].copy()
    restore = confident_detail & (legacy_alpha > alpha) & (trusted[..., 3] > 0)
    alpha[restore] = legacy_alpha[restore]
    rgb = _borrow_nearest_opaque_rgb(trusted[..., :3], alpha)
    alpha[alpha < 3] = 0
    alpha[alpha > 252] = 255
    body = np.dstack((rgb, alpha)).astype(np.uint8)

    # Keep the animated eye and mouth atlas windows byte-identical to the trusted
    # body so the rectangular overlays cannot reveal a new seam.
    for x, y, width, height in ATLAS_WINDOWS:
        body[y : y + height, x : x + width] = trusted[y : y + height, x : x + width]
    body[body[..., 3] == 0, :3] = 0

    Image.fromarray(body, "RGBA").save(ROOT / "sephie_body_runtime_v11.png", optimize=True)


if __name__ == "__main__":
    build_runtime_body()
