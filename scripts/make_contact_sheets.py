from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw


def main() -> None:
    source = Path(sys.argv[1]).resolve()
    output = Path(sys.argv[2]).resolve()
    output.mkdir(parents=True, exist_ok=True)
    pages = sorted(source.glob("page-*.png"))
    thumb_w = 612
    thumb_h = 792
    gap = 24
    label_h = 28
    batch_size = 4

    for batch_index in range(0, len(pages), batch_size):
        batch = pages[batch_index : batch_index + batch_size]
        canvas = Image.new("RGB", (thumb_w * 2 + gap * 3, (thumb_h + label_h) * 2 + gap * 3), "#aeb4ba")
        draw = ImageDraw.Draw(canvas)
        for item_index, page_path in enumerate(batch):
            row, col = divmod(item_index, 2)
            x = gap + col * (thumb_w + gap)
            y = gap + row * (thumb_h + label_h + gap)
            with Image.open(page_path) as page:
                page = page.convert("RGB")
                page.thumbnail((thumb_w, thumb_h))
                canvas.paste(page, (x, y))
            draw.text((x, y + thumb_h + 5), page_path.stem, fill="#111827")
        target = output / f"contact-{batch_index // batch_size + 1:02d}.png"
        canvas.save(target, optimize=True)
        print(target)


if __name__ == "__main__":
    main()
