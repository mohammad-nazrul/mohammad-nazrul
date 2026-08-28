"""Render an ASCII-art text file to a self-contained SVG.

Colors are baked in, so the result looks identical in GitHub's light and dark
themes -- unlike a fenced code block, which flips with the viewer's theme.
"""
import argparse

MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'DejaVu Sans Mono',monospace"


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def build(lines, fs, pad, bg, top, bottom, radius, glow, frame=0,
          frame_a="#9B5CFF", frame_b="#39FF14"):
    cw, ch = fs * 0.6, fs * 1.2          # matches the 0.5 char-aspect used to sample
    w = max(len(l) for l in lines)
    W = round(w * cw + pad * 2)
    H = round(len(lines) * ch + pad * 2)

    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}" role="img" aria-label="ASCII-art portrait">',
        "<defs>",
        f'<linearGradient id="ink" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="{top}"/>'
        f'<stop offset="1" stop-color="{bottom}"/></linearGradient>',
        f'<linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{frame_a}"/>'
        f'<stop offset="1" stop-color="{frame_b}"/></linearGradient>',
    ]
    if glow:
        out.append(
            f'<filter id="glow" x="-5%" y="-5%" width="110%" height="110%">'
            f'<feGaussianBlur stdDeviation="{glow}" result="b"/>'
            f'<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>'
            f"</filter>")
    out.append("</defs>")
    if frame:
        # gradient ring: fill the full box, then inset the page over it
        out.append(f'<rect width="{W}" height="{H}" rx="{radius}" fill="url(#edge)"/>')
        out.append(f'<rect x="{frame}" y="{frame}" width="{W - 2 * frame}" '
                   f'height="{H - 2 * frame}" rx="{max(0, radius - frame)}" fill="{bg}"/>')
    else:
        out.append(f'<rect width="{W}" height="{H}" rx="{radius}" fill="{bg}"/>')

    g = (f'<g font-family="{MONO}" font-size="{fs}" fill="url(#ink)" '
         f'xml:space="preserve"' + (' filter="url(#glow)"' if glow else "") + ">")
    out.append(g)
    for i, line in enumerate(lines):
        content = line.strip()
        if not content:
            continue
        col = len(line) - len(line.lstrip())
        y = round(pad + (i + 0.82) * ch, 2)
        # Anchor each row at its first real glyph and pin the span of *that* run.
        # Padding rows to full width and pinning the whole line does not work:
        # renderers discard trailing spaces when measuring, so sparse rows get
        # stretched across the full box.
        out.append(f'<text x="{round(pad + col * cw, 2)}" y="{y}" '
                   f'textLength="{round(len(content) * cw, 2)}" '
                   f'lengthAdjust="spacing">{esc(content)}</text>')
    out.append("</g></svg>")
    return "\n".join(out)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("txt")
    p.add_argument("-o", "--out", required=True)
    p.add_argument("--font-size", type=float, default=12)
    p.add_argument("--pad", type=float, default=22)
    p.add_argument("--bg", default="#0A0D0A")
    p.add_argument("--top", default="#9B5CFF")
    p.add_argument("--bottom", default="#39FF14")
    p.add_argument("--radius", type=float, default=10)
    p.add_argument("--glow", type=float, default=0.6, help="0 disables")
    p.add_argument("--frame", type=float, default=0, help="gradient border width")
    a = p.parse_args()

    with open(a.txt, encoding="utf-8") as f:
        lines = [l.rstrip("\n") for l in f if l.strip()]
    svg = build(lines, a.font_size, a.pad, a.bg, a.top, a.bottom, a.radius,
                a.glow, a.frame)
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(svg + "\n")
    print(f"wrote {a.out}")
