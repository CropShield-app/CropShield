
from pathlib import Path

# Find the main Person3 project folder
project_folder = Path(__file__).resolve().parent.parent

# Find the organized photos folder
photos_folder = project_folder / "organised_photos"

# Image file types we can recognize
image_types = {".jpg", ".jpeg", ".png", ".webp"}

print("WEED PHOTO CHECK")
print("-" * 30)

total_photos = 0

for weed_folder in sorted(photos_folder.iterdir()):
    if weed_folder.is_dir():
        photos = [
            photo for photo in weed_folder.iterdir()
            if photo.is_file()
            and photo.suffix.lower() in image_types
        ]

        print(f"\n{weed_folder.name}: {len(photos)} photo(s)")

        for photo in photos:
            print(f"  - {photo.name}")
            total_photos += 1

print("\n" + "-" * 30)
print(f"Total photos found: {total_photos}")
