# Security Policy / מדיניות אבטחה

## Reporting a vulnerability

Two private routes, use whichever you prefer. Please do not open a public issue
for a security problem.

- **GitHub:** the **Report a vulnerability** button under this repository's
  **Security** tab. It opens a private advisory visible only to the maintainer.
- **Email:** **shakuf@yuvalrahamim.com**.

Include: what you found, how to reproduce it, and the affected version. A
proof-of-concept helps. This is a one-person project, so the aim is an
acknowledgement within **5 business days** and an assessment within **14 days**.
Those are targets, not guarantees.

We will credit you in the release notes unless you ask us not to.

## Supported versions

Fixes land in the latest release only. The unversioned CDN URL that the setup
guide recommends always serves the latest, so most installs receive a fix
without doing anything. A pinned install has to be updated by hand.

| Version | Supported |
|---|---|
| Latest release on npm | Yes |
| Any older version | No, upgrade to the latest |

## דיווח על בעיית אבטחה

שני ערוצים פרטיים, לבחירתכם. אין לפתוח issue ציבורי בנושא אבטחה.

- **GitHub:** כפתור **Report a vulnerability** בלשונית **Security** של המאגר.
- **דוא״ל:** **shakuf@yuvalrahamim.com**.

יש לכלול: תיאור הממצא, אופן שחזור והגרסה המושפעת. זהו פרויקט של אדם אחד, ולכן
היעד הוא אישור קבלה בתוך **5 ימי עסקים** והערכה ראשונית בתוך **14 יום**. אלה
יעדים ולא התחייבות.

תיקונים יוצאים רק בגרסה האחרונה.

---

## Scope

This is a client-side script that runs on third-party websites. The threat model
is correspondingly narrow, and the following are in scope:

- Anything allowing script execution on a host page via the widget
  (DOM-based XSS, prototype pollution, unsafe `innerHTML` — the codebase builds
  every node with `createElement`/`textContent` precisely to avoid this class).
- Escaping the shadow root in a way that breaks or hijacks the host page.
- Anything causing the widget to transmit data anywhere. **The widget makes no
  network requests at all.** A build that does is a security bug by definition.
- Supply-chain issues in the published npm package or its build.

## Out of scope

- Accessibility defects — these are ordinary bugs, please open an issue.
- The *host site's* own vulnerabilities.
- Reports that the widget does not make a site WCAG- or SI 5568-conformant.
  It does not, by design, and this is documented in [DISCLAIMER.md](DISCLAIMER.md).

## No bounty

This is a free, unfunded project. There is no bug bounty. Reports are still
genuinely welcome and will be handled properly.
