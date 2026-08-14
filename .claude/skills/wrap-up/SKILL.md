---
name: wrap-up
description: End-of-session close-out for the שקוף project. Verifies the build and accessibility, syncs the Robells board, writes a handoff note, and prepares a commit for approval. Also drives a release when one is shipping — version bump, changelog entry, npm publish, and propagation checks. Use when the user says they want to wrap up, finish, stop for the day, clear the session, asks what state things are in before leaving, or asks to publish, release, or cut a version.
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
- axe-core is clean on **every** page — `/`, `/setup/`, `/terms/`,
  `/disclaimer/`, `/changelog/` — against `wcag2a, wcag2aa, wcag21a, wcag21aa,
  wcag22aa, best-practice`. axe-core is already a devDependency, so serve it
  from the repo rather than a CDN: start the `demo` preview and load
  `http://localhost:4321/node_modules/axe-core/axe.min.js`. That guarantees the
  version matches the lockfile and needs no network.
- **Run axe at mobile width too**, not only desktop. `resize_window` to the
  `mobile` preset (375px) and repeat. This is not optional padding: running only
  at desktop width missed a *serious* finding for weeks — at 375px the setup
  page's tables and code blocks overflow and become horizontal scroll regions
  reachable only by mouse, which desktop never exercises because they do not
  overflow there at all.
- Reset leaves nothing behind: no `data-shakuf-*` on `<html>`, no leftover
  inline `font-size`, and `localStorage` key `shakuf:prefs:v1` removed.

> **Check the layout is real before believing any axe result.** If the Browser
> pane is not displayed, the page still runs JS but has no layout:
> `window.innerWidth` reads 0 and `document.visibilityState` is `hidden`. Every
> `overflow` container then reports `scrollWidth > clientWidth`, so
> `scrollable-region-focusable` fires on elements that are perfectly fine. Read
> `innerWidth` first; if it is 0, the run proves nothing and must be repeated,
> not reported. The same condition breaks screenshots and makes `:focus` rules
> never match, because `document.hasFocus()` is false.

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

## Step 5 — If anything ships: version and changelog

**Skip this entire step if the session changed nothing inside `packages/core`.**
Site copy, docs, board work and skill edits are not releases. Say you skipped it
and why.

If the widget changed, the release is not optional bookkeeping — a fix sitting
in `main` helps nobody, because installers load the widget from jsDelivr, which
serves whatever npm says is `latest`. A colour-filter bug once sat published and
broken across three versions.

### 5.1 — Bump the version

`packages/core/package.json` is the only place a version lives. Semver against
what actually shipped:

- **patch** — bug fixes only.
- **minor** — new options or API surface, nothing broken. Additive config values
  and new methods are minor even when they feel small.
- **major** — anything an existing install would notice as a change in
  behaviour. Do not reach for this without asking.

One release per version. If the session fixed live bugs *and* added features,
prefer shipping the fixes as their own patch first: bundling a hotfix into a
feature release delays it for no reason. Say so and let the user decide.

### 5.2 — Write the changelog entry

`site/changelog/index.html`. This is the public record and the **only English
page on a Hebrew site**, deliberately — it is read by installers arriving from
npm. Treat it as part of the release, not a follow-up.

Insert a new `<section class="rule">` **above** the previous version's
`<!-- ====== X.Y.Z ====== -->` marker, matching the existing structure exactly:

```html
<!-- ================= 0.0.0 ================= -->
<section class="rule">
  <div class="wrap-text">
    <h2>0.0.0 <span class="dim" style="font-weight:400;font-size:.6em">· D Month YYYY</span></h2>
    <h3>Added</h3>   <!-- then Fixed, then Breaking, in that order; omit empty ones -->
    <ul><li><strong>Short claim.</strong> What changed and why it mattered.</li></ul>
  </div>
</section>
```

What an entry has to do:

- **Say what the reader loses by not upgrading.** If a feature was broken, name
  it plainly — "inverted colours did nothing on their own", not "fixed filter
  composition". Add a one-line "if you are on X, upgrade" where it is warranted.
- **Explain the *why* for anything non-obvious**, especially a design choice that
  looks arbitrary. Future-you reads this too.
- **Call breaking changes out explicitly**, in their own `<h3>Breaking</h3>`.
- **§2.1 applies here as much as anywhere.** No compliance claims, in English or
  Hebrew. It is a public marketing surface.

Then check the budget, because it gates the release:

```bash
node scripts/size.mjs
```

Over budget is a blocker, not a note. Do not raise the ceiling to fit — that
decision is the user's, and there is usually real payload to reclaim first. This
number is also the canary for the build-time CSS comment strip in
`tsup.config.ts`: it is worth ~1.5 KB gzipped, so a sudden jump back toward
17 KB means the strip silently stopped running.

### 5.3 — Publish, after the commit is approved and pushed

Order matters: commit and push first, so Cloudflare deploys the changelog and
the site describes the version that is about to exist. Then:

```bash
npm publish --dry-run --workspace @shakuf-widget/widget
```

Confirm the payload before the real publish — expect **7 files, ~50 kB**: the
two bundles, `dist/index.d.ts`, `package.json`, and `LICENSE` / `NOTICE` /
`DISCLAIMER.md` copied in by `prepack`. **No `.map` files.**

**Authentication is the user's job and cannot be done from here.** npm is
configured with `auth-type=web`, so publishing needs a browser and an
interactive terminal.

> **The auth errors lie.** An expired web-login session does not say "log in".
> It has been seen as `E404` (looks like a missing package) and as `EOTP`
> ("requires a one-time password from your authenticator" — there is no
> authenticator app on this account, so `--otp=` is the wrong answer and will
> never work). **Run `npm whoami` first**: a `401` means the session expired,
> whatever the publish error claimed. The fix is always the same, and the user
> runs it:
>
> ```bash
> npm login --auth-type=web
> ```

### 5.4 — Verify it actually propagated

Publishing is not shipping. Check, and report the results:

- `npm view @shakuf-widget/widget version` and `dist-tags` — is `latest` the new
  version?
- `https://cdn.jsdelivr.net/npm/@shakuf-widget/widget` returns 200 **and
  contains a string unique to this release**. Do not settle for a 200; the CDN
  happily serves the previous version. Propagation is sometimes instant and has
  previously lagged by minutes — if it is stale, the explicit
  `...@<version>` URL forces the cache.
- The live site serves the new changelog entry, not just a 200.

## Step 6 — Prepare the commit

Stage everything, then:

- **Scan for secrets** across staged content — `rob_[a-f0-9]{10,}`,
  `Bearer\s+\S{20,}`, `api\.robells\.io`, `sk_live`, `AKIA`. Skip binaries.
- **Confirm the exclusions held**: `.mcp.json` (holds a live API token),
  `PLAN.md` (business strategy) and `site/shakuf.js` (a build artifact) must all
  be absent from the staged set. The repo **is** public, so a stray `git add -f`
  is immediate disclosure, and history survives — there is no taking it back.
- Show the file list and a draft commit message.

**Commit message rules, non-negotiable:**
- **No attribution trailer of any kind.** No `Co-Authored-By`, no "Generated
  with". If you grep to check, note that the body legitimately contains the
  words "Claude Code" where it names supported AI coding agents — that is not
  an attribution.
- Explain *why*, not just what. The interesting content is the reasoning behind
  non-obvious decisions.

## Step 7 — Present and ask

One message containing: verification results, proposed board changes, the
handoff note, the commit plan, and — if a release is in play — the version
number, the changelog entry and the gzip figure against budget.

Then ask for a single go-ahead.

**Never commit, push, write to the board, or publish before that yes.** Pushing
is a separate confirmation again if the user only approved committing, and
publishing is separate again from pushing: it is the one step that cannot be
undone, since npm does not allow republishing a version number.

---

## Standing project constraints — do not violate these while wrapping up

- **Never commit or push without explicit permission.** Never add Claude as
  co-author or contributor.
- **The repo is public and the package is published.** Both happened on
  2026-08-13 by Yuval's decision, without a legal entity. Do not re-raise the
  entity question as a blocker on either — it has been asked and answered.
  `npm publish` is routine when he asks for it, but still confirm the payload
  with `--dry-run` first, and never publish a version whose changelog entry is
  not written — see Step 5. Authentication is his to do, not yours: it is a
  credential step, and the account uses browser-based login.
- **A release is not finished when the commit lands.** Installers load from
  jsDelivr, which serves whatever npm calls `latest`, so an unpublished fix
  helps nobody no matter how well it is committed. If a release is prepared but
  publishing is blocked on him, say so plainly in the handoff rather than
  letting "released" and "committed" blur together.
- **`PLAN.md` and `.mcp.json` stay gitignored, permanently.** The repo is public
  now, so a single careless `git add -f` is an immediate disclosure rather than
  a private mistake.
- **Never write a compliance claim anywhere** — not in code, commits, docs or
  site copy. Banned: "makes your site compliant", "עומד בתקן", "100%
  compliance", "protects you from lawsuits", "מוגן מתביעות". The product's
  entire position is that it does *not* do those things; the FTC fined
  accessiBe $1M over exactly this.
