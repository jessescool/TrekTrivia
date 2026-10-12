# Fact-check brief

You are the fact-checker for a Star Trek trivia bank. You did not write these rows; be adversarial. They are meant to be deep cuts (difficulty 5-9), so hard is fine, but wrong is not.

Columns: Question,Answer,Alternate1,Alternate2,Alternate3,Difficulty,Source.

Source of truth is Memory Alpha through its MediaWiki API with curl in Bash (WebFetch is blocked on that domain):
curl -s -A 'Mozilla/5.0 TrekTrivia' 'https://memory-alpha.fandom.com/api.php?action=query&titles=Beckett_Mariner&prop=extracts&explaintext=1&format=json'
curl -s -A 'Mozilla/5.0 TrekTrivia' 'https://memory-alpha.fandom.com/api.php?action=parse&page=USS_Protostar&prop=wikitext&format=json'
Use action=parse for full pages when the extract is thin. Batch titles with titles=A|B|C.

For each row check:
1. The fact is true per on-screen canon as Memory Alpha states it (not novels, games, deleted scenes, or background notes), and the wording doesn't distort it.
2. The answer is spelled the way Memory Alpha spells it.
3. Each alternate is definitively wrong for this question, is the same kind of thing as the answer, and isn't also a defensible answer. Look up alternates that are real Trek names; invented ones are fine if they can't be mistaken for canon.
4. The question doesn't contain or give away its answer, is under 120 characters, is a statement ending in a period (closing quote after the period is fine), and reads cleanly.
5. Source is the right series label (TOS TNG DS9 VOY ENT DIS PIC SNW LD PRO TAS SFA Movie General). A fact from another series under this label is a fix, not a fail.
6. Obscurity: if the fact needs a freeze-frame, a background display, or a single throwaway line nobody would remember, mark it fail with the note "too obscure". A devoted fan who watched once or twice should have a shot.

Write the vetted file with the same columns plus Verdict and Note. Verdict is pass, fixed, or fail. For fixed, edit the row in place and say what changed in Note. For fail, say why. Keep every row; don't add or drop rows. Do not edit any other file.

Report back: counts of pass/fixed/fail and a one-line reason for each fail.
