#!/bin/bash
set -e

SOURCE="/tmp/ownchart-logo.svg"
OUTPUT="./public/icons"

echo "Generating OwnChart icons from $SOURCE..."
mkdir -p "$OUTPUT"

# Copy SVG
cp "$SOURCE" "$OUTPUT/favicon.svg"

# Generate PNG favicons
convert -background none "$SOURCE" -resize 16x16 "$OUTPUT/favicon-16x16.png"
convert -background none "$SOURCE" -resize 32x32 "$OUTPUT/favicon-32x32.png"
convert -background none "$SOURCE" -resize 48x48 "$OUTPUT/favicon-48x48.png"

# Generate multi-resolution ICO
convert "$SOURCE" -background none \
  \( -clone 0 -resize 16x16 \) \
  \( -clone 0 -resize 32x32 \) \
  \( -clone 0 -resize 48x48 \) \
  -delete 0 "$OUTPUT/favicon.ico"

# Generate Apple Touch Icon
convert -background none "$SOURCE" -resize 180x180 "$OUTPUT/apple-touch-icon.png"

# Generate PWA icons
convert -background none "$SOURCE" -resize 192x192 "$OUTPUT/icon-192x192.png"
convert -background none "$SOURCE" -resize 512x512 "$OUTPUT/icon-512x512.png"

# Generate maskable icon (with 20% safe zone padding)
convert -background none "$SOURCE" -resize 410x410 \
  -gravity center -extent 512x512 \
  "$OUTPUT/icon-maskable-512x512.png"

# Generate Open Graph image (centered on brand color background)
convert -size 1200x630 "xc:#0F6CBD" \
  "$SOURCE" -resize 400x400 -gravity center -composite \
  "$OUTPUT/og-image.png"

echo "✅ All icons generated successfully"
ls -lh "$OUTPUT"
