"""Turn a photo into ASCII art. Tuned for studio portraits on a flat backdrop."""
import argparse
from PIL import Image, ImageOps, ImageDraw, ImageFilter

# dark -> light. Curated ramp: avoids chars that read as noise at small sizes.
RAMPS = {
    "dense": "@%#WMB8&$0QOZmwqpdbkhao*+=<>!;:,^`'. ",
    "classic": "@%#*+=-:. ",
    "blocks": "\u2588\u2593\u2592\u2591 ",
}


def kill_backdrop(im, tol, fill=(255, 255, 255)):
    """Flood-fill the studio backdrop, seeding only from border pixels that
    actually match it. Seeding from every corner would eat a dark suit that
    runs off the bottom edge."""
    im = im.convert("RGB")
    w, h = im.size
    # the backdrop is whatever is behind the head, so sample the top corners
    tl, tr = im.getpixel((0, 0)), im.getpixel((w - 1, 0))
    bg = tuple((a + b) // 2 for a, b in zip(tl, tr))

    def matches(p):
        return sum(abs(a - b) for a, b in zip(p, bg)) <= tol * 3

    border = ([(x, 0) for x in range(0, w, 8)] +
              [(x, h - 1) for x in range(0, w, 8)] +
              [(0, y) for y in range(0, h, 8)] +
              [(w - 1, y) for y in range(0, h, 8)])
    for xy in border:
        if matches(im.getpixel(xy)):
            ImageDraw.floodfill(im, xy, fill, thresh=tol)
    return im


def asciify(path, width, ramp, char_aspect, invert, strip_bg, tol, gamma, sharpen,
            crop=None, floor=0):
    im = Image.open(path)
    if crop:
        l, t, r, b = crop
        W, H = im.size
        im = im.crop((round(l * W), round(t * H), round(r * W), round(b * H)))
    if strip_bg:
        # fill with the value the ramp treats as empty, so the silhouette stays clean
        im = kill_backdrop(im, tol, (0, 0, 0) if invert else (255, 255, 255))

    g = im.convert("L")
    if sharpen:
        g = g.filter(ImageFilter.UnsharpMask(radius=3, percent=140, threshold=3))
    g = ImageOps.autocontrast(g, cutoff=1)

    h = max(1, round(width * g.height / g.width * char_aspect))
    g = g.resize((width, h), Image.Resampling.LANCZOS)

    px = list(g.getdata())
    if gamma != 1.0:
        px = [round(255 * ((v / 255) ** gamma)) for v in px]
    if floor:
        # crush near-black fabric noise into one flat tone
        px = [0 if v < floor else round((v - floor) * 255 / (255 - floor)) for v in px]
    if invert:
        px = [255 - v for v in px]

    n = len(ramp)
    rows = []
    for r in range(h):
        row = px[r * width:(r + 1) * width]
        rows.append("".join(ramp[min(n - 1, v * n // 256)] for v in row).rstrip())
    return "\n".join(rows)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("image")
    p.add_argument("-w", "--width", type=int, default=100)
    p.add_argument("-r", "--ramp", default="dense", choices=list(RAMPS))
    p.add_argument("--char-aspect", type=float, default=0.5)
    p.add_argument("--invert", action="store_true", help="for light-on-dark terminals")
    p.add_argument("--keep-bg", action="store_true")
    p.add_argument("--tol", type=int, default=70, help="backdrop flood-fill tolerance")
    p.add_argument("--gamma", type=float, default=1.0)
    p.add_argument("--no-sharpen", action="store_true")
    p.add_argument("--crop", help="L,T,R,B as fractions, e.g. 0.10,0.02,0.92,0.80")
    p.add_argument("--floor", type=int, default=0, help="crush values below this to black")
    p.add_argument("-o", "--out")
    a = p.parse_args()

    crop = tuple(float(v) for v in a.crop.split(",")) if a.crop else None
    art = asciify(a.image, a.width, RAMPS[a.ramp], a.char_aspect,
                  a.invert, not a.keep_bg, a.tol, a.gamma, not a.no_sharpen,
                  crop, a.floor)
    if a.out:
        with open(a.out, "w", encoding="utf-8") as f:
            f.write(art + "\n")
        print(f"wrote {a.out}")
    else:
        print(art)
