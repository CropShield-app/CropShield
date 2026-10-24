
import csv
import json
from pathlib import Path

project = Path(__file__).resolve().parent.parent
data_folder = project / "src" / "data"
photos_folder = project / "organised_photos"

csv_file = data_folder / "weeds.csv"
json_file = data_folder / "weeds.json"
index_file = data_folder / "photo_index.json"

required_fields = [
    "id", "scientific_name", "source",
    "name_en", "advice_en", "methods_en", "caution_en",
    "name_te", "advice_te", "methods_te", "caution_te",
    "name_hi", "advice_hi", "methods_hi", "caution_hi",
    "name_bn", "advice_bn", "methods_bn", "caution_bn"
]

errors = []

# Check that all three data files exist
for file in [csv_file, json_file, index_file]:
    if not file.is_file():
        errors.append(f"Missing file: {file.name}")

if not errors:
    with open(csv_file, encoding="utf-8-sig", newline="") as f:
        csv_records = list(csv.DictReader(f))

    with open(json_file, encoding="utf-8") as f:
        weeds = json.load(f)

    with open(index_file, encoding="utf-8") as f:
        photo_index = json.load(f)

    print("PROJECT VALIDATION")
    print("-" * 35)

    if len(weeds) != 5:
        errors.append(f"Expected 5 weed records; found {len(weeds)}")
    else:
        print("PASS: Found 5 weed records")

    ids = [weed.get("id", "") for weed in weeds]

    if len(ids) != len(set(ids)):
        errors.append("Duplicate weed IDs found")
    else:
        print("PASS: Weed IDs are unique")

    if len(csv_records) != len(weeds):
        errors.append("CSV and JSON record counts do not match")
    else:
        print("PASS: CSV and JSON record counts match")

    for number, weed in enumerate(weeds, start=1):
        weed_id = weed.get("id", "")

        for field in required_fields:
            if not str(weed.get(field, "")).strip():
                errors.append(
                    f"Record {number} ({weed_id}): empty field {field}"
                )

        folder = photos_folder / weed_id
        if not folder.is_dir():
            errors.append(f"Missing photo folder: {weed_id}")
        else:
            print(f"PASS: Photo folder exists for {weed_id}")

    print("-" * 35)

    indexed_ids = {item.get("weed_id") for item in photo_index}

    if indexed_ids != set(ids):
        errors.append("Photo index weed IDs do not match database IDs")
    else:
        print("PASS: Photo index covers all weed IDs")

    for item in photo_index:
        relative_path = item.get("photo", "")
        image_path = project / relative_path

        if not image_path.is_file():
            errors.append(f"Photo file not found: {relative_path}")

    if not errors:
        print("PASS: All indexed photo files exist")
        print("\nAll automated checks passed!")
    else:
        print("\nISSUES TO FIX:")
        for error in errors:
            print("-", error)
