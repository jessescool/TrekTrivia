# trektrivia-api

Cloudflare Worker. KV holds the vault; Claude (Haiku) vets submissions against Memory Alpha.
Capped at 40 submissions a day (`daily` in src/index.js), roughly three cents each. Put the key in its own Console workspace with a spend limit anyway.

## First deploy
    npm install
    npx wrangler login
    npx wrangler kv namespace create VAULT      # paste the id into wrangler.toml
    npx wrangler secret put ANTHROPIC_API_KEY
    npx wrangler secret put ADMIN_KEY           # anything long and random
    (cd ../creation && python3 deposit.py)      # CSV -> creation/vault.json, first time only
    npm run seed                                # creation/vault.json -> KV
    npm run deploy                              # prints the workers.dev URL; paste it into assets/quiz.js

## After that, the live vault in KV is the source of truth
    npm run backup                              # KV -> creation/vault.json
    npm run seed                                # creation/vault.json -> KV (restores a backup; overwrites what's live)

## Getting questions in
    export TREK_ADMIN_KEY=...
    python3 ../creation/pipe.py drafts.csv            # through the vetter, no daily cap
    python3 ../creation/pipe.py drafts.csv --direct   # straight in, marked checked
    curl https://trektrivia.com/vault.csv             # the whole bank as CSV

## Reviewing the queue
    curl "https://<worker>/pending?key=$ADMIN_KEY"
    curl -X POST "https://<worker>/approve?key=$ADMIN_KEY" -d '{"index":0}'
    curl -X POST "https://<worker>/reject?key=$ADMIN_KEY" -d '{"index":0}'
    curl "https://<worker>/log?key=$ADMIN_KEY"
