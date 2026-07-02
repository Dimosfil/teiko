import json
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE = Path(__file__).resolve().parent
PRODUCTS = json.loads((BASE / "data" / "products.json").read_text(encoding="ascii"))

REAL_SCREENSHOT_IMAGES = {
    "assets/products/krytex-parfume-10-gold-dust.jpg",
    "assets/products/krytex-parfume-1-blue-sky.jpg",
    "assets/products/krytex-parfume-3-male-soul.jpg",
    "assets/products/krytex-parfume-5-narcotic-flower.jpg",
}

ACCENTS = {
    "Anti-rain": ((45, 145, 255), (235, 245, 255)),
    "Interior": ((210, 210, 210), (255, 255, 255)),
    "Detailing": ((40, 210, 190), (225, 255, 250)),
    "Glass": ((80, 170, 255), (235, 250, 255)),
    "Fragrance": ((210, 60, 200), (255, 235, 255)),
}


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)


FONT_BLACK_52 = font("arialbd.ttf", 52)
FONT_BLACK_34 = font("arialbd.ttf", 34)
FONT_BLACK_25 = font("arialbd.ttf", 25)
FONT_BOLD_20 = font("arialbd.ttf", 20)
FONT_REG_17 = font("arial.ttf", 17)
FONT_REG_15 = font("arial.ttf", 15)


def draw_center(draw: ImageDraw.ImageDraw, xy, text, fnt, fill):
    box = draw.textbbox((0, 0), text, font=fnt)
    draw.text((xy[0] - (box[2] - box[0]) / 2, xy[1]), text, font=fnt, fill=fill)


def wrap_text(text: str, max_chars: int, lines: int) -> list[str]:
    words = text.split()
    out = []
    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if len(candidate) <= max_chars:
            line = candidate
        else:
            if line:
                out.append(line)
            line = word
        if len(out) == lines:
            break
    if line and len(out) < lines:
        out.append(line)
    return out[:lines]


def soft_cloud(width: int, height: int, accent):
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    random.seed(sum(accent))
    for _ in range(70):
        x = random.randint(-80, width - 20)
        y = random.randint(210, height - 90)
        r = random.randint(28, 92)
        alpha = random.randint(26, 82)
        color = (*accent, alpha)
        d.ellipse((x, y, x + r * 2, y + r), fill=color)
    return layer.filter(ImageFilter.GaussianBlur(18))


def bottle(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, label: str, accent, kind: str):
    glass = (245, 245, 242)
    edge = (12, 12, 12)
    draw.rounded_rectangle((x + w * 0.32, y, x + w * 0.68, y + h * 0.12), radius=8, fill=glass, outline=edge, width=3)
    draw.rounded_rectangle((x + w * 0.26, y + h * 0.1, x + w * 0.74, y + h * 0.26), radius=9, fill=(220, 224, 226), outline=edge, width=3)
    draw.rounded_rectangle((x, y + h * 0.22, x + w, y + h), radius=26, fill=glass, outline=edge, width=5)
    draw.rectangle((x + 18, y + h * 0.37, x + w - 18, y + h * 0.72), fill=edge)
    draw_center(draw, (x + w / 2, y + h * 0.42), label, FONT_BLACK_25, (255, 255, 255))
    draw_center(draw, (x + w / 2, y + h * 0.58), kind.upper(), FONT_REG_15, (225, 225, 225))
    draw.rounded_rectangle((x + 30, y + h * 0.77, x + w - 30, y + h * 0.91), radius=15, fill=accent)


def kit(draw: ImageDraw.ImageDraw, x: int, y: int, accent, label: str):
    short_label = label[:2] if len(label) > 2 else label
    for i, height in enumerate([238, 198, 220]):
        bx = x + i * 96
        bottle(draw, bx, y + (238 - height), 74, height, short_label, accent, "KIT")


def make_visual(product):
    image_path = product["image"]
    if image_path in REAL_SCREENSHOT_IMAGES:
        return

    accent, pale = ACCENTS.get(product["category"]["en"], ((130, 130, 130), (245, 245, 245)))
    out = BASE / image_path

    im = Image.new("RGB", (760, 960), (245, 245, 242))
    bg = Image.new("RGB", im.size, (8, 11, 14))
    im.paste(bg)

    overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.polygon([(0, 0), (760, 0), (560, 500), (0, 430)], fill=(255, 255, 255, 18))
    od.rectangle((0, 0, 760, 960), outline=(245, 245, 242, 28), width=6)
    im = Image.alpha_composite(im.convert("RGBA"), overlay)
    im = Image.alpha_composite(im, soft_cloud(760, 960, accent))

    d = ImageDraw.Draw(im)
    brand = product.get("brand", "TEIKO").split("/")[0].strip().upper()
    category = product["category"]["en"]
    d.text((58, 54), brand, font=FONT_BLACK_52, fill=(210, 216, 226))
    d.text((58, 118), "CAR CARE / DETAILING", font=FONT_BLACK_25, fill=(255, 255, 255))
    d.text((58, 154), category.upper(), font=FONT_BOLD_20, fill=(178, 188, 202))

    if "kit" in product["title"]["en"].lower() or "pcs" in product["title"]["en"].lower():
        kit(d, 236, 325, accent, brand[:7])
    else:
        bottle(d, 280, 285, 200, 405, brand[:8], accent, category)

    car_y = 680
    d.rounded_rectangle((450, car_y, 705, car_y + 70), radius=32, outline=accent, width=6)
    d.ellipse((482, car_y + 44, 540, car_y + 102), outline=(235, 235, 235), width=5)
    d.ellipse((620, car_y + 44, 678, car_y + 102), outline=(235, 235, 235), width=5)
    for i in range(18):
        x = 70 + i * 26
        y = 720 + int(math.sin(i * 0.8) * 18)
        d.line((x, y, x + 62, y - 30), fill=(*accent, 180), width=4)

    d.rounded_rectangle((42, 780, 718, 918), radius=18, fill=(247, 247, 244))
    for idx, line in enumerate(wrap_text(product["title"]["en"], 38, 2)):
        d.text((70, 810 + idx * 34), line, font=FONT_BLACK_34, fill=(5, 5, 5))
    d.text((70, 890), product["sku"], font=FONT_REG_17, fill=(100, 100, 100))
    d.rounded_rectangle((514, 854, 690, 902), radius=22, fill=(5, 5, 5))
    draw_center(d, (602, 863), f"{product['price']} RUB", FONT_BLACK_25, (255, 255, 255))

    im.convert("RGB").save(out, quality=94)


for item in PRODUCTS:
    make_visual(item)

print("generated", len(PRODUCTS) - len(REAL_SCREENSHOT_IMAGES), "visuals")
