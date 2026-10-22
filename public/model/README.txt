Person 1: put the converted AI model here.
  model.json
  group1-shard1of1.bin  (the name and number of .bin files can differ)
  labels.json           e.g. ["weed_1","weed_2","weed_3","weed_4","weed_5","not_weed"]
The labels must be in the SAME order the model was trained with, and spelled exactly like the ids in the weed sheet.
Until these files exist, the app runs in demo mode (no weed result).
