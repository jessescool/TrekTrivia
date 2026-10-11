# Trek Trivia

A fan-made quiz on all things Star Trek, with a question bank that grows through player submissions.
Live at trektrivia.com.

## How it's put together

- `index.html`, `about/`, `assets/` are the site. Plain HTML, CSS, and one JS file. No build step.
- `api/` is a Cloudflare Worker (a small program on Cloudflare's servers, nothing to do with AI). It serves the
  site files and a handful of API routes. One deploy ships both.
- The question bank lives in Cloudflare KV, a hosted key-value store, under one key called `vault`. It is the
  source of truth. There is no local database.
- When a player submits a question, the Worker asks Claude (Haiku) to check it against Memory Alpha and return
  accept, review, or reject. Accepts go straight into the vault, marked `checked: false`. Reviews go to a queue
  for Jesse. Rejects are logged and dropped.
- `creation/startrekdata.csv` was the original seed. `creation/pipe.py` gets new questions in; `creation/sort.py` is where you judge what the vetter did.

## Your interface

Everything is done from the Mac, in Terminal, against the live API. There is no admin page.

One-time: save your admin password where the scripts can read it (gitignored, stays on your Mac):

    echo "your-admin-password" > creation/.key

### Getting questions in

    python creation/pipe.py drafts.csv            # through the vetter; accepts land unchecked. No daily cap for you.
    python creation/pipe.py drafts.csv --direct   # straight into the vault, marked checked. The god path.

CSV columns: `Question, Answer, Alternate1, Alternate2, Alternate3`. For `--direct` also `Difficulty` (1 to 10)
and `Source` (TOS, TNG, DS9, VOY, ENT, DIS, PIC, Movie, General).

### Getting questions out

    curl https://trektrivia.com/vault.csv > bank.csv     # the whole bank, with a Checked column
    curl https://trektrivia.com/vault                    # same thing as JSON

### Sorting the piles

    python creation/sort.py

Walks you through three piles, one question at a time, with the vetter's reason and citation:

1. auto-accepted but not yet human-checked: `y` marks it checked, `n` deletes it from the vault
2. the vetter wasn't sure: `y` approves it into the vault as checked, `n` drops it
3. the vetter rejected it: `y` overrules and adds it as checked, `n` leaves it dropped

`e` edits the question, answer, alternates, difficulty, or source first (enter keeps a value), then asks again. Enter skips, `q` quits. Rejects you've already judged are remembered in `creation/.sorted` and don't come back.

The same things by hand, if you'd rather:

    curl "https://trektrivia.com/pending?key=$(cat creation/.key)"
    curl -X POST "https://trektrivia.com/approve?key=$(cat creation/.key)" -d '{"index":0}'
    curl -X POST "https://trektrivia.com/reject?key=$(cat creation/.key)" -d '{"index":0}'
    curl "https://trektrivia.com/log?key=$(cat creation/.key)"            # every verdict, newest first

### Editing or deleting live questions

    cd api
    npm run backup        # KV -> creation/vault.json
    # edit the JSON
    npm run seed          # creation/vault.json -> KV (overwrites what's live)

## Changing the site

Edit files, then:

    cd api && npm run deploy

Live in a few seconds. Secrets (`ANTHROPIC_API_KEY`, `ADMIN_KEY`) are set once with `npx wrangler secret put`
from the Terminal app, not from a tool that can't prompt. First-time setup is in `api/README.md`.

## Costs and caps

- Cloudflare: free tier, nowhere near its limits.
- Anthropic: about three cents per vetted submission. The public is capped at 40 a day and 5 a minute per IP.
  The API key lives in its own Console workspace with a monthly spend limit.
