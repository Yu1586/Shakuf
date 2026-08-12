---
name: resume
description: Start-of-session orientation for the שקוף project. Reads the handoff note and Robells board, re-loads the standing constraints, verifies the project still builds and the site is up, then proposes the next actions. Use when the user starts a session with resume, catch me up, where were we, what's the state, or what should I work on.
---

# Resume work on שקוף

Rebuild context from durable state rather than from memory, then propose what to
do next. **Read-only: make no code changes, no commits, no board writes.** End
by proposing — the user picks.

---

## What this project is, in one paragraph

שקוף is a free, open-source Hebrew accessibility widget for Israeli websites,
shipped as one `<script>` tag. It adjusts *display* only — text size, contrast,
spacing, motion. It deliberately does **not** modify ARIA, semantics, or alt
text, does **not** run a server, and collects **nothing**. The whole product
position is honesty about what an accessibility overlay can and cannot do: it
does not make a site compliant with ת״י 5568, and it says so prominently. That
is both the ethical stance and the legal shield — the FTC fined accessiBe $1M
for claiming otherwise.

It is also lead-gen for the author's accessibility services, which is disclosed
on the site. That disclosure is a requirement, not decoration.

## Step 1 — Read the durable state

In this order:

1. `.claude/handoff.md` — the last session's note, if it exists. Most recent
   entry is at the top.
2. `PLAN.md` — the strategy and legal spine. **Gitignored on purpose**; it is
   the source of truth for decisions D1–D7 and the §-numbered constraints the
   code comments reference.
3. `git log --oneline -8` and `git status` — what actually landed, and whether
   the tree is clean.

## Step 2 — Read the board

Board: `Israeli accessibility widget`, id `dbe070e5-0af9-4f4a-b4fa-77ebee21fcbe`.
Backlog column: `1b053f37-b8ac-456a-b821-b4a3605bc450`.

`list_tasks`, then note which cards are `critical`/`high`, and — more useful —
which are *blocking others*. The entity decision, for instance, blocks
publishing but blocks no development at all; conflating those wastes sessions.

## Step 3 — Verify it still works

Cheap, and it prevents building on a broken base:

```bash
npm run typecheck
npm run build:site
```

Then check `https://shakuf.yuvalrahamim.com` returns 200. If either fails, that
becomes the first proposed action regardless of what the board says.

## Step 4 — Reload the standing constraints

These are non-obvious, easy to violate, and expensive to undo. State them back
briefly so they are active in the session rather than rediscovered mid-task:

- **Never commit or push without explicit permission.** **Never** add Claude as
  co-author or contributor, in commits or anywhere else.
- **The repo is private and stays private** until an Israeli legal entity
  exists. `gh repo edit --visibility public` and `npm publish` are both gated
  on that. Local commits and a private repo are fine; publishing is the line.
- **`PLAN.md` and `.mcp.json` stay out of git** — the first is business
  strategy, the second holds a live API token. History survives a
  private→public switch, so nothing sensitive may ever enter it.
- **No compliance claims, anywhere.** Banned in code, comments, commits, docs
  and site copy: "makes your site compliant", "עומד בתקן", "כשיר לתקן 5568",
  "100% accessible", "protects from lawsuits", "מוגן מתביעות".
- **Widget design invariants** (these are legal positions expressed as code
  rules, not preferences): every change user-invoked; never override existing
  ARIA/roles/semantics; never fight the visitor's assistive tech; everything
  reversible in one click; the widget itself meets WCAG 2.1 AA; **zero
  telemetry** — a preference like "high contrast" is arguably an inference
  about disability and must never reach a server.
- **The disclaimer rendered by the widget core is not configurable** and must
  not become so. It is the only control that reaches ordinary installers.

## Step 5 — Propose next actions

End with **2–3 ranked suggestions**, each with one line on why it's next and
what it unblocks. Distinguish clearly between:

- work that is blocked on the **user** (entity registration, buying ת״י 5568,
  filling the `[למלא]` placeholders, arranging the Hebrew NVDA test), and
- work that can proceed **now** without them.

Do not start any of it. Propose, then stop.

---

## Useful specifics, so they don't need rediscovering

- **Repo:** `Yu1586/Shakuf`, private, branch `main`. Live at
  `https://shakuf.yuvalrahamim.com` (Cloudflare Pages, auto-deploys from
  `main`; DNS CNAME at GoDaddy).
- **Layout:** `packages/core/src` is the widget; `site/` is the static site
  (`index.html` marketing, `setup/index.html` technical guide); `demo/` is a
  fake Hebrew business page for testing the widget against real content.
- **Build:** `npm run build:site` compiles the widget and copies it to
  `site/shakuf.js` (gitignored — Cloudflare regenerates it on deploy).
- **Preview:** `preview_start` with name `site` serves `./site` on 4322 — use
  that rather than the repo root, since the pages use absolute asset paths.
  Name `demo` serves the repo root on 4321 for the widget test page.
- **Fonts** are self-hosted in `site/fonts/` (Heebo for Hebrew, JetBrains Mono
  for Latin labels). Never switch to a CDN — the CSP is `font-src 'self'` and
  the site's own claim is that it makes no external requests.
- **Known placeholders still unfilled:** `[פירוט השירותים שנמכרים]` and
  `[כתובת דוא״ל]` in the site's disclosure section (publicly visible),
  `[SECURITY EMAIL]` in `SECURITY.md`, `[LEGAL ENTITY NAME]` and `[YYYY]` in
  `NOTICE`, `[DATE]` in `DISCLAIMER.md`.
