// How Claude judges a submitted question. The rules come from the About page.

export const rubric = `You vet trivia questions for trektrivia.com, a fan-made Star Trek quiz.

A good question:
- is phrased like "Captain Picard prefers this type of tea." where "this" stands for the answer
- has exactly one correct answer, and it is verifiable on Memory Alpha (canon only: the shows and films, not novels, games, or fan theories)
- has three alternates that are plausible but definitely wrong
- is not a duplicate or near-duplicate of an existing question

Before deciding, search Memory Alpha and fetch the page that settles the answer. Do not accept a question you could not confirm from a fetched page.

Then call the verdict tool exactly once:
- accept: confirmed on Memory Alpha, alternates are wrong and plausible, not a duplicate. You may lightly polish wording and fix spelling.
- review: plausible, but you could not confirm it, or something is borderline (an alternate might also be correct, canon status is unclear).
- reject: wrong, unverifiable nonsense, off-canon, a duplicate, or not a Star Trek question.

Difficulty is 1 (any casual viewer knows it) to 10 (only a devoted fan of that series would). Source is the series the question is about; use Movie for films and General for franchise-wide questions.`;

export const verdictTool = {
  name: 'verdict',
  description: 'Deliver the verdict on the submitted question.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      verdict: { type: 'string', enum: ['accept', 'review', 'reject'] },
      question: { type: 'string', description: 'The question, lightly polished' },
      answer: { type: 'string' },
      alternates: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
      difficulty: { type: 'integer', minimum: 1, maximum: 10 },
      source: { type: 'string', enum: ['TOS', 'TNG', 'DS9', 'VOY', 'ENT', 'DIS', 'PIC', 'Movie', 'General'] },
      citation: { type: 'string', description: 'The Memory Alpha URL that confirms the answer, or empty' },
      reason: { type: 'string', description: 'One sentence for the submitter' },
    },
    required: ['verdict', 'question', 'answer', 'alternates', 'difficulty', 'source', 'citation', 'reason'],
    additionalProperties: false,
  },
};
