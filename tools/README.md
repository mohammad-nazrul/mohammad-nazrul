# tools

Regenerates `assets/portrait-ascii.svg` from the source photo. Requires Pillow.

`asciify.py` turns a photo into ASCII art; `ascii2svg.py` renders that text to an
SVG with baked-in colors, so it looks the same in GitHub's light and dark themes
(a fenced code block would flip with the viewer's theme).

```sh
python tools/asciify.py photo.png -w 76 --crop 0.13,0.03,0.90,0.78 -o portrait.txt
python tools/ascii2svg.py portrait.txt -o assets/portrait-ascii.svg \
  --bg '#EDEFEC' --top '#4C1D95' --bottom '#0A0D0A' \
  --glow 0 --frame 5 --radius 14 --pad 24
```

The `--crop` fractions are tuned to the original passport photo: they trim to
head-and-shoulders so the suit does not swamp the face. Retune for a new source.
Both scripts take `-h`.
