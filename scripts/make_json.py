import csv
import json
from pathlib import Path

# Find the Person3 project folder
project_folder = Path(__file__).resolve().parent.parent

# Locate the CSV file
csv_file = project_folder / "data" / "weeds.csv"

# Choose where to save the JSON file
json_file = project_folder / "data" / "weeds.json"

# Read the CSV and convert it into a list of dictionaries
try:
    with open(csv_file, "r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        if not reader.fieldnames:
            raise ValueError("The CSV file has no column headings.")

        weeds = []

        for row in reader:
            # Remove extra spaces around values
            cleaned_row = {
                key.strip(): (value.strip() if value else "")
                for key, value in row.items()
                if key is not None
            }

            # Skip completely empty rows
            if any(cleaned_row.values()):
                weeds.append(cleaned_row)

    if not weeds:
        raise ValueError("No weed records were found in the CSV file.")

    # Save the records as JSON
    with open(json_file, "w", encoding="utf-8") as file:
        json.dump(weeds, file, ensure_ascii=False, indent=4)

    print(f"Success! Converted {len(weeds)} weed records.")
    print(f"JSON file saved at: {json_file}")

except FileNotFoundError:
    print("Error: weeds.csv was not found inside the data folder.")

except (OSError, ValueError, csv.Error) as error:
    print(f"Error: {error}")
