"""Convert raster images in a folder to SVG files.

Photos are wrapped as SVG <image> elements (embedded base64) so the result
stays a valid .svg without extra tracing libraries.
"""

from __future__ import annotations

import argparse
import base64
import mimetypes
import sys
from pathlib import Path

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}


def png_size(data: bytes) -> tuple[int, int]:
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")


def gif_size(data: bytes) -> tuple[int, int]:
    if data[:6] not in (b"GIF87a", b"GIF89a"):
        raise ValueError("not a GIF")
    return int.from_bytes(data[6:8], "little"), int.from_bytes(data[8:10], "little")


def bmp_size(data: bytes) -> tuple[int, int]:
    if data[:2] != b"BM":
        raise ValueError("not a BMP")
    return int.from_bytes(data[18:22], "little"), abs(int.from_bytes(data[22:26], "little", signed=True))


def jpeg_size(data: bytes) -> tuple[int, int]:
    if data[:2] != b"\xff\xd8":
        raise ValueError("not a JPEG")
    index = 2
    while index < len(data) - 8:
        if data[index] != 0xFF:
            index += 1
            continue
        marker = data[index + 1]
        if marker in (0xC0, 0xC1, 0xC2, 0xC3):
            height = int.from_bytes(data[index + 5 : index + 7], "big")
            width = int.from_bytes(data[index + 7 : index + 9], "big")
            return width, height
        if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
            index += 2
            continue
        length = int.from_bytes(data[index + 2 : index + 4], "big")
        index += 2 + length
    raise ValueError("JPEG size marker not found")


def webp_size(data: bytes) -> tuple[int, int]:
    if data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise ValueError("not a WebP")
    kind = data[12:16]
    if kind == b"VP8X":
        width = 1 + int.from_bytes(data[24:27], "little")
        height = 1 + int.from_bytes(data[27:30], "little")
        return width, height
    if kind == b"VP8L":
        bits = int.from_bytes(data[21:25], "little")
        return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    if kind == b"VP8 ":
        start = 20
        if data[start] != 0x9D:
            start = data.find(b"\x9d\x01\x2a")
            if start < 0:
                raise ValueError("WebP VP8 frame not found")
        width = int.from_bytes(data[start + 3 : start + 5], "little") & 0x3FFF
        height = int.from_bytes(data[start + 5 : start + 7], "little") & 0x3FFF
        return width, height
    raise ValueError(f"unsupported WebP type {kind!r}")


def image_size(path: Path, data: bytes) -> tuple[int, int]:
    suffix = path.suffix.lower()
    readers = {
        ".png": png_size,
        ".jpg": jpeg_size,
        ".jpeg": jpeg_size,
        ".gif": gif_size,
        ".bmp": bmp_size,
        ".webp": webp_size,
    }
    reader = readers.get(suffix)
    if not reader:
        raise ValueError(f"unsupported type {suffix}")
    return reader(data)


def to_svg(path: Path) -> str:
    data = path.read_bytes()
    width, height = image_size(path, data)
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    payload = base64.b64encode(data).decode("ascii")
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}">\n'
        f'  <image width="{width}" height="{height}" href="data:{mime};base64,{payload}" '
        'preserveAspectRatio="xMidYMid meet"/>\n'
        "</svg>\n"
    )


def convert_folder(source: Path, dest: Path, force: bool) -> int:
    dest.mkdir(parents=True, exist_ok=True)
    converted = 0
    files = sorted(
        path
        for path in source.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
    )
    if not files:
        print(f"No raster images found in {source}")
        return 0

    for path in files:
        out = dest / f"{path.stem}.svg"
        if out.exists() and not force:
            print(f"skip  {path.name} (already exists)")
            continue
        try:
            out.write_text(to_svg(path), encoding="utf-8")
        except Exception as exc:
            print(f"fail  {path.name}: {exc}", file=sys.stderr)
            continue
        print(f"ok    {path.name} -> {out.relative_to(source.parent) if dest.is_relative_to(source.parent) else out}")
        converted += 1
    return converted


def parse_args() -> argparse.Namespace:
    root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Convert images in a folder to SVG.")
    parser.add_argument(
        "source",
        nargs="?",
        default=root / "Images",
        type=Path,
        help="Folder of JPG/PNG/GIF/WebP/BMP files (default: Images)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Output folder (default: <source>/svg)",
    )
    parser.add_argument("-f", "--force", action="store_true", help="Overwrite existing SVG files")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source = args.source.resolve()
    if not source.is_dir():
        print(f"Folder not found: {source}", file=sys.stderr)
        return 1
    dest = (args.output or (source / "svg")).resolve()
    count = convert_folder(source, dest, args.force)
    print(f"Converted {count} image(s) to SVG in {dest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
