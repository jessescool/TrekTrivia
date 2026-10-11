# Feed a CSV of questions into the live site.
#   python3 pipe.py drafts.csv            through the vetter (accepts land unchecked)
#   python3 pipe.py drafts.csv --direct   straight into the vault, marked checked (the god path)
# Needs TREK_ADMIN_KEY in the environment. CSV columns: Question, Answer, Alternate1, Alternate2, Alternate3,
# and for --direct also Difficulty and Source.

import csv, json, os, sys, urllib.request

site = 'https://trektrivia.com'
key = os.environ['TREK_ADMIN_KEY']
path, direct = sys.argv[1], '--direct' in sys.argv

rows = list(csv.DictReader(open(path)))
questions = [{
  'question': r['Question'], 'answer': r['Answer'],
  'alternates': [r['Alternate1'], r['Alternate2'], r['Alternate3']],
  **({'difficulty': int(r['Difficulty']), 'source': r['Source']} if direct else {}),
} for r in rows]

def post(route, body):
  req = urllib.request.Request(f'{site}{route}?key={key}', data=json.dumps(body).encode(),
    headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 TrekTrivia-pipe'})
  try:
    with urllib.request.urlopen(req, timeout=180) as r: return json.load(r)
  except urllib.error.HTTPError as e:
    return json.load(e)

if direct:
  print(post('/add', questions))
else:
  for q in questions:
    out = post('/submit', q)
    print(f"{out['verdict']:7s} {q['question'][:60]:60s} | {out['reason'][:100]}", flush=True)
