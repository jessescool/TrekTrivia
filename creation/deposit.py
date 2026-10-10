# Turns startrekdata.csv into assets/vault.js, one object per question.
# Run from inside creation/.

import csv, json

rows = list(csv.DictReader(open('startrekdata.csv')))

vault = [{
  'question': r['Question'],
  'answer': r['Answer'],
  'alternates': [r['Alternate1'], r['Alternate2'], r['Alternate3']],
  'difficulty': int(r['Difficulty']),
  'source': r['Source'],
} for r in rows if r['Verified'] == '1']

with open('../assets/vault.js', 'w') as f:
  f.write('const vault = ' + json.dumps(vault, indent=2, ensure_ascii=False) + ';\n')

print(f'deposited {len(vault)} questions')
