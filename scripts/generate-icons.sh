#!/bin/bash
set -e

SOURCE="/tmp/ownchart-logo.svg"
OUTPUT="./public/icons"

echo "Generating OwnChart icons from $SOURCE..."
mkdir -p "$OUTPUT"

# Copy SVG with explicit color for favicon (currentColor doesn't work in favicons)
cp "$SOURCE" "$OUTPUT/favicon.svg"

# Generate PNG favicons with high quality and full alpha channel (render at 2x and downsample for sharpness)
convert -density 600 -background none "$SOURCE" -resize 32x32 -resize 16x16 -define png:color-type=6 -quality 100 "$OUTPUT/favicon-16x16.png"
convert -density 600 -background none "$SOURCE" -resize 64x64 -resize 32x32 -define png:color-type=6 -quality 100 "$OUTPUT/favicon-32x32.png"
convert -density 600 -background none "$SOURCE" -resize 96x96 -resize 48x48 -define png:color-type=6 -quality 100 "$OUTPUT/favicon-48x48.png"

# Generate multi-resolution ICO with full alpha transparency (32-bit RGBA)
# Use -define icon:auto-resize to create multi-resolution ICO
# Avoid -colors 256 as it converts alpha transparency to 1-bit
convert -density 600 -background none "$SOURCE" \
  -define icon:auto-resize=48,32,16 \
  "$OUTPUT/favicon.ico"

# Generate Apple Touch Icon (high quality with full alpha)
convert -density 600 -background none "$SOURCE" -resize 360x360 -resize 180x180 -define png:color-type=6 -quality 100 "$OUTPUT/apple-touch-icon.png"

# Generate PWA icons (high quality with full alpha)
convert -density 600 -background none "$SOURCE" -resize 384x384 -resize 192x192 -define png:color-type=6 -quality 100 "$OUTPUT/icon-192x192.png"
convert -density 600 -background none "$SOURCE" -resize 1024x1024 -resize 512x512 -define png:color-type=6 -quality 100 "$OUTPUT/icon-512x512.png"

# Generate maskable icon (with 20% safe zone padding and full alpha)
convert -density 600 -background none "$SOURCE" -resize 820x820 -resize 410x410 \
  -gravity center -background none -extent 512x512 -define png:color-type=6 -quality 100 \
  "$OUTPUT/icon-maskable-512x512.png"

# Generate Open Graph image (centered on brand color background)
convert -size 1200x630 "xc:#0F6CBD" \
  -density 600 "$SOURCE" -background none -resize 800x800 -resize 400x400 \
  -gravity center -composite -quality 100 \
  "$OUTPUT/og-image.png"

echo "✅ All icons generated successfully with high quality and transparency"
ls -lh "$OUTPUT"
