# Screenshots of every screen at every shape that matters, plus one contact sheet per screen.
#   python3 creation/shots.py              against the live site
#   TREK_SITE=http://localhost:8765 python3 creation/shots.py
# Writes images/<screen>/<device>.png and images/sheet-<screen>.png. Needs playwright (pip) and Pillow.

import os, sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

site = os.environ.get('TREK_SITE', 'https://trektrivia.com')
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'images')

devices = [  # name, width, height, touch
  ('iphone-se',            375,  667, True),
  ('iphone-14',            390,  844, True),
  ('iphone-15-pro-max',    430,  932, True),
  ('pixel-7',              412,  915, True),
  ('iphone-14-landscape',  844,  390, True),
  ('ipad-mini',            768, 1024, True),
  ('ipad-pro-11',          834, 1194, True),
  ('ipad-mini-landscape', 1024,  768, True),
  ('ipad-pro-landscape',  1194,  834, True),
  ('laptop-small',        1280,  720, False),
  ('macbook-air',         1440,  900, False),
  ('desktop-1080p',       1920, 1080, False),
  ('desktop-1440p',       2560, 1440, False),
  ('ultrawide',           3440, 1440, False),
  ('square',              1000, 1000, False),
  ('tall-split-view',      600, 1100, False),
]

def screens(pg):
  pg.goto(site + '/'); pg.wait_for_timeout(700)
  yield 'welcome'
  pg.click('button[data-series="DS9"]'); pg.click('button[data-series="TNG"]'); pg.click('#play'); pg.wait_for_timeout(300)
  yield 'game'
  pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
  yield 'results'
  pg.goto(site + '/#pose'); pg.wait_for_timeout(500)
  yield 'contribute'
  pg.goto(site + '/about/'); pg.wait_for_timeout(500)
  yield 'about'

shots = {}
with sync_playwright() as p:
  browser = p.chromium.launch()
  for name, w, h, touch in devices:
    ctx = browser.new_context(viewport={'width': w, 'height': h}, has_touch=touch, is_mobile=touch and w < 800, device_scale_factor=1)
    pg = ctx.new_page()
    for screen in screens(pg):
      os.makedirs(os.path.join(out, screen), exist_ok=True)
      path = os.path.join(out, screen, f'{name}-{w}x{h}.png')
      pg.screenshot(path=path)   # the viewport, i.e. what you'd see without scrolling
      shots.setdefault(screen, []).append((name, path))
    ctx.close()
    print('shot', name, flush=True)
  browser.close()

# contact sheets: every device for one screen, scaled to a common height
for screen, items in shots.items():
  thumb_h = 420
  thumbs = []
  for name, path in items:
    im = Image.open(path); im.thumbnail((10000, thumb_h)); thumbs.append((name, im))
  cols = 4; pad = 24; label = 22
  cell_w = max(im.width for _, im in thumbs) + pad
  rows = (len(thumbs) + cols - 1) // cols
  sheet = Image.new('RGB', (cols * cell_w + pad, rows * (thumb_h + label + pad) + pad), 'black')
  d = ImageDraw.Draw(sheet)
  for i, (name, im) in enumerate(thumbs):
    x = pad + (i % cols) * cell_w; y = pad + (i // cols) * (thumb_h + label + pad)
    d.text((x, y), name, fill='#eb943a'); sheet.paste(im, (x, y + label))
  sheet.save(os.path.join(out, f'sheet-{screen}.png'))
  print('sheet', screen)
