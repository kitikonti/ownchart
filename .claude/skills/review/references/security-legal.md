# Security & Legal

Checkliste für Security, Input Validation, XSS-Prävention, Licensing und GDPR-Compliance.

## Input Validation & Sanitization

- [ ] Prüfe dass ALLE User-Inputs validiert werden (Typ, Format, Wertebereich)
- [ ] Prüfe dass DOMPurify für jeden HTML-Content verwendet wird
- [ ] Prüfe dass File-Uploads validiert werden (Typ, Größe, Inhaltsstruktur) — OwnChart nutzt 6-Layer Validation Pipeline
- [ ] Stelle sicher dass KEIN `eval()` oder `new Function()` verwendet wird
- [ ] Stelle sicher dass KEIN `dangerouslySetInnerHTML` ohne DOMPurify existiert

## XSS Prevention

- [ ] Prüfe dass React Auto-Escaping genutzt wird (JSX statt innerHTML)
- [ ] Prüfe dass kein User-Content in Script-Tags oder Event-Handlern landet
- [ ] Prüfe dass URL-Parameter vor Verwendung sanitisiert werden
- [ ] Prüfe dass externe Links `rel="noopener noreferrer"` haben

## Sensitive Data Protection

- [ ] Stelle sicher dass KEINE API Keys, Tokens oder Secrets im Code sind
- [ ] Stelle sicher dass KEINE Credentials in Comments oder Commit Messages stehen
- [ ] Stelle sicher dass KEINE internen URLs/Endpoints die Architektur exponieren
- [ ] Stelle sicher dass KEINE persönlichen Informationen im Code sind (Emails, Namen, Telefonnummern)
- [ ] Stelle sicher dass KEINE Development/Staging URLs in Production-Code sind
- [ ] Prüfe korrekte Nutzung von Environment Variables (Vite: `import.meta.env`)

## Secure Coding Practices

- [ ] Prüfe auf Prototype Pollution Prevention — `Object.create(null)` für User-kontrollierte Keys
- [ ] Prüfe auf sicheres Parsing — try-catch um `JSON.parse` mit anschließender Validation
- [ ] Prüfe dass keine deprecated/vulnerablen APIs verwendet werden
- [ ] Prüfe auf sichere Regex — keine ReDoS-anfälligen Patterns

## Licensing Compliance

- [ ] Prüfe dass alle Dependencies kompatible Lizenzen haben (Projekt ist MIT)
- [ ] Stelle sicher dass KEIN GPL-Code verwendet wird (Copyleft inkompatibel mit MIT)
- [ ] Stelle sicher dass KEIN proprietärer/kommerzieller Code ohne Lizenz eingebunden ist
- [ ] Bei Bedarf prüfen: `npx license-checker --summary`

## Attribution & Copyright

- [ ] Prüfe dass Third-Party Code korrekt attributiert ist (mit Source-Link)
- [ ] Prüfe dass Algorithmus-Implementierungen die Quelle zitieren
- [ ] Prüfe dass Lizenz-Header vorhanden sind wo Dependencies es erfordern

## Privacy & GDPR

- [ ] Stelle sicher dass KEINE Analytics oder Tracking existiert — OwnChart ist privacy-first
- [ ] Prüfe dass localStorage nur für die eigenen Daten des Users genutzt wird (vollständig lokal)
- [ ] Stelle sicher dass KEINE Daten an externe Services gesendet werden
- [ ] Stelle sicher dass KEIN Fingerprinting oder User-Identifikation stattfindet

## Professional Standards

- [ ] Stelle sicher dass KEINE offensiven/unangemessenen Comments oder Variablen-Namen existieren
- [ ] Stelle sicher dass KEINE firmenspezifischen Referenzen vorhanden sind
- [ ] Stelle sicher dass KEINE unprofessionelle Sprache in Comments steht
- [ ] Stelle sicher dass KEINE TODO-Comments mit persönlichen Namen oder Emails existieren
