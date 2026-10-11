# Sort the piles. Walks you through what the vetter did and lets you overrule it.
#   python3 sort.py
# Reads your admin password from creation/.key. Keys: y keep, n toss, e edit, enter skip, q quit.

import json, os, urllib.request

site = os.environ.get('TREK_SITE', 'https://trektrivia-api.trektrivia-api.workers.dev')
key = os.environ.get('TREK_ADMIN_KEY') or open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.key')).read().strip()  # your admin password
seen_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.sorted')  # rejects you've already looked at

def call(route, method='GET', body=None):
  req = urllib.request.Request(f'{site}{route}?key={key}', method=method,
    data=json.dumps(body).encode() if body is not None else None,
    headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 TrekTrivia-sort'})
  with urllib.request.urlopen(req, timeout=60) as r: return json.load(r)

def edit(q):
  # enter keeps the current value
  for field in ('question', 'answer'):
    q[field] = input(f"    {field} [{q[field]}]: ").strip() or q[field]
  q['alternates'] = [input(f"    alternate [{a}]: ").strip() or a for a in q['alternates']]
  q['difficulty'] = int(input(f"    difficulty [{q.get('difficulty', 5)}]: ").strip() or q.get('difficulty', 5))
  q['source'] = input(f"    source [{q.get('source', 'General')}]: ").strip() or q.get('source', 'General')

def ask(q, extra=''):
  print(f"\n  {q['question']}\n    answer:     {q['answer']}\n    alternates: {', '.join(q['alternates'])}"
        f"\n    {q.get('source', '?')} / difficulty {q.get('difficulty', '?')}{extra}")
  while True:
    k = input('  [y]keep [n]toss [e]edit [enter]skip [q]quit > ').strip().lower()
    if k == 'e':
      edit(q); q['edited'] = True
      return ask(q, extra)
    if k in ('y', 'n', '', 'q'): return k

def fields(q):
  return {k: q[k] for k in ('question', 'answer', 'alternates', 'difficulty', 'source')}

def verdict_note(e):
  return f"\n    vetter:     {e.get('verdict', '?').upper()}: {e.get('reason', '')}" + (f"\n    source:     {e['citation']}" if e.get('citation') else '')

# 1. auto-accepted, not human-checked
vault = call('/vault')
unchecked = [q for q in vault if not q.get('checked')]
print(f"\n== {len(unchecked)} auto-accepted, not yet checked by a human ==")
changed, quit_ = False, False
for q in unchecked:
  k = ask(q)
  if k == 'q': quit_ = True; break
  if k == 'y': q['checked'] = True; changed = True
  if k == 'n': vault.remove(q); changed = True
  q.pop('edited', None)
if changed: print(' ', call('/vault', 'PUT', vault))

# 2. the vetter wasn't sure
if not quit_:
  pending = call('/pending')
  print(f"\n== {len(pending)} waiting on you (the vetter's accepts and reviews) ==")
  for i in reversed(range(len(pending))):  # highest index first so earlier indexes stay valid
    k = ask(pending[i], verdict_note(pending[i]))
    if k == 'q': quit_ = True; break
    if k == 'y' and pending[i].get('edited'): # the queue holds the old wording, so drop it and add the new
      call('/reject', 'POST', {'index': i}); print(' ', call('/add', 'POST', fields(pending[i])))
    elif k == 'y': print(' ', call('/approve', 'POST', {'index': i}))
    if k == 'n': print(' ', call('/reject', 'POST', {'index': i}))

# 3. the vetter said no; overrule if it was wrong
if not quit_:
  seen = set(open(seen_file).read().split()) if os.path.exists(seen_file) else set()
  rejects = [e for e in call('/log') if e.get('verdict') == 'reject' and e['at'] not in seen]
  print(f"\n== {len(rejects)} rejected by the vetter ==")
  for e in rejects:
    k = ask(e, verdict_note(e))
    if k == 'q': break
    if k == 'y': print(' ', call('/add', 'POST', fields(e)))
    if k in ('y', 'n'): seen.add(e['at'])
  open(seen_file, 'w').write('\n'.join(sorted(seen)))

print('\nDone.')
