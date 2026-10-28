"""Generate the app icon set: a record sliding out of a vermilion sleeve.

Run from playlist-manager-native/:  python3 scripts/generate-icons.py   (needs Pillow)

Writes Expo's assets/ (used by EAS builds / app.json) and the checked-in iOS asset
catalog directly, since we don't run `expo prebuild` to regenerate ios/.
Colours mirror constants/colors.ts ("liner notes" palette). The sleeve carries a
small segmented bar, the same motif as the in-app progress bars.
"""
import os, shutil
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets')
IOS_ASSETS = os.path.join(ROOT, 'ios', 'PlaylistManager', 'Images.xcassets')
SS = 4  # supersampling factor

PARCHMENT = (239, 230, 216)  # text #efe6d8 — icon background
VINYL = (14, 12, 10)         # just below bg #14110f
GROOVE = (51, 43, 37)        # border #332b25
ACCENT = (232, 85, 45)       # accent #e8552d — sleeve
ACCENT_DEEP = (166, 56, 26)  # unfilled segments printed on the sleeve
SHADOW = (60, 30, 15)

# Geometry in units of the sleeve's side length L.
RECORD_R = 0.47     # record radius
RECORD_CX = 0.95    # record centre x (sleeve spans 0..1) — shows a sliver of label
GROUP_W = RECORD_CX + RECORD_R  # sleeve left edge to record right edge

def emblem(size, scale):
    """Transparent RGBA sleeve + record; `scale` = group width as fraction of canvas."""
    s = size * SS
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    L = s * scale / GROUP_W
    x0 = (s - GROUP_W * L) / 2
    y0 = (s - L) / 2
    cx, cy, r = x0 + RECORD_CX * L, y0 + L / 2, RECORD_R * L

    # Soft contact shadow under the whole group, so it sits on the background.
    sh = Image.new('L', (s, s), 0)
    sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([x0, y0 + L * 0.03, x0 + L, y0 + L * 1.03], radius=L * 0.02, fill=70)
    sd.ellipse([cx - r, cy - r + L * 0.03, cx + r, cy + r + L * 0.03], fill=70)
    sh = sh.filter(ImageFilter.GaussianBlur(L * 0.035))
    img.paste(Image.new('RGBA', (s, s), SHADOW + (255,)), (0, 0), sh)

    # Record: vinyl, grooves, a faint sheen, parchment label and spindle hole.
    rec = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(rec)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=VINYL + (255,))
    for k in range(1, 7):
        gr = r * (0.95 - k * 0.068)
        d.ellipse([cx - gr, cy - gr, cx + gr, cy + gr], outline=GROOVE + (255,), width=max(1, round(r * 0.011)))
    disc = Image.new('L', (s, s), 0)
    ImageDraw.Draw(disc).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    sheen = Image.new('L', (s, s), 0)
    ImageDraw.Draw(sheen).pieslice([cx - r, cy - r, cx + r, cy + r], -60, -20, fill=34)
    ImageDraw.Draw(sheen).pieslice([cx - r, cy - r, cx + r, cy + r], 120, 160, fill=22)
    sheen = ImageChops.multiply(sheen.filter(ImageFilter.GaussianBlur(r * 0.05)), disc)
    rec.paste(Image.new('RGBA', (s, s), PARCHMENT + (255,)), (0, 0), sheen)
    lr = r * 0.34
    d.ellipse([cx - lr, cy - lr, cx + lr, cy + lr], fill=PARCHMENT + (255,))
    hr = lr * 0.15
    d.ellipse([cx - hr, cy - hr, cx + hr, cy + hr], fill=VINYL + (255,))
    # Shadow the sleeve casts onto the record, clipped to the disc.
    cast = Image.new('L', (s, s), 0)
    ImageDraw.Draw(cast).rectangle([x0, y0, x0 + L + L * 0.02, y0 + L], fill=150)
    cast = ImageChops.multiply(cast.filter(ImageFilter.GaussianBlur(L * 0.03)), disc)
    rec.paste(Image.new('RGBA', (s, s), (0, 0, 0, 255)), (0, 0), cast)
    img.alpha_composite(rec)

    # Sleeve, with a segmented progress bar printed near the bottom.
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x0, y0, x0 + L, y0 + L], radius=L * 0.025, fill=ACCENT + (255,))
    n, filled = 6, 4
    gap, bh = L * 0.022, L * 0.04
    bx0, bx1, by = x0 + L * 0.12, x0 + L * 0.88, y0 + L * 0.80
    bw = (bx1 - bx0 - gap * (n - 1)) / n
    for i in range(n):
        bx = bx0 + i * (bw + gap)
        d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=bh * 0.3,
                            fill=(PARCHMENT if i < filled else ACCENT_DEEP) + (255,))
    return img

def finish(img, size):
    return img.resize((size, size), Image.LANCZOS)

def full_icon(size, scale=0.82):
    bg = Image.new('RGBA', (size * SS, size * SS), PARCHMENT + (255,))
    bg.alpha_composite(emblem(size, scale))
    return finish(bg, size).convert('RGB')  # iOS app icons must have no alpha

def tile(size, tile_frac=0.42):
    """The icon as a rounded tile on a transparent canvas, for the dark splash screen."""
    t = round(size * tile_frac)
    icon = full_icon(t).convert('RGBA')
    mask = Image.new('L', (t * SS, t * SS), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, t * SS - 1, t * SS - 1], radius=t * SS * 0.225, fill=255)
    icon.putalpha(mask.resize((t, t), Image.LANCZOS))
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.alpha_composite(icon, ((size - t) // 2, (size - t) // 2))
    return out

# iOS/Expo main icon (full-bleed, opaque).
full_icon(1024).save(f'{OUT}/icon.png')
# Android adaptive foreground: transparent, within the 66% safe zone; the parchment
# background comes from app.json's adaptiveIcon.backgroundColor.
finish(emblem(1024, 0.60), 1024).save(f'{OUT}/adaptive-icon.png')
# Splash: shown 'contain' on the dark #14110f splash, so use the icon as a tile.
tile(1024).save(f'{OUT}/splash-icon.png')
# Web favicon: artwork fills more of the tile so it reads at tiny sizes.
full_icon(48, scale=0.92).save(f'{OUT}/favicon.png')

# The iOS project is checked in rather than prebuilt, so update its asset catalog too.
shutil.copy(f'{OUT}/icon.png', f'{IOS_ASSETS}/AppIcon.appiconset/App-Icon-1024x1024@1x.png')
for name in ('image', 'image@2x', 'image@3x'):
    shutil.copy(f'{OUT}/splash-icon.png', f'{IOS_ASSETS}/SplashScreenLegacy.imageset/{name}.png')
print('Icons written to assets/ and the iOS asset catalog')
