
import json
from pathlib import Path

# Find the Person3 project folder
project_folder = Path(__file__).resolve().parent.parent

# Photo and data locations
photos_folder = project_folder / "organised_photos"
data_folder = project_folder / "src" / "data"
json_file = data_folder / "weeds.json"

# Read the existing weed records
with open(json_file, "r", encoding="utf-8") as file:
    weeds = json.load(file)

photo_index = []

for weed in weeds:
    weed_id = weed["id"]
    weed_folder = photos_folder / weed_id

    if not weed_folder.is_dir():
        print(f"Folder not found: {weed_id}")
        continue

    photos = sorted(
        photo for photo in weed_folder.iterdir()
        if photo.is_file()
        and photo.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )

    for photo in photos:
        photo_index.append({
            "weed_id": weed_id,
            "scientific_name": weed["scientific_name"],
            "photo": f"organised_photos/{weed_id}/{photo.name}"
        })

# Save the photo index
output_file = data_folder / "photo_index.json"

with open(output_file, "w", encoding="utf-8") as file:
    json.dump(photo_index, file, indent=4, ensure_ascii=False)

print(f"Photo index created: {len(photo_index)} photo(s)")
print(f"Saved to: {output_file}")
