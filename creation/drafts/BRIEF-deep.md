# Deep-cut brief

You are writing multiple-choice Star Trek trivia for trektrivia.com. The bank already has the easy layer. This round is for devoted fans: in the weeds, but not random or obscure.

What "in the weeds but not obscure" means:
- Yes: facts a fan who has watched the series once or twice attentively could recall or reason to. Secondary characters' backstories and arcs, recurring guest characters, episode-specific plot turns, named ships and stations and their fates, holodeck programs, named foods and drinks and games, numbered things fans remember (Rules of Acquisition, Borg species numbers, the Enterprise's deck for a famous scene), quotes and catchphrases and who said them, what a one-episode alien species did, callbacks between episodes, the names of pets, shuttles, bars, and symbionts.
- No: production trivia (actors, writers, air dates, stardates, episode numbers), one-off background names that only appear in a single line or on a display, planet coordinates, registry numbers of ships that never mattered, anything that needs a freeze-frame.
- Difficulty 1-10 scale: aim for a spread of roughly 30% at 5-6, 50% at 7-8, 20% at 9. Nothing below 5.

Style (match the existing bank):
- Statement form with the blank expressed as "this"/"these", ending in a period. Example: "Quark's cousin Gaila made his fortune selling these." Never "Which..." or "What..." questions, no question marks.
- Under 120 characters. Don't put the answer or part of it in the question.
- Answer is the canonical name as Memory Alpha spells it. Three alternates of the same category that are plausible to a fan but definitively wrong; none may also be a defensible answer. Alternates drawn from the same series are better than invented ones, as long as they're wrong.
- Spread across seasons and across characters, episodes, ships, species, places, props. Don't over-index on one episode.
- Only on-screen canon from the show itself. No novels, games, comics, or anything beta canon.
- Read the series' existing-<LABEL>.txt in creation/drafts/ first and don't duplicate or near-duplicate a fact or answer that's already there.

Verification is mandatory. WebFetch is blocked on Memory Alpha; use its MediaWiki API with curl in Bash:
curl -s -A 'Mozilla/5.0 TrekTrivia' 'https://memory-alpha.fandom.com/api.php?action=query&titles=Beckett_Mariner&prop=extracts&explaintext=1&format=json'
curl -s -A 'Mozilla/5.0 TrekTrivia' 'https://memory-alpha.fandom.com/api.php?action=parse&page=USS_Protostar&prop=wikitext&format=json'
Batch titles with titles=A|B|C. Confirm every fact and exact spelling in page text before writing it; also check that the alternates are wrong. Drop anything you can't confirm. Accuracy matters more than hitting the count.

Output: CSV at creation/drafts/deep-<LABEL>.csv with header exactly
Question,Answer,Alternate1,Alternate2,Alternate3,Difficulty,Source
Quote fields containing commas. Do not create or edit any other file.

Report back: rows written, difficulty spread, and facts dropped for failing verification.
