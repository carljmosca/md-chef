import zlib
import struct
import os

def create_png(width, height, draw_func, filename):
    # PNG signature
    png = bytearray(b'\x89PNG\r\n\x1a\n')

    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)

    # Raw image data: filter byte 0 + RGBA per scanline
    raw = bytearray()
    for y in range(height):
        raw.append(0) # filter type 0 (None)
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            raw.extend([r, g, b, a])

    idat_data = zlib.compress(bytes(raw), 9)
    idat_crc = zlib.crc32(b'IDAT' + idat_data)
    png += struct.pack('>I', len(idat_data)) + b'IDAT' + idat_data + struct.pack('>I', idat_crc)

    # IEND
    iend_crc = zlib.crc32(b'IEND')
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)

    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Generated {filename} ({width}x{height})")

def draw_chef_icon(x, y, w, h, maskable=False):
    # Normal coordinates [0..1]
    nx = x / float(w)
    ny = y / float(h)
    
    # Background: #ea580c (234, 88, 12)
    bg_r, bg_g, bg_b = 234, 88, 12

    # If maskable, fill entirely. If regular, round corners with radius = 0.2
    if not maskable:
        r = 0.2
        # Check rounded corners
        dx = max(0.0, max(r - nx, nx - (1.0 - r)))
        dy = max(0.0, max(r - ny, ny - (1.0 - r)))
        if dx * dx + dy * dy > r * r:
            return 0, 0, 0, 0 # Transparent outside rounded corner

    # Centered chef hat coordinates
    # Let's map center to (0, 0), range approx -1..1
    cx = (nx - 0.5) * 2.0
    cy = (ny - 0.5) * 2.0

    # Chef hat consists of:
    # 1. Base headband: cy in [0.25, 0.45], cx in [-0.4, 0.4]
    # 2. Main puff: center circle at (0, -0.05), radius ~0.38
    # 3. Left puff: circle at (-0.26, 0.02), radius ~0.26
    # 4. Right puff: circle at (0.26, 0.02), radius ~0.26
    # 5. Top left puff: circle at (-0.16, -0.22), radius ~0.24
    # 6. Top right puff: circle at (0.16, -0.22), radius ~0.24

    is_white = False

    # Headband
    if -0.38 <= cx <= 0.38 and 0.22 <= cy <= 0.42:
        is_white = True
        # Subtle horizontal stripe inside headband:
        if 0.31 <= cy <= 0.33:
            return bg_r, bg_g, bg_b, 255

    # Hat puffs
    puffs = [
        (0.0, -0.06, 0.36),
        (-0.25, 0.04, 0.25),
        (0.25, 0.04, 0.25),
        (-0.16, -0.20, 0.24),
        (0.16, -0.20, 0.24),
    ]

    for px, py, pr in puffs:
        dist_sq = (cx - px) ** 2 + (cy - py) ** 2
        if dist_sq <= pr * pr:
            is_white = True
            break

    if is_white:
        return 255, 255, 255, 255

    return bg_r, bg_g, bg_b, 255

os.makedirs('public', exist_ok=True)
create_png(192, 192, lambda x,y,w,h: draw_chef_icon(x,y,w,h, maskable=False), 'public/pwa-192x192.png')
create_png(512, 512, lambda x,y,w,h: draw_chef_icon(x,y,w,h, maskable=False), 'public/pwa-512x512.png')
create_png(512, 512, lambda x,y,w,h: draw_chef_icon(x,y,w,h, maskable=True), 'public/pwa-maskable-512x512.png')
create_png(180, 180, lambda x,y,w,h: draw_chef_icon(x,y,w,h, maskable=False), 'public/apple-touch-icon.png')
print("All PNG icons created successfully!")

