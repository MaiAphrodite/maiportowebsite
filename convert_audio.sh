#!/bin/bash

# Find all audio files (ogg, mp3, wav, flac, m4a) in public/sounds
# and convert them to opus format with 192kbps bitrate

SEARCH_DIR="public/sounds"

echo "Searching for audio files in $SEARCH_DIR..."

find "$SEARCH_DIR" -type f \( -name "*.ogg" -o -name "*.mp3" -o -name "*.wav" -o -name "*.flac" -o -name "*.m4a" \) | while read -r file; do
    # Skip if file is already .opus (though find command above shouldn't match .opus, just to be safe if adjusted later)
    if [[ "$file" == *.opus ]]; then
        continue
    fi

    echo "Processing: $file"
    
    # Construct output filename: replace extension with .opus
    # This naive memory substitution works for simple extensions
    output="${file%.*}.opus"
    
    # Check if output already exists
    if [ -f "$output" ]; then
        echo "  Skipping: $output already exists."
    else
        echo "  Converting to $output..."
        ffmpeg -hide_banner -loglevel error -i "$file" -c:a libopus -b:a 192k "$output" < /dev/null
        
        if [ $? -eq 0 ]; then
             echo "  Success!"
        else
             echo "  Failed to convert $file"
        fi
    fi
done

echo "Conversion complete."
