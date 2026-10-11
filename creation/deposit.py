# Turns startrekdata.csv into one object per question:
#   vault.json       for seeding the API's KV store (`npm run seed` in api/)
#   assets/questions.js  bundled with the site as a fallback if the API is unreachable
# Run from inside creation/.

import csv, json

rows = list(csv.DictReader(open('startrekdata.csv')))

vault = [{
  'question': r['Question'],
  'answer': r['Answer'],
  'alternates': [r['Alternate1'], r['Alternate2'], r['Alternate3']],
  'difficulty': int(r['Difficulty']),
  'source': r['Source'],
  'checked': True, # a human wrote these
} for r in rows if r['Verified'] == '1']

with open('vault.json', 'w') as f:
  json.dump(vault, f, indent=2, ensure_ascii=False)

with open('../assets/questions.js', 'w') as f:
  f.write('const vault = ' + json.dumps(vault, indent=2, ensure_ascii=False) + ';\n')

print(f'deposited {len(vault)} questions')
