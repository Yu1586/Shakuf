# Security Policy / מדיניות אבטחה

## Reporting a vulnerability

Email **[SECURITY EMAIL]**. Please do not open a public issue for a security
problem.

Include: what you found, how to reproduce it, and the affected version. A
proof-of-concept helps. You will get an acknowledgement within **5 business
days** and an assessment within **14 days**.

We will credit you in the release notes unless you ask us not to.

## דיווח על בעיית אבטחה

יש לשלוח דוא״ל אל **[SECURITY EMAIL]**. אין לפתוח issue ציבורי בנושא אבטחה.

יש לכלול: תיאור הממצא, אופן שחזור והגרסה המושפעת. אישור קבלה יישלח בתוך
**5 ימי עסקים** והערכה ראשונית בתוך **14 יום**.

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
