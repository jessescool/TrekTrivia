# trektrivia-api

Cloudflare Worker. KV holds the vault; Claude vets submissions against Memory Alpha.

## First deploy
    npm install
    npx wrangler login
    npx wrangler kv namespace create VAULT      # paste the id into wrangler.toml
    npx wrangler secret put ANTHROPIC_API_KEY
    npx wrangler secret put ADMIN_KEY           # anything long and random
    npm run seed                                # CSV -> KV
    npm run deploy                              # prints the workers.dev URL; paste it into assets/script.js

## Reviewing the queue
    curl "https://<worker>/pending?key=$ADMIN_KEY"
    curl -X POST "https://<worker>/approve?key=$ADMIN_KEY" -d '{"index":0}'
    curl -X POST "https://<worker>/reject?key=$ADMIN_KEY" -d '{"index":0}'
    curl "https://<worker>/log?key=$ADMIN_KEY"
