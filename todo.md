# trektrivia.com TODO

-- more questions once the pile is sorted (every series is at 25+ with the pile; 50 per series would be nice)
-- maybe connect the Worker to GitHub for deploy-on-push (Cloudflare Workers Builds, not Actions). Needs a build step that fetches the LCARS template, since assets/lcars/ isn't in the repo
-- find and shut down the DigitalOcean droplet (nothing points at it)
-- add percentile...
-- Original Favicon (svg or ico, or both)
-- copy pass: welcome text, contribute instructions, results wording, About page
-- flow screens: empty-series / exhausted-series messaging; a hint for greyed series
-- vet the pile (282: 41 from Haiku, 241 AI-written and fact-checked by Sonnet agents, marked origin ai) with sort.py; then decide whether to flip autoAccept in api/src/index.js
-- back-end: pipeline tuning from the log, maybe percentile once scores are stored
