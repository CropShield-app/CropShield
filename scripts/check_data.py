
import json
from pathlib import Path

project_folder = Path(__file__).resolve().parent.parent
json_file = project_folder / "data" / "weeds.json"

required_fields = [
    "id", "scientific_name", "source",
    "name_en", "advice_en", "methods_en", "caution_en",
    "name_te", "advice_te", "methods_te", "caution_te",
    "name_hi", "advice_hi", "methods_hi", "caution_hi",
    "name_bn", "advice_bn", "methods_bn", "caution_bn"
]

try:
    with open(json_file, "r", encoding="utf-8") as file:
        weeds = json.load(file)

    if not isinstance(weeds, list):
        raise ValueError("The JSON data must be a list.")

    print("Total weed records:", len(weeds))

    ids = []

    for number, weed in enumerate(weeds, start=1):
        print(f"\nChecking weed {number}...")

        missing_fields = [
            field for field in required_fields
            if field not in weed
        ]

        if missing_fields:
            print("Missing fields:", ", ".join(missing_fields))
        else:
            print("All 19 fields are present.")

        for field in required_fields:
            if field in weed and not str(weed[field]).strip():
                print("Empty field:", field)

        weed_id = str(weed.get("id", "")).strip()

        if weed_id:
            ids.append(weed_id)
        else:
            print("ERROR: Weed ID is empty.")

        if not str(weed.get("scientific_name", "")).strip():
            print("ERROR: Scientific name is empty.")

    if len(ids) != len(set(ids)):
        print("\nERROR: Duplicate weed IDs found.")
    else:
        print("\nNo duplicate weed IDs found.")

    if len(weeds) == 5:
        print("Record count check passed.")
    else:
        print("WARNING: Expected 5 records.")

    print("\nData check finished.")
    print("Please review any warnings above.")

except FileNotFoundError:
    print("ERROR: weeds.json was not found in the data folder.")

except (json.JSONDecodeError, ValueError) as error:
    print("ERROR:", error)
