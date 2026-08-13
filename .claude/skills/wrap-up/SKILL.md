---
name: wrap-up
description: End-of-session close-out for the שקוף project. Verifies the build and accessibility, syncs the Robells board, writes a handoff note, and prepares a commit for approval. Use when the user says they want to wrap up, finish, stop for the day, clear the session, or asks what state things are in before leaving.
---

# Wrap up a שקוף session

Leave the project in a state a future session can pick up cold, and leave the
board reflecting reality rather than intentions.

**Autonomy rule for this whole skill: gather freely, write nothing until asked.**
Do every read-only step, then present ONE consolidated plan covering all writes
(board changes, handoff note, commit) and get a single yes. Do not ask
item-by-item — that is tedious and trains the user to rubber-stamp.

If a step genuinely doesn't apply this session, say so and skip it. Silently
omitting a step reads as "it passed".

---

## Step 1 — Verify the project actually works

Never report state you haven't checked.

```bash
npm run typecheck
npm run build:site
```

Then confirm the widget still functions. Start the site preview
(`preview_start` with name `site`, which serves `./site` on port 4322) and check:

- The widget mounts: `document.getElementById('shakuf-root')` exists
- The panel opens, and **closes** via all three paths — the X button, the
  launcher, and Escape. This regressed once already: `.panel{display:flex}` is
  an author rule that outranks the UA's `[hidden]{display:none}`, so the panel
  can stay on screen while the widget believes it is shut.
- axe-core is clean on `/` and `/setup/`. Load it from
  `https://cdn.jsdelivr.net/npm/axe-core@4.13.0/axe.min.js` in the page and run
  against `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice`.
- Reset leaves nothing behind: no `data-shakuf-*` on `<html>`, no leftover
  inline `font-size`, and `localStorage` key `shakuf:prefs:v1` removed.

Report the numbers, not "it works". If something is broken, that is the most
important thing in the whole wrap-up — lead with it.

## Step 2 — Check the live site

`https://shakuf.yuvalrahamim.com` — confirm 200, and that the CSP header is
still applied. Cloudflare Pages auto-deploys from `main`, so a push during the
session should already be live; if the deployed content is older than the last
commit, say so.

## Step 3 — Read the Robells board

Board: `Israeli accessibility widget`, id `dbe070e5-0af9-4f4a-b4fa-77ebee21fcbe`.
Backlog column: `1b053f37-b8ac-456a-b821-b4a3605bc450`.

Use `list_tasks`, then work out — **as a proposal, not an action**:

- Which cards this session actually completed → propose closing
- Which cards advanced partially → propose a comment recording what moved and
  what remains, rather than closing
- What the session discovered that has no card → propose creating one

Two contract details that matter: `create_task` and `add_comment` are **not
idempotent**, so check for an existing card or comment before proposing one.
`add_comment` caps `body` at 500 characters.

## Step 4 — Draft the handoff note

Prepare an entry to prepend to `.claude/handoff.md` (gitignored). Keep it
short enough to actually be read on resume:

```markdown
## <YYYY-MM-DD>

**Done:** what changed, in one or two lines each.
**Verified:** the concrete numbers — axe results, bundle size, what was tested.
**Not verified:** what was left untested and why. Be honest here; this is the
section that prevents a future session from over-trusting.
**Open decisions:** anything waiting on the user.
**Next:** the 2–3 highest-value actions, ranked, with what blocks what.
```

Get the date from the environment context, not from a guess.

## Step 5 — Prepare the commit

Stage everything, then:

- **Scan for secrets** across staged content — `rob_[a-f0-9]{10,}`,
  `Bearer\s+\S{20,}`, `api\.robells\.io`, `sk_live`, `AKIA`. Skip binaries.
- **Confirm the exclusions held**: `.mcp.json` (holds a live API token),
  `PLAN.md` (business strategy — must stay out of history, because the repo is
  destined to go public and history survives that switch) and `site/shakuf.js`
  (a build artifact) must all be absent from the staged set.
- Show the file list and a draft commit message.

**Commit message rules, non-negotiable:**
- **No attribution trailer of any kind.** No `Co-Authored-By`, no "Generated
  with". If you grep to check, note that the body legitimately contains the
  words "Claude Code" where it names supported AI coding agents — that is not
  an attribution.
- Explain *why*, not just what. The interesting content is the reasoning behind
  non-obvious decisions.

## Step 6 — Present and ask

One message containing: verification results, proposed board changes, the
handoff note, and the commit plan. Then ask for a single go-ahead.

**Never commit, push, or write to the board before that yes.** Pushing is a
separate confirmation again if the user only approved committing.

---

## Standing project constraints — do not violate these while wrapping up

- **Never commit or push without explicit permission.** Never add Claude as
  co-author or contributor.
- **The repo is public and the package is published.** Both happened on
  2026-08-13 by Yuval's decision, without a legal entity. Do not re-raise the
  entity question as a blocker on either — it has been asked and answered.
  `npm publish` is routine when he asks for it, but still confirm the payload
  with `--dry-run` first.
- **`PLAN.md` and `.mcp.json` stay gitignored, permanently.** The repo is public
  now, so a single careless `git add -f` is an immediate disclosure rather than
  a private mistake.
- **Never write a compliance claim anywhere** — not in code, commits, docs or
  site copy. Banned: "makes your site compliant", "עומד בתקן", "100%
  compliance", "protects you from lawsuits", "מוגן מתביעות". The product's
  entire position is that it does *not* do those things; the FTC fined
  accessiBe $1M over exactly this.
