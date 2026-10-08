"""Generate the app icon set: a vinyl record inside a listening-progress ring.

Run from playlist-manager-native/:  python3 scripts/generate-icons.py   (needs Pillow)

Writes Expo's assets/ (used by EAS builds / app.json) and the checked-in iOS asset
catalog directly, since we don't run `expo prebuild` to regenerate ios/.
Colours mirror constants/colors.ts.
"""
import math, os, shutil
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets')
IOS_ASSETS = os.path.join(ROOT, 'ios', 'PlaylistManager', 'Images.xcassets')
SS = 4  # supersampling factor

BG_DARK = (15, 10, 30)       # surfaceDark #0f0a1e
SURFACE = (26, 16, 48)       # surface #1a1030
BORDER = (45, 31, 94)        # border #2d1f5e
PRIMARY = (132, 61, 255)     # primary #843dff
PRIMARY_LIGHT = (176, 132, 255)
GREEN = (120, 166, 60)       # secondary #78a63c
TEXT = (240, 236, 255)

def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))

def background(size):
    """Dark background with a soft purple glow behind the record."""
    s = size * SS
    img = Image.new('RGB', (s, s), BG_DARK)
    glow = Image.new('L', (s, s), 0)
    ImageDraw.Draw(glow).ellipse([s * 0.12, s * 0.12, s * 0.88, s * 0.88], fill=255)
    glow = glow.filter(ImageFilter.GaussianBlur(s * 0.12))
    tint = Image.new('RGB', (s, s), lerp(BG_DARK, PRIMARY, 0.35))
    img.paste(tint, (0, 0), glow)
    return img

def emblem(size, scale):
    """Transparent RGBA emblem; `scale` = emblem diameter as fraction of canvas."""
    s = size * SS
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = s / 2
    R = s * scale / 2                      # outer radius of progress ring
    ring_w = R * 0.13
    gap = R * 0.07

    # Progress ring: dim track + bright arc (~70% listened), round caps.
    # PIL strokes arcs inward from the bbox edge, so the bbox is the ring's OUTER edge.
    track_box = [c - R, c - R, c + R, c + R]
    d.arc(track_box, 0, 360, fill=BORDER + (255,), width=round(ring_w))
    start, sweep = -90, 252
    steps = 200
    for i in range(steps):  # gradient arc: primary -> light primary
        t = i / steps
        a0 = start + sweep * t
        a1 = start + sweep * (i + 1.5) / steps
        d.arc(track_box, a0, a1, fill=lerp(PRIMARY, PRIMARY_LIGHT, t) + (255,), width=round(ring_w))
    rr = R - ring_w / 2
    for ang, col in ((start, PRIMARY), (start + sweep, PRIMARY_LIGHT)):
        x, y = c + rr * math.cos(math.radians(ang)), c + rr * math.sin(math.radians(ang))
        d.ellipse([x - ring_w / 2, y - ring_w / 2, x + ring_w / 2, y + ring_w / 2], fill=col + (255,))

    # Vinyl record.
    vr = R - ring_w - gap
    d.ellipse([c - vr, c - vr, c + vr, c + vr], fill=(10, 6, 22, 255))
    for k in range(1, 6):  # grooves
        gr = vr * (0.93 - k * 0.075)
        w = max(1, round(R * 0.012))
        d.ellipse([c - gr, c - gr, c + gr, c + gr], outline=BORDER + (255,), width=w)
    # Sheen: a faint lighter wedge across the grooves.
    sheen = Image.new('L', (s, s), 0)
    ImageDraw.Draw(sheen).pieslice([c - vr, c - vr, c + vr, c + vr], 200, 250, fill=40)
    ImageDraw.Draw(sheen).pieslice([c - vr, c - vr, c + vr, c + vr], 20, 70, fill=25)
    sheen = sheen.filter(ImageFilter.GaussianBlur(R * 0.04))
    hole_mask = Image.new('L', (s, s), 0)
    ImageDraw.Draw(hole_mask).ellipse([c - vr, c - vr, c + vr, c + vr], fill=255)
    sheen = ImageChops.multiply(sheen, hole_mask)
    img.paste(Image.new('RGBA', (s, s), TEXT + (255,)), (0, 0), sheen)

    # Label (green, the app's accent) + spindle hole.
    lr = vr * 0.36
    d.ellipse([c - lr, c - lr, c + lr, c + lr], fill=GREEN + (255,))
    hr = lr * 0.18
    d.ellipse([c - hr, c - hr, c + hr, c + hr], fill=BG_DARK + (255,))
    return img

def finish(img, size):
    return img.resize((size, size), Image.LANCZOS)

def full_icon(size, scale=0.78):
    bg = background(size).convert('RGBA')
    bg.alpha_composite(emblem(size, scale))
    return finish(bg, size).convert('RGB')  # iOS app icons must have no alpha

# iOS/Expo main icon (full-bleed, opaque).
full_icon(1024).save(f'{OUT}/icon.png')
# Android adaptive foreground: transparent, emblem within the 66% safe zone.
finish(emblem(1024, 0.60), 1024).save(f'{OUT}/adaptive-icon.png')
# Splash: transparent emblem, shown 'contain' on #0f0a1e; padded so it isn't huge.
finish(emblem(1024, 0.55), 1024).save(f'{OUT}/splash-icon.png')
# Web favicon: emblem fills more of the tile so it reads at tiny sizes.
full_icon(48, scale=0.92).save(f'{OUT}/favicon.png')

# The iOS project is checked in rather than prebuilt, so update its asset catalog too.
shutil.copy(f'{OUT}/icon.png', f'{IOS_ASSETS}/AppIcon.appiconset/App-Icon-1024x1024@1x.png')
for name in ('image', 'image@2x', 'image@3x'):
    shutil.copy(f'{OUT}/splash-icon.png', f'{IOS_ASSETS}/SplashScreenLegacy.imageset/{name}.png')
print('Icons written to assets/ and the iOS asset catalog')
