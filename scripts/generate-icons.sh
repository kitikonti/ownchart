#!/bin/bash
set -e

SOURCE="/tmp/ownchart-logo.svg"
OUTPUT="./public/icons"

echo "Generating OwnChart icons from $SOURCE..."
mkdir -p "$OUTPUT"

# Copy SVG with explicit color for favicon (currentColor doesn't work in favicons)
cp "$SOURCE" "$OUTPUT/favicon.svg"

# Generate PNG favicons with high quality (render at 2x and downsample for sharpness)
convert -density 600 -background none "$SOURCE" -resize 32x32 -resize 16x16 -quality 100 "$OUTPUT/favicon-16x16.png"
convert -density 600 -background none "$SOURCE" -resize 64x64 -resize 32x32 -quality 100 "$OUTPUT/favicon-32x32.png"
convert -density 600 -background none "$SOURCE" -resize 96x96 -resize 48x48 -quality 100 "$OUTPUT/favicon-48x48.png"

# Generate multi-resolution ICO with transparency
convert -density 600 -background none "$SOURCE" \
  \( -clone 0 -resize 32x32 -resize 16x16 \) \
  \( -clone 0 -resize 64x64 -resize 32x32 \) \
  \( -clone 0 -resize 96x96 -resize 48x48 \) \
  -delete 0 -colors 256 "$OUTPUT/favicon.ico"

# Generate Apple Touch Icon (high quality)
convert -density 600 -background none "$SOURCE" -resize 360x360 -resize 180x180 -quality 100 "$OUTPUT/apple-touch-icon.png"

# Generate PWA icons (high quality)
convert -density 600 -background none "$SOURCE" -resize 384x384 -resize 192x192 -quality 100 "$OUTPUT/icon-192x192.png"
convert -density 600 -background none "$SOURCE" -resize 1024x1024 -resize 512x512 -quality 100 "$OUTPUT/icon-512x512.png"

# Generate maskable icon (with 20% safe zone padding)
convert -density 600 -background none "$SOURCE" -resize 820x820 -resize 410x410 \
  -gravity center -background none -extent 512x512 -quality 100 \
  "$OUTPUT/icon-maskable-512x512.png"

# Generate Open Graph image (centered on brand color background)
convert -size 1200x630 "xc:#0F6CBD" \
  -density 600 "$SOURCE" -background none -resize 800x800 -resize 400x400 \
  -gravity center -composite -quality 100 \
  "$OUTPUT/og-image.png"

echo "✅ All icons generated successfully with high quality and transparency"
ls -lh "$OUTPUT"
