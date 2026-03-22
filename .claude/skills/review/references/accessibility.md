# Accessibility (a11y)

Checklist for semantic HTML, keyboard navigation, screen reader support, and color contrast.

## Semantic HTML

- [ ] Check correct heading hierarchy: h1 → h2 → h3, no skipping levels
- [ ] Check that `<button>` is used for actions and `<a>` for navigation — NOT div/span with onClick
- [ ] Check that `<form>` with correct submit handling is used where forms exist
- [ ] Check that native elements are preferred: `<input>` instead of custom text fields, `<select>` instead of custom dropdowns (where possible)

## Keyboard Navigation

- [ ] Check that ALL interactive elements are reachable via keyboard (Tab, Enter, Space)
- [ ] Check that focus styles are visible — NO `outline: none` without alternative focus indication
- [ ] Check that the tab order is logical and follows the visual order
- [ ] Check focus trapping in modals — focus must not land behind the modal
- [ ] Check that Escape closes modals/dropdowns
- [ ] Check that arrow keys work in menus/lists

## Screen Reader Support

- [ ] Check that icon buttons have ARIA labels (`aria-label="Save"`, `aria-label="Close"`)
- [ ] Check that images have alt text (empty alt for decorative: `alt=""`)
- [ ] Check that custom widgets have ARIA roles (`role="dialog"`, `role="menu"`, `role="tablist"`)
- [ ] Check whether live regions would be useful for dynamic content (`aria-live="polite"` for status updates)
- [ ] Check that ARIA states are correctly set: `aria-expanded`, `aria-selected`, `aria-disabled`, `aria-checked`

## Color & Contrast

- [ ] Check that color is NOT the only information carrier — additionally use icons and/or text
- [ ] Check contrast ratio: ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18px+ or 14px+ bold)
- [ ] Check focus indicators: Visible and with sufficient contrast for keyboard users
- [ ] Consider color blindness: Avoid red/green combinations as the sole differentiating factor
