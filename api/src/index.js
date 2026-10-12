// The API behind trektrivia.com. The vault lives in KV; submissions get vetted by Claude against Memory Alpha.

import { rubric, verdictTool } from './vetting.js';

const daily = 40; // submissions per day, so a bad night can't run up the bill
const autoAccept = false; // while off, the vetter's accepts wait in the pile for Jesse instead of going live

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

const read = async (env, key) => JSON.parse((await env.VAULT.get(key)) || '[]');
const write = async (env, key, value) => {
  await env.VAULT.put(key, JSON.stringify(value));
  if (key === 'vault') await env.VAULT.put('updated', new Date().toUTCString()); // the sidebar shows this
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    if (url.pathname === '/vault' && request.method === 'GET') {
      return new Response((await env.VAULT.get('vault')) || '[]', {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'Last-Modified': (await env.VAULT.get('updated')) || new Date().toUTCString(),
          'Access-Control-Expose-Headers': 'Last-Modified',
          ...cors,
        },
      });
    }

    if (url.pathname === '/vault.csv' && request.method === 'GET') {
      return new Response(csv(await read(env, 'vault')), { headers: { 'Content-Type': 'text/csv', ...cors } });
    }

    const admin = url.searchParams.get('key') === env.ADMIN_KEY;

    if (url.pathname === '/submit' && request.method === 'POST') return submit(request, env, admin);

    // the admin bits, for Jesse
    if (['/pending', '/log', '/approve', '/reject', '/add', '/vault'].includes(url.pathname)) {
      if (!admin) return json({ error: 'not found' }, 404);
      if (url.pathname === '/vault' && request.method === 'PUT') { // sort.py writes the whole vault back
        const vault = await request.json();
        await write(env, 'vault', vault);
        return json({ ok: true, vault: vault.length });
      }
      if (url.pathname === '/pending') return json(await read(env, 'pending'));
      if (url.pathname === '/log') return json(await read(env, 'log'));
      if (url.pathname === '/approve' && request.method === 'POST') return decide(request, env, true);
      if (url.pathname === '/reject' && request.method === 'POST') return decide(request, env, false);
      if (url.pathname === '/add' && request.method === 'POST') return add(request, env);
    }

    // everything else is the site itself
    return env.ASSETS.fetch(request);
  },
};

async function submit(request, env, admin) {
  if (!admin) { // the public gets rate limited and capped; Jesse's bulk piping doesn't
    const { success } = await env.SUBMIT.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
    if (!success) return json({ verdict: 'reject', reason: 'Too many submissions, try again in a minute.' }, 429);

    const today = `count:${new Date().toISOString().slice(0, 10)}`;
    const count = Number(await env.VAULT.get(today)) || 0;
    if (count >= daily) return json({ verdict: 'reject', reason: 'The computer has had enough for today. Try tomorrow!' }, 429);
    await env.VAULT.put(today, String(count + 1), { expirationTtl: 172800 });
  }

  const body = await request.json().catch(() => ({}));
  const { question, answer, alternates } = body;
  if (!question || !answer || !Array.isArray(alternates) || alternates.length !== 3 || alternates.some(a => !a)) {
    return json({ verdict: 'reject', reason: 'Need a question, an answer, and three alternates.' }, 400);
  }

  const vault = await read(env, 'vault');
  const verdict = await vet({ question, answer, alternates }, vault, env)
    .catch(e => ({ ...body, verdict: 'error', difficulty: 5, source: 'General', reason: `The vetter broke: ${e.message}` }));
  if (verdict.verdict === 'error') return json({ verdict: 'error', reason: verdict.reason }, 502);

  if (admin && body.origin) verdict.origin = body.origin; // only Jesse's pipe gets to label where a question came from
  const entry = { ...verdict, submitted: body, at: new Date().toISOString() };
  const log = await read(env, 'log');
  log.unshift(entry);
  await write(env, 'log', log.slice(0, 500));

  if (verdict.verdict === 'accept' && autoAccept) {
    vault.push(row(verdict, false));
    await write(env, 'vault', vault);
  } else if (verdict.verdict === 'accept' || verdict.verdict === 'review') {
    const pending = await read(env, 'pending');
    pending.push(entry);
    await write(env, 'pending', pending);
  }

  return json({ verdict: verdict.verdict, reason: verdict.reason });
}

async function decide(request, env, approve) {
  const { index } = await request.json();
  const pending = await read(env, 'pending');
  const [entry] = pending.splice(index, 1);
  if (!entry) return json({ error: 'no such pending entry' }, 404);
  await write(env, 'pending', pending);

  if (approve) {
    const vault = await read(env, 'vault');
    vault.push(row(entry, true));
    await write(env, 'vault', vault);
  }
  return json({ ok: true, remaining: pending.length });
}

// the god path: Jesse adds questions straight to the vault, no vetting, marked checked
async function add(request, env) {
  const body = await request.json();
  const incoming = Array.isArray(body) ? body : [body];
  const vault = await read(env, 'vault');
  for (const q of incoming) vault.push(row(q, true));
  await write(env, 'vault', vault);
  return json({ ok: true, added: incoming.length, vault: vault.length });
}

function csv(vault) {
  const cell = v => `"${String(v).replace(/"/g, '""')}"`;
  const header = 'Question,Answer,Alternate1,Alternate2,Alternate3,Difficulty,Source,Checked,Origin';
  const lines = vault.map(q => [q.question, q.answer, ...q.alternates, q.difficulty, q.source, q.checked ? 1 : 0, q.origin || ''].map(cell).join(','));
  return [header, ...lines].join('\n') + '\n';
}

// what the vault stores, shaped like the rows deposit.py makes; checked means a human looked at it, origin marks who wrote it (ai) when it wasn't a person
const row = (v, checked) => ({ question: v.question, answer: v.answer, alternates: v.alternates, difficulty: v.difficulty, source: v.source, checked, ...(v.origin && { origin: v.origin }) });

async function vet(submission, vault, env) {
  const messages = [{
    role: 'user',
    content: `Existing questions, so you can catch duplicates:\n${vault.map(q => '- ' + q.question).join('\n')}\n\nSubmission:\n${JSON.stringify(submission, null, 2)}`,
  }];

  const body = {
    model: 'claude-haiku-5-5',
    max_tokens: 4096,
    system: rubric,
    tools: [
      { type: 'web_search_20250305', name: 'web_search', max_uses: 2, allowed_domains: ['memory-alpha.fandom.com'] },
      { type: 'web_fetch_20250910', name: 'web_fetch', max_uses: 3, allowed_domains: ['memory-alpha.fandom.com'], max_content_tokens: 20000 },
      verdictTool,
    ],
    messages,
  };

  // search and fetch run on Anthropic's side; we only loop to catch the verdict or resume a paused turn
  for (let i = 0; i < 4; i++) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json());

    if (response.type === 'error') throw new Error(response.error.message);

    const call = response.content.find(b => b.type === 'tool_use' && b.name === 'verdict');
    if (call) return call.input;
    if (response.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: response.content });
  }

  return { ...submission, verdict: 'review', difficulty: 5, source: 'General', reason: 'The vetter never reached a verdict.' };
}
