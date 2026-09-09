---
name: wrap-up
description: End-of-session close-out for the שקוף project. Verifies the build and accessibility, reconciles the Robells board against what actually shipped, writes a handoff note, and prepares a commit for approval. Also drives a release when one is shipping — version bump, changelog entry, npm publish, and propagation checks. Use when the user says they want to wrap up, finish, stop for the day, clear the session, asks what state things are in before leaving, asks to publish, release or cut a version, or asks to tidy, sync, audit or update the board — reviewing cards, moving statuses between columns, editing card details, filing new tasks, or adding comments.
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

## Step 3 — Board hygiene

Board **`תוסף - Shakuf`**, id `dbe070e5-0af9-4f4a-b4fa-77ebee21fcbe`. Tools are
`mcp__robells__*`.

| column | id | meaning |
|---|---|---|
| `Backlog` | `1b053f37-b8ac-456a-b821-b4a3605bc450` | not started, not scheduled |
| `מוכן לפיתוח` | `16ea59fd-c15d-43a0-8e8f-5fc5a8ad0626` | ready to pick up |
| `בתהליך` | `65ddc979-468f-4874-9a65-45e47510eb76` | in progress |
| `ביקורת קוד` | `ba4b9482-cd8a-4c83-9b1e-8935d1ebe5f7` | written, under review |
| `בבדיקות` | `c035e24c-800d-4c3f-a5d5-f3274f06d447` | in testing |
| `הושק` | `1899e62b-b979-434d-b953-f8f2756ee91f` | **the only `is_terminal` column** — "closed" means this id |

Sole member and default assignee: יובל רחמים,
`3e03c452-f844-48a1-8dd9-c5f617d1cbfc`. Never invent a UUID — re-read it with
`get_board` (columns, members) or `list_boards` (board ids) if you don't have it
in front of you.

### 3.1 — Read the board, not just the backlog

`list_tasks` returns full descriptions, and this board's cards are long, so pull
**one column at a time** with `status_id` rather than the whole board at once.
`get_task` for a single card, `list_comments` for its discussion.

The columns that matter for hygiene are the mid-flow ones — `בתהליך`,
`ביקורת קוד`, `בבדיקות`. A card parked there is the board's way of saying "this
is still in motion", and that claim decays silently.

### 3.2 — Reconcile every mid-flow card against reality

**The board does not know when work finished. Only the repo, the site and npm
do.** So for each card outside `Backlog` and `הושק`, go and check whether the
thing it describes is actually present now: grep the source, load the live page,
read the changelog entry, check `npm view` for the version it targets.

Then propose a move **with that evidence attached**. Never infer completion from
age — "it's been in review three weeks so it's probably done" is how a genuinely
unfinished card gets closed.

> **This is not hypothetical.** On 2026-09-09 two cards had been sitting in
> `ביקורת קוד` since 14 August: the `:host` stacking bug and the `data-mount`
> stacking-context documentation. Both had shipped in 0.3.1 three weeks earlier
> — the fix is in `pinHostStacking()`, and the warning callout is live on
> `/setup/`. Nothing moved them, because closing a card is the one step of a
> release with no build error to force it.

### 3.3 — What to propose, and with which tool

| situation | tool | notes |
|---|---|---|
| finished this session, or found already shipped | `set_task_status` → `הושק` | say what you checked, not just "done" |
| advanced but not finished | `add_comment` | record what moved *and* what remains; do **not** close |
| card's facts are now wrong or the scope changed | `update_task` | fixes title / description / priority |
| discovered work with no card | `create_task` | search first, see below |
| card belongs to someone else's queue | `assign_task` / `unassign_task` | this board has one member, so rarely |

### 3.4 — Contract details that are easy to get wrong

- **`set_task_status` vs `move_task`.** `set_task_status(task_id, status_id)`
  moves a card between **columns on the same board** — that is the one you want
  almost always. `move_task(task_id, board_id, status_id)` moves it to a
  **different board**. The names invite exactly the wrong guess.
- **`create_task` and `add_comment` are not idempotent** — a blind retry
  duplicates. `update_task`, `set_task_status`, `assign_task` and `unassign_task`
  are safe to retry.
- **Before filing:** `search_tasks` (fuzzy over title + description, across every
  board, `q` ≤ 100 chars) to avoid a duplicate card.
- **Before commenting:** `list_comments` returns **newest last**, so read the
  tail, not the head, to see whether you already said this.
- **Limits:** comment body 500 chars, description 3500, title 750. This board's
  cards run near the description cap, so an `update_task` that appends can
  silently need trimming.

### 3.5 — Write cards that match the board

Existing cards are in Hebrew and carry the measurement, the reasoning, and what
was *ruled out* — not just the ask. A one-line card is out of place here and
will not survive contact with a future session that needs to know why. Match
that: what was observed, what it means, what to do, and what was already tried
and rejected.

**Propose all of this as one batch. Write nothing until the single yes in
Step 7.**

## Step 4 — Draft the handoff note

Prepare an entry to prepend to `.claude/handoff.md` (gitignored). Keep it
short enough to actually be read by `/pick-up` at the start of the next session:

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

Two heading kinds the existing entries use that the template above omits, both
worth reaching for: a **`<h3>Note for …</h3>`** aimed at a specific audience
("Note for host pages", "Note for anyone storing preferences") for a consequence
that is not itself a change, and **`<h3>Internal</h3>`** for work with no
user-visible effect that still explains a number, such as a bundle-size move.
Order runs Added, Fixed, Breaking, then any Notes, then Internal; omit what is
empty.

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

> **If the publish does not immediately follow, the site is left lying.** The
> push makes `/setup/`'s pinned examples point at `@<new version>` and puts the
> entry on `/changelog/`, whose own header promises "every released version".
> Until npm has the version, those pinned URLs return **404** and the changelog
> claims something untrue.
>
> Measured on 2026-09-09, when the publish was blocked for days by a 2FA
> lockout: `@0.4.0` → 404, `@0.3.1` → 200, unversioned → 200 still serving
> 0.3.1. The quick-install block was never affected, because it uses the
> unversioned URL. What broke was aimed squarely at the installers least able to
> shrug it off — controlled environments and anyone needing SRI.
>
> So if publishing stalls for any reason, **ship a holding commit the same
> session**: roll the pinned examples back to the last real version, and mark
> the changelog entry as pending rather than released. `site/changelog/index.html`
> already has the pattern in its `0.2.1` entry — a callout stating plainly that
> installing it will fail. Reverting that commit is then part of the eventual
> publish. Leave `packages/core/package.json` at the new version; the source
> genuinely is that version, only the publish is missing.

```bash
npm publish --dry-run --workspace @shakuf-widget/widget
```

Confirm the payload before the real publish — expect **7 files, ~50 kB**: the
two bundles, `dist/index.d.ts`, `package.json`, and `LICENSE` / `NOTICE` /
`DISCLAIMER.md` copied in by `prepack`. **No `.map` files.**

**The final publish is the user's to run, always.** npm is configured with
`auth-type=web`, and the account has 2FA on publishes. npm therefore needs to
open a browser and needs an interactive terminal to do it — neither of which
this shell has. **Prepare everything, confirm the dry-run, then hand over the
command.** Do not keep retrying; the failure is structural, not transient.

> **`EOTP` has two different causes, and its own message names neither.** It
> reads "requires a one-time password from your authenticator", but there is no
> authenticator app on this account — `--otp=<code>` is never the answer.
>
> Run `npm whoami` to tell the two apart:
>
> - **`401`** → the web-login session expired. Also seen surfacing as `E404`,
>   which looks like a missing package. Fix: `npm login --auth-type=web`.
> - **a username** → the session is fine, and this is the ordinary per-publish
>   2FA confirmation. Nothing is broken; it simply cannot be completed from a
>   non-interactive shell. The user runs the publish themselves.
>
> Both were hit on 2026-08-14, in that order, which is how the distinction was
> found — a valid session still returns `EOTP` on publish.
>
> **A `401` is not always just an expired session.** On 2026-09-09 it was a full
> lockout: the account's only 2FA method was a security key, that key was
> deleted, and there were no recovery codes, so `npm login` could not complete
> either. Recovery is a support ticket at `npmjs.com/support` under
> *"I'm having trouble with my password, 2FA, or using my account"*, quoted at
> 1–3 business days. If you hit this, do not treat the release as a few minutes
> away: ship the holding commit from 5.3 and write the block into the handoff.
>
> Two facts worth offering him, because both are provable in minutes and
> strengthen the ticket: the published package metadata names
> `github.com/Yu1586/Shakuf` as its repository and
> `https://shakuf.yuvalrahamim.com` as its homepage, and he controls both.

```bash
npm publish --workspace @shakuf-widget/widget
```

### 5.4 — Verify it actually propagated

Publishing is not shipping. Check, and report the results:

- `npm view @shakuf-widget/widget version` and `dist-tags` — is `latest` the new
  version?
- `https://cdn.jsdelivr.net/npm/@shakuf-widget/widget` — the **unversioned** URL,
  because that is the one `/setup/` tells installers to paste. It must contain a
  string unique to this release. **Never settle for a 200**: the CDN serves the
  previous build with a perfectly healthy 200, and the byte count barely moves.
  Pick a discriminator that only exists in the new code and grep the response.
- **Then purge, because it will be stale.** Measured on the 0.3.1 release:
  `latest` was already 0.3.1 on npm while the unversioned URL kept serving
  0.3.0 with `age: 1843`, `s-maxage=43200` (12h at the edge) and
  `max-age=604800` (7 days in browsers).

  ```bash
  curl https://purge.jsdelivr.net/npm/@shakuf-widget/widget
  ```

  Expect `"status": "finished"`. Re-fetch the unversioned URL afterwards and
  confirm the discriminator is now present — the purge is only believed once
  re-measured.

  **Fetching the `...@<version>` URL does NOT do this.** That URL is immutable
  and cached separately; requesting it leaves the unversioned alias untouched.
  This was tried first on 0.3.1 and did nothing, which is how the purge step
  was found.
- Note what a purge cannot reach: browsers that already downloaded the old file
  keep it for up to 7 days. Edge propagation is immediate, visitor propagation
  is not, and a release note should not imply otherwise.
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
