# Security & Legal

Checklist for security, input validation, XSS prevention, licensing, and GDPR compliance.

## Input Validation & Sanitization

- [ ] Check that ALL user inputs are validated (type, format, value range)
- [ ] Check that DOMPurify is used for all HTML content
- [ ] Check that file uploads are validated (type, size, content structure) — OwnChart uses a 6-layer validation pipeline
- [ ] Ensure that NO `eval()` or `new Function()` is used
- [ ] Ensure that NO `dangerouslySetInnerHTML` exists without DOMPurify

## XSS Prevention

- [ ] Check that React auto-escaping is used (JSX instead of innerHTML)
- [ ] Check that no user content ends up in script tags or event handlers
- [ ] Check that URL parameters are sanitized before use
- [ ] Check that external links have `rel="noopener noreferrer"`

## Sensitive Data Protection

- [ ] Ensure that NO API keys, tokens, or secrets are in the code
- [ ] Ensure that NO credentials are in comments or commit messages
- [ ] Ensure that NO internal URLs/endpoints expose the architecture
- [ ] Ensure that NO personal information is in the code (emails, names, phone numbers)
- [ ] Ensure that NO development/staging URLs are in production code
- [ ] Check correct usage of environment variables (Vite: `import.meta.env`)

## Secure Coding Practices

- [ ] Check for prototype pollution prevention — `Object.create(null)` for user-controlled keys
- [ ] Check for safe parsing — try-catch around `JSON.parse` with subsequent validation
- [ ] Check that no deprecated/vulnerable APIs are used
- [ ] Check for safe regex — no ReDoS-vulnerable patterns

## Licensing Compliance

- [ ] Check that all dependencies have compatible licenses (project is MIT)
- [ ] Ensure that NO GPL code is used (copyleft incompatible with MIT)
- [ ] Ensure that NO proprietary/commercial code is included without a license
- [ ] If needed, check: `npx license-checker --summary`

## Attribution & Copyright

- [ ] Check that third-party code is correctly attributed (with source link)
- [ ] Check that algorithm implementations cite the source
- [ ] Check that license headers are present where dependencies require them

## Privacy & GDPR

- [ ] Ensure that NO analytics or tracking exists — OwnChart is privacy-first
- [ ] Check that localStorage is only used for the user's own data (fully local)
- [ ] Ensure that NO data is sent to external services
- [ ] Ensure that NO fingerprinting or user identification takes place

## Professional Standards

- [ ] Ensure that NO offensive/inappropriate comments or variable names exist
- [ ] Ensure that NO company-specific references are present
- [ ] Ensure that NO unprofessional language is in comments
- [ ] Ensure that NO TODO comments with personal names or emails exist
