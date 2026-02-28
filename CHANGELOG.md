# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.0.3](https://github.com/kitikonti/ownchart/compare/v1.0.2...v1.0.3) (2026-02-28)


### Code Refactoring

* complete TaskId branded type coverage in source and tests ([53754ce](https://github.com/kitikonti/ownchart/commit/53754ce883b990c29f1ba961b8b4cc3913604ac8))
* complete TaskId branded type migration across codebase ([75def92](https://github.com/kitikonti/ownchart/commit/75def927341248bd253cbec7392bbd67cbc4cc31)), closes [#57](https://github.com/kitikonti/ownchart/issues/57)
* introduce branded TaskId type for compile-time safety ([#57](https://github.com/kitikonti/ownchart/issues/57)) ([de16899](https://github.com/kitikonti/ownchart/commit/de168993ac0a3d38dce6414306515cb44bf779b6))
* use toTaskId() factory at all system boundaries ([d017949](https://github.com/kitikonti/ownchart/commit/d017949f1a299bc45883e12773e23658f1ba1f59))

## [1.0.2](https://github.com/kitikonti/ownchart/compare/v1.0.1...v1.0.2) (2026-02-27)


### Bug Fixes

* replace broken website-relaunch example with Mars Colony project ([0c0d74a](https://github.com/kitikonti/ownchart/commit/0c0d74ae5c03039c59ba8f27181b9a0cdb261a05))

## [1.0.1](https://github.com/kitikonti/ownchart/compare/v1.0.0...v1.0.1) (2026-02-27)


### Bug Fixes

* add v1.0.0 changelog entry and extract tag-specific release notes ([49d8f7e](https://github.com/kitikonti/ownchart/commit/49d8f7eeb11becdfe51710ee4a90ef0d54758b4b))

## [1.0.0](https://github.com/kitikonti/ownchart/compare/v0.0.52...v1.0.0) (2026-02-27)

OwnChart v1.0.0 — the first stable release. All MVP features are complete.

### Highlights

* **Gantt Chart Core** — task hierarchy with indent/outdent, summary tasks, milestones
* **Interactive Timeline** — drag to move/resize tasks, infinite scroll, exponential zoom, cursor-anchored zoom
* **Dependencies** — finish-to-start arrows with click-to-create and validation
* **Multi-Select & Clipboard** — rectangular marquee selection, copy/cut/paste across tabs
* **File Operations** — save/load `.ownchart` files with 6-layer validation pipeline
* **Undo/Redo** — full command-pattern history for all operations
* **Export** — PNG, PDF (vector), and SVG with live preview dialog
* **Smart Colors** — 5 color modes (Manual, Theme, Summary Group, Task Type, Hierarchy)
* **Ribbon UI** — MS Office-style tabbed toolbar (File, Task, View, Help)
* **User Preferences** — date format, first day of week, week numbering, UI density
* **Holidays** — 199 countries via date-holidays, highlighted in timeline
* **Working Days Mode** — durations and dragging respect non-working days
* **Welcome Tour & Help Panel** — onboarding and keyboard shortcut reference
* **PWA & Branding** — installable, custom logo, Open Graph meta tags
* **834 unit tests** with 80%+ coverage

## [0.0.52](https://github.com/kitikonti/ownchart/compare/v0.0.51...v0.0.52) (2026-02-27)


### Bug Fixes

* handle both H2 and H3 version headers in release workflow ([45d7d14](https://github.com/kitikonti/ownchart/commit/45d7d14f9d41556b633384fe94497dc6bb0d4aba))

## [0.0.51](https://github.com/kitikonti/ownchart/compare/v0.0.50...v0.0.51) (2026-02-27)


### Bug Fixes

* allow unhiding first hidden rows via top-edge indicator ([#58](https://github.com/kitikonti/ownchart/issues/58)) ([7d7f2bd](https://github.com/kitikonti/ownchart/commit/7d7f2bd4aed8db118cec25c465609cb1d06378aa))
* persist color mode across page reload ([#61](https://github.com/kitikonti/ownchart/issues/61)) ([715d10f](https://github.com/kitikonti/ownchart/commit/715d10f9fa7e8fb32806aae33e416a3f914f898c))

### [0.0.50](https://github.com/kitikonti/ownchart/compare/v0.0.49...v0.0.50) (2026-02-26)


### Code Refactoring

* align placeholder cell click behavior with Cell.tsx contract ([d5c3f44](https://github.com/kitikonti/ownchart/commit/d5c3f44a0f5b55d44b5941cb6804c30027b7cacb))
* **export:** clean up PdfPreview from code review findings ([78f4136](https://github.com/kitikonti/ownchart/commit/78f413664ac3691fa0085110fed401f55bbc4bac))
* **export:** extract shared PDF layout constants and deduplicate PdfPreview ([19c9c5b](https://github.com/kitikonti/ownchart/commit/19c9c5b4507ae1a2758b8ed0383c874900ac517e))
* **export:** harden PdfPreview from code review findings ([1e06518](https://github.com/kitikonti/ownchart/commit/1e0651822962fd91fa7af85a0932756174dcd10e))
* **export:** remove unsafe type assertion in PdfPreview readability warning ([836fc97](https://github.com/kitikonti/ownchart/commit/836fc97e213f8d74c4f219b761e08f8f18b42f2a))
* extract ARROW_NAV, add ROW_NUMBER_COLUMN_ID, clean up review findings ([9627dfc](https://github.com/kitikonti/ownchart/commit/9627dfc14838a8818d4bf7b66f6103347778ab54))
* extract hooks, add readOnly Cell prop, fix Tab navigation in placeholder row ([d49513e](https://github.com/kitikonti/ownchart/commit/d49513e7bc74002057704abb68ff0b0675bb34c5))
* extract PlaceholderDataCell, add memo/focus/keyboard to placeholder row ([d6bfee3](https://github.com/kitikonti/ownchart/commit/d6bfee322845f396b24c8182c99f5df9b7e35418))
* extract shared utilities, fix perf and a11y in TaskDataCells & NewTaskPlaceholderRow ([e873316](https://github.com/kitikonti/ownchart/commit/e87331627d0f303ef70f7da81103b027aa3b4ca2))
* extract useIsCellEditing hook, tighten HexColor types, remove redundant setTimeout ([f725a7a](https://github.com/kitikonti/ownchart/commit/f725a7abfbe12d6595bac257a41ac1d3a50ae17d))
* fix arrow-key navigation gap in placeholder name cell, extract Props interfaces ([3c404e0](https://github.com/kitikonti/ownchart/commit/3c404e0ee811af1d10579a82dde58bfbd092d794))
* fix InlineProjectTitle review findings — a11y, contrast, measurement ([91dfd46](https://github.com/kitikonti/ownchart/commit/91dfd46036f08316121081e1c5d341a7c539d4b9))
* fix review findings — perf, a11y, consistency in TaskDataCells & NewTaskPlaceholderRow ([e330e44](https://github.com/kitikonti/ownchart/commit/e330e44aeabcb8b07627ee92db2496a2e0a96880))
* fix review findings in TaskDataCells, NewTaskPlaceholderRow, TaskTypeIcon ([e92b37b](https://github.com/kitikonti/ownchart/commit/e92b37b853c119d7a09a46881edd3972227d5de6))
* fix Ribbon review findings — a11y, focus mgmt, contrast, correctness ([0cdc46e](https://github.com/kitikonti/ownchart/commit/0cdc46e5e7d7f8628c5771363167453781e07f51))
* fix Ribbon review findings — Escape guard, a11y focus, type safety ([d9df394](https://github.com/kitikonti/ownchart/commit/d9df394ae4baa1a6ed68827cd1171c2e18e28bdf))
* fix Ribbon review findings — focus mgmt, a11y, overflow, Tab-close ([dd9a434](https://github.com/kitikonti/ownchart/commit/dd9a43456d855e76f715ec0f2ee0d158f4214f84))
* fix Ribbon review findings — store sync, a11y, DRY, tests ([028465a](https://github.com/kitikonti/ownchart/commit/028465a49ef97d66b71ea48a9cb8f90861f92e30))
* harden file operations per code review findings ([2466b29](https://github.com/kitikonti/ownchart/commit/2466b29dbefbdaef5fcf509a4cbfcafb4458e586))
* harden file operations per code review findings (batch 10) ([73a244f](https://github.com/kitikonti/ownchart/commit/73a244fc40d011e30eba179ae62047f42fc9b2f5))
* harden file operations per code review findings (batch 2) ([4027687](https://github.com/kitikonti/ownchart/commit/4027687c839413f90dafd5c4b0e2fc8edc9b06d1))
* harden file operations per code review findings (batch 3) ([5c8bb37](https://github.com/kitikonti/ownchart/commit/5c8bb37773d58809868f7c4b57499b30f01c3996))
* harden file operations per code review findings (batch 4) ([efc75a5](https://github.com/kitikonti/ownchart/commit/efc75a5cd5e9a92d1f4ad5877ae886fd40444faa))
* harden file operations per code review findings (batch 5) ([c217db5](https://github.com/kitikonti/ownchart/commit/c217db551188857014f86a5215505b1ee0b33d70))
* harden file operations per code review findings (batch 6) ([83f1bdb](https://github.com/kitikonti/ownchart/commit/83f1bdb4162bd5ea8f57a80933b3f9bb92ab22bb))
* harden file operations per code review findings (batch 7) ([e1a4c9a](https://github.com/kitikonti/ownchart/commit/e1a4c9ac834ede0d506535c253c8dc256530338c))
* harden file operations per code review findings (batch 8) ([d55c803](https://github.com/kitikonti/ownchart/commit/d55c80391ba18e60eeca5af8b037ffbddb4617de))
* harden file operations per code review findings (batch 9) ([6e4a928](https://github.com/kitikonti/ownchart/commit/6e4a928a4932b48679e9d30c0150a180155ac313))
* harden TaskDataCells & NewTaskPlaceholderRow with tests and consistency fixes ([feae112](https://github.com/kitikonti/ownchart/commit/feae112b539bd8026e5459b68926fbeedde47286))
* improve Ribbon components per code review ([3cd0520](https://github.com/kitikonti/ownchart/commit/3cd0520c36ea9b56e29ee70bb5bec4dd2e3c1246))
* improve type safety and extract sub-components in TaskDataCells & NewTaskPlaceholderRow ([b9580ba](https://github.com/kitikonti/ownchart/commit/b9580ba809a1ebe1d60362ff0223412bfd6f3453))
* tokenize cell z-index, add memo/a11y to placeholder row, DRY TaskDataCells ([2575f4d](https://github.com/kitikonti/ownchart/commit/2575f4d70b571df6bca0e3dd884dcb931ee9d3bd))
* tokenize placeholder cell colors, fix milestone duration classification, add memo ([dacc8a8](https://github.com/kitikonti/ownchart/commit/dacc8a8c4fb960627e5fe8fcc5e78a51f2b505b0))

### [0.0.49](https://github.com/kitikonti/ownchart/compare/v0.0.48...v0.0.49) (2026-02-25)


### Bug Fixes

* **test:** use regex match for aria-label in TaskTable show-all tests ([bfa8182](https://github.com/kitikonti/ownchart/commit/bfa8182f2530f5f8384fe48f1da3c799ef7e8358))


### Code Refactoring

* extract useTaskRowData hook and fix review findings ([c59a73d](https://github.com/kitikonti/ownchart/commit/c59a73d354f685e98e6ee5e11da5f1145d4d3bd6))
* fix review findings in RowNumberCell/TaskTable and add smoke tests ([e6361e8](https://github.com/kitikonti/ownchart/commit/e6361e83aaadf1d543aa5610512636cc040d273b))
* fix review findings in RowNumberCell/TaskTable and add smoke tests ([f5d41f8](https://github.com/kitikonti/ownchart/commit/f5d41f8741080e596a6256a951f98105a9bf0d79)), closes [#5F6368](https://github.com/kitikonti/ownchart/issues/5F6368) [#9ca3](https://github.com/kitikonti/ownchart/issues/9ca3)
* fix review findings in RowNumberCell/TaskTable and add smoke tests ([3670eab](https://github.com/kitikonti/ownchart/commit/3670eab3ea3f37e09bd3bb0a00db4be1b55843b5))
* use design tokens and narrow store subscriptions in TaskList ([c0b162d](https://github.com/kitikonti/ownchart/commit/c0b162d7d32d64880534654979b245ecd43ac39c))

### [0.0.48](https://github.com/kitikonti/ownchart/compare/v0.0.47...v0.0.48) (2026-02-25)


### Code Refactoring

* extract ExportDialog logic into useExportDialog hook ([1660d28](https://github.com/kitikonti/ownchart/commit/1660d28cd2d21cae6b61303b04fce2876c8dd81d))
* extract ExportDialogFooter and add hook unit tests ([1e28368](https://github.com/kitikonti/ownchart/commit/1e283685954b5341c81b193cc2e49704cf9ba595))
* extract footer button width constants in ExportDialog ([b0631db](https://github.com/kitikonti/ownchart/commit/b0631db308a22080eebdfe24dec6b7d986913be1))
* extract layout constants and simplify ExportDialog conditionals ([2bee5e4](https://github.com/kitikonti/ownchart/commit/2bee5e4baa5cbc83039399d68e033d7984c10489))

### [0.0.47](https://github.com/kitikonti/ownchart/compare/v0.0.46...v0.0.47) (2026-02-23)


### Bug Fixes

* **ci:** set HOME=/root for Firefox in Playwright container ([2b2f3ce](https://github.com/kitikonti/ownchart/commit/2b2f3ceffa6e2933753c1297f2b9a363c04d4eec))


### Performance Improvements

* **ci:** use Playwright Docker image instead of installing browsers ([ed6b09b](https://github.com/kitikonti/ownchart/commit/ed6b09bf6f6fed59f00bf2945ebbc119ab04c03f))

### [0.0.46](https://github.com/kitikonti/ownchart/compare/v0.0.45...v0.0.46) (2026-02-23)


### Bug Fixes

* **ci:** replace deprecated --production flag with --omit=dev in npm audit ([1d304d8](https://github.com/kitikonti/ownchart/commit/1d304d87ecbade2a3abc1d700cb922c6a1438f64))
* remove getColumnDisplayValue tests after merge conflict resolution ([2c6b4b5](https://github.com/kitikonti/ownchart/commit/2c6b4b57e52eda1ba1b310125331bdda1dffd50b))
* resolve stale closure bug and inconsistent edit cleanup in Cell ([b817e8a](https://github.com/kitikonti/ownchart/commit/b817e8aba533746492b3aee54150476c64c198aa))


### Code Refactoring

* add focus trapping, design tokens, and Tailwind hover to ColorPickerPopover ([e369987](https://github.com/kitikonti/ownchart/commit/e369987fbb5bdfc6b9298b914a6ba2551c24662d))
* apply review cleanup to types.ts after merge ([d2a6f5c](https://github.com/kitikonti/ownchart/commit/d2a6f5c1067af19470367f6439428eace6c0c07c))
* clean up fileDialog.ts and types.ts per code review ([386fe22](https://github.com/kitikonti/ownchart/commit/386fe22542dd6d606b4bacda150c4d8a838907f2))
* clean up RowNumberCell and TaskTable per code review ([1afe40f](https://github.com/kitikonti/ownchart/commit/1afe40f6d86a40f99c6669a802a53117cc288a72))
* ColorDropdown migration to Tailwind and review fixes ([b216879](https://github.com/kitikonti/ownchart/commit/b2168790828504223236ff9a56f96f31cc696910))
* extract getColumnDisplayValue into export/columns utility ([b1f35e9](https://github.com/kitikonti/ownchart/commit/b1f35e9a5d9193fd1292a67249f25af2e478cc51))
* extract hooks from GanttLayout and centralize constants ([01df543](https://github.com/kitikonti/ownchart/commit/01df54396d27fc9b43cd0c4ced4d7ca7fb2db026))
* extract IconWithBadge, harden undo descriptions, add ribbon tab tests ([d3c460b](https://github.com/kitikonti/ownchart/commit/d3c460b9ffef94f4e71bee0d6e02d6e272533297))
* extract NAME_COLUMN_ID constant for name column checks ([e90d700](https://github.com/kitikonti/ownchart/commit/e90d700dc1ff67a2a18d4996a873252b214ed611))
* extract positioning logic and stabilize ColorPickerPopover ([66eed41](https://github.com/kitikonti/ownchart/commit/66eed416ba1d4e8fb6afd5c9f1fa37c371fcdc2d))
* extract ribbon tab logic into custom hooks ([1542eba](https://github.com/kitikonti/ownchart/commit/1542eba3fdad548283112984cc7d7fb371214d87))
* extract RowNumberCell config, add React.memo, clean up TaskTable ([0e8ffaa](https://github.com/kitikonti/ownchart/commit/0e8ffaaaf09df91ce38669068f1e76daf98ade80))
* extract sub-components and use design tokens in ColorDropdown ([fd0a722](https://github.com/kitikonti/ownchart/commit/fd0a722b52d8439d4c32680a46c8b62e36478793))
* extract sub-components, add Z_INDEX tokens, and harden ColorPickerPopover ([fb4eee5](https://github.com/kitikonti/ownchart/commit/fb4eee5557cf6ad3c453b4976d1b9478b97156e3))
* extract TimelinePanel from GanttLayout and add ARIA landmarks ([5063bae](https://github.com/kitikonti/ownchart/commit/5063bae0926596ed5f6dff2f05e40c6ebe7755fb))
* extract useCellEdit hook from Cell component ([dda529f](https://github.com/kitikonti/ownchart/commit/dda529f0b0ba88989e940b938a1e1706846a0293))
* fix ARIA role ownership and improve test coverage in ColorDropdown ([b859bb1](https://github.com/kitikonti/ownchart/commit/b859bb14876591d0933ef2e41a6a5e413d534d2d))
* fix aria-selected validity and extract constant in ColorDropdown ([2bf1291](https://github.com/kitikonti/ownchart/commit/2bf1291d0372d630a5aa73478394bca9af1142d5))
* fix review findings in ColorDropdown (a11y, types, Tailwind) ([cad87ac](https://github.com/kitikonti/ownchart/commit/cad87ac3639f1c5e1a47d840f1b9f26c650fa453))
* fix review findings in ColorDropdown (aria, label, tests) ([761b6b1](https://github.com/kitikonti/ownchart/commit/761b6b1267acab72edc5144d660dfd96569dacad))
* fix review findings in file operations validation pipeline ([ffd55ec](https://github.com/kitikonti/ownchart/commit/ffd55ec1dc61a0f4a7b21d80ab7b60dc095ee987))
* fix review findings in ribbon tab components ([a48c4ac](https://github.com/kitikonti/ownchart/commit/a48c4aca115b92a210e77e26785d96ffdd5d3d0c))
* harden file operation sanitization and add lag validation ([4c97612](https://github.com/kitikonti/ownchart/commit/4c97612358d9d3a030f817226ff1360af29f3be4))
* harden file operation sanitization and improve code structure ([e1fa983](https://github.com/kitikonti/ownchart/commit/e1fa983895a1bf8c129b8e53de7b618af2270d07))
* harden file operation validation and fix review findings ([5e7812c](https://github.com/kitikonti/ownchart/commit/5e7812c76b3f39a0af3f098497160236fc436450))
* harden fileDialog fallback and improve types.ts forward-compat ([87e7960](https://github.com/kitikonti/ownchart/commit/87e7960d482acf406dde3a8119f26d5a16655507))
* harden validation pipeline and add dependency round-trip support ([257eaaf](https://github.com/kitikonti/ownchart/commit/257eaaff0b1f308e38b51cd92b221e1bca7892eb))
* harden validation pipeline and add missing test coverage ([8189b32](https://github.com/kitikonti/ownchart/commit/8189b32b5a2ef1b4ce8a264d0d1559f78f6879b3))
* harden validation pipeline and fix deserialization bugs ([e1840e6](https://github.com/kitikonti/ownchart/commit/e1840e61ec99335ceb2ca877c67ffd60a289f425))
* improve Cell component from code review findings ([e01d22b](https://github.com/kitikonti/ownchart/commit/e01d22b4de373fe456aee0033f15ae75dc570ba4))
* improve ColorPickerPopover with design tokens, DRY, a11y, and tests ([a6149e5](https://github.com/kitikonti/ownchart/commit/a6149e5d4180490b6ef95aa5a88ff5410da50505))
* improve Ribbon components per code review findings ([2422691](https://github.com/kitikonti/ownchart/commit/2422691d5d63867884c23274f75c68966cf8727f))
* improve validation pipeline maintainability and fix zoom constant divergence ([841d149](https://github.com/kitikonti/ownchart/commit/841d149a6ae0e72b0e5257be5dac2854a30f7051))
* improve validation pipeline security, performance and maintainability ([cd25b5a](https://github.com/kitikonti/ownchart/commit/cd25b5ac9840613eb82bc5c073a178a70c37fd7d))
* migrate ColorDropdown to Tailwind and fix review findings ([841e1cb](https://github.com/kitikonti/ownchart/commit/841e1cb6f3b8ee18c7295a260212c1395b86f473))
* move static backgrounds from Tailwind classes to inline design tokens in ColorPickerPopover ([56c83fc](https://github.com/kitikonti/ownchart/commit/56c83fc4f8f5302083753d9a2796c140564f5d01))
* optimize Cell with derived selectors, memo, and a11y ([8fd3b76](https://github.com/kitikonti/ownchart/commit/8fd3b76b00280cf3cad6992a0104eb3fe3126c94))
* optimize GanttLayout scroll perf and extract testable logic ([b812149](https://github.com/kitikonti/ownchart/commit/b8121499b2adddd7ea6039a9b6b75a0aa9fd59ea))
* optimize TaskTableRow with React.memo and reduce store subscriptions ([476deb5](https://github.com/kitikonti/ownchart/commit/476deb5f297999a24994b6653fa5c43e0d7ed4ee))
* remove unused stickyContainerRef and fix ROW_HEIGHT naming ([98d2af1](https://github.com/kitikonti/ownchart/commit/98d2af1cabd35f62cdc1c2775ac04a19bf1766de))
* replace hardcoded colors with design tokens in Ribbon components ([9b388c1](https://github.com/kitikonti/ownchart/commit/9b388c13afe8097833478d5b1b2538b576e1797f))
* replace hardcoded padding with SPACING token in ZoomDropdown ([a5d2ff9](https://github.com/kitikonti/ownchart/commit/a5d2ff96f3b8cd3f931aa5da2870807fa863f71f))
* review ExportRenderer — extract helpers, stabilize refs, add edge-case tests ([4735884](https://github.com/kitikonti/ownchart/commit/4735884830c98769fc24e22f0dfdd06ab8f74654))
* review ExportRenderer — extract layout module, param object API, cell component ([c1dbbf4](https://github.com/kitikonti/ownchart/commit/c1dbbf45df748ab8e78dd1f6bc36fc3c72eb3b53))
* review ExportRenderer — extract shared layout, fix tokens, optimize lookups ([042defd](https://github.com/kitikonti/ownchart/commit/042defdfd91e45ce8439e856e793ed19a17f6af5))
* review ExportRenderer — fix layer direction, deduplicate labels, name constants ([c3259e4](https://github.com/kitikonti/ownchart/commit/c3259e42b328d9bec6827ba68cf22220b3116ea1))
* review ExportRenderer — narrow getColumnDisplayValue to ExportDataColumnKey ([c44cc63](https://github.com/kitikonti/ownchart/commit/c44cc638fdfb31a4c5f5d19ea63dea7161079d29))
* review ExportRenderer — remove dead fallback, tighten types, add display-value tests ([54f18a7](https://github.com/kitikonti/ownchart/commit/54f18a70e1c74f8409aef38141deb54fdf46f2c0))
* review ExportRenderer — split layout helper, align export colors to design tokens ([6ebc3e6](https://github.com/kitikonti/ownchart/commit/6ebc3e69f91feceb1f0a27d24b93aa0e1e0b6f75))

### [0.0.45](https://github.com/kitikonti/ownchart/compare/v0.0.44...v0.0.45) (2026-02-21)

### [0.0.44](https://github.com/kitikonti/ownchart/compare/v0.0.43...v0.0.44) (2026-02-21)


### Bug Fixes

* repair order rebuild for collapsed groups and improve canPasteCell validation ([f9f50e3](https://github.com/kitikonti/ownchart/commit/f9f50e37c3f655428bfedafbe1a0b2d2a7039638))
* return false from canPasteCell when target task does not exist ([746e056](https://github.com/kitikonti/ownchart/commit/746e056f801c1abdc429e41071c010bd8ab9703b))


### UI/UX

* replace OG social preview image with new 1200x630 JPG ([c70fd55](https://github.com/kitikonti/ownchart/commit/c70fd550514ee4f87ee893c69125cf71b33ac6e3))


### Code Refactoring

* add HexColor and PaletteId types for compile-time safety ([ec84590](https://github.com/kitikonti/ownchart/commit/ec845908fc0b29b6b0907319d2b927a3398f25f4))
* add type guards to column validators, remove unsafe coercions ([9bbe578](https://github.com/kitikonti/ownchart/commit/9bbe578906ecc8e9e597f940f6cafbc1382476a6))
* DependencyArrow accepts task names instead of full Task objects, remove deprecated JSX.Element return types ([70e793b](https://github.com/kitikonti/ownchart/commit/70e793b449281c66bb71f6edc2e11c47ab52b897))
* derive Command union from CommandParamsMap, replace unknown with Task[EditableField] ([ed3235b](https://github.com/kitikonti/ownchart/commit/ed3235b23c2293becb848e15a6103cf4c5dfe17a))
* DRY ConnectionHandles via .map(), per-handle hover radius, remove handleDelete wrapper ([8fd88ce](https://github.com/kitikonti/ownchart/commit/8fd88cee0f67bb10c6a8d61e184a4adf4a4f1c31))
* extract CascadeUpdate/ParentChange types, remove dead code in command.types.ts ([db094d9](https://github.com/kitikonti/ownchart/commit/db094d9b36d0d38659d294c9117fba47b5ecf54c))
* extract coolGray and slate scales in design-tokens, clarify brand ordering ([fb6ce9a](https://github.com/kitikonti/ownchart/commit/fb6ce9a87e2b6904772e34b7a0b8d339357db22b))
* extract DEFAULT_COLOR_MODE_STATE to config layer, fix stale doc path ([e925d29](https://github.com/kitikonti/ownchart/commit/e925d296e3b8fad0e075ebb9e8b20becb9a85cd9))
* extract EditableField to task.types.ts, strengthen typing in command.types.ts ([7f001cb](https://github.com/kitikonti/ownchart/commit/7f001cbdb761a8d43c10afe3ad8aa82ac0ae875f))
* extract empty clipboard constants in clipboardSlice ([e4d0bc4](https://github.com/kitikonti/ownchart/commit/e4d0bc4b30610855b12884017cac96df862e7534))
* extract executeRowPaste and executeCellPaste helpers ([5c92209](https://github.com/kitikonti/ownchart/commit/5c92209d1524f101353436af618eee4e7992dded))
* extract helpers from clipboardSlice and add clipboard data validation ([8c677fe](https://github.com/kitikonti/ownchart/commit/8c677fe765380e211deeda3f5a064532b89edb1b))
* extract initialState constant in fileSlice, remove redundant comments ([6fdd085](https://github.com/kitikonti/ownchart/commit/6fdd085f43d00a6225f7a1e7c575b52c8094540b))
* extract runtime constants from preferences.types.ts into config layer ([98912cc](https://github.com/kitikonti/ownchart/commit/98912ccbeab2a2f0282647b71d4269cd25925364))
* extract snapshot types, remove dead data in command.types.ts ([a1f702f](https://github.com/kitikonti/ownchart/commit/a1f702f8ba262941a93ec2f995306b22e7c91ec5))
* extract validator guards in tableColumns, add color source comments in design-tokens ([50a0d94](https://github.com/kitikonti/ownchart/commit/50a0d94b062ec7c727b15386fb3f897e4b9189b4))
* fix all review findings for clipboardSlice.ts ([ab7b975](https://github.com/kitikonti/ownchart/commit/ab7b97563720bc4879ce67a5906c4772df31cd53))
* improve clipboardSlice code quality and add missing tests ([65f367c](https://github.com/kitikonti/ownchart/commit/65f367c7dfac14a09481377e9e7486739e8316b4))
* improve dependencySlice type safety and remove dead code ([7e17414](https://github.com/kitikonti/ownchart/commit/7e17414ed4d37b36ec39e1a54f667f45b2d52872))
* move toast notifications from clipboardSlice to hook ([9c8c985](https://github.com/kitikonti/ownchart/commit/9c8c985f95c13428a73415e1f15be6580aca5139))
* remove redundant getDensityConfig action, add runtime validation for localStorage ([bdcd0a3](https://github.com/kitikonti/ownchart/commit/bdcd0a33de461dbf66c51872eb9b973ff1536506))
* remove redundant isUndoing/isRedoing guards in clipboardSlice ([f48e51b](https://github.com/kitikonti/ownchart/commit/f48e51bbcb0f38141f201486d7042cb541739bab))
* remove redundant null check in canPasteCell and add missing test ([b289548](https://github.com/kitikonti/ownchart/commit/b289548551586d79c26d9442bca77e6077135949))
* remove stale sprint references from dependency.types.ts ([be72540](https://github.com/kitikonti/ownchart/commit/be72540f725a31e3863cf5e804cf923fe298a106))
* remove unsafe as-cast in getDensityDefault ([cd69b6b](https://github.com/kitikonti/ownchart/commit/cd69b6bdd44dafb34f2ed07aa05839e978391438))
* remove unused refs and redundant callback wrapper in ChartCanvas ([bc4584a](https://github.com/kitikonti/ownchart/commit/bc4584ae88fc10bd7f96d534dad71614cef9d454))
* reorder declarations in command.types.ts for readability ([b27d09c](https://github.com/kitikonti/ownchart/commit/b27d09c6718e8156c924bc4d57d9189644fc57b6))
* review ChartCanvas — shared constants, SelectionRows extraction, opacity tokens ([7d11211](https://github.com/kitikonti/ownchart/commit/7d112111e3dec405213582e705cd3ab866ddd2b9))
* review Core Types & Config — extract validateDuration, improve docs ([c34df96](https://github.com/kitikonti/ownchart/commit/c34df969a2e4b3142fe47afa94267ac466df1c7b))
* review Core Types & Config batch 2 — ColumnId type, remove dead code ([6cf13c8](https://github.com/kitikonti/ownchart/commit/6cf13c8e2a2a06e216f16d6a2a45b6ac455ef15c))
* review Core Types & Config batch 3 — deduplicate design tokens, remove dead code ([775828b](https://github.com/kitikonti/ownchart/commit/775828bad7132b7782facb0e776fddb6f92501a5))
* review DependencyArrow, DependencyDragPreview, SelectionHighlight, TodayMarker — a11y fixes, shared ARROWHEAD_SIZE, hardcoded values→constants, +5 tests ([25503a4](https://github.com/kitikonti/ownchart/commit/25503a4dd501bb0b6a2c9b717819bc9be51026e6))
* review DependencyArrow, DependencyDragPreview, SelectionHighlight, TodayMarker, index — magic numbers→constants, DependencyArrows barrel export, +43 tests ([ca24638](https://github.com/kitikonti/ownchart/commit/ca24638af78775fabf3572d2fc39dc7fc693f131))
* review dependencySlice — remove dead code and add missing tests ([e1d9ff8](https://github.com/kitikonti/ownchart/commit/e1d9ff8ba14b627dc13f83d821720ac95f237ff9))
* review GridLines — gridHeight DRY, daily-branch parse fix, +21 tests ([e7604e6](https://github.com/kitikonti/ownchart/commit/e7604e672ab5f6a383e446a71f7a6e8f7595088c))
* review GridLines — shared constants, DRY endDate, opacity tokens ([059549f](https://github.com/kitikonti/ownchart/commit/059549f801f01aa98057a2375b1408b49bd16ee1))
* review TaskBar — DRY fillOpacity, diamondPath helper, preview constants, +1 test ([60a09c7](https://github.com/kitikonti/ownchart/commit/60a09c7264f9ec655913b584c37847ba28367621))
* review TaskBar — extract constants, shared interface, deduplicate labels ([e4d6adf](https://github.com/kitikonti/ownchart/commit/e4d6adf4322fadecbb9887e910ed6cbde57d971e))
* review TaskBar — extract progress handle strokeWidth constant ([bb9d11a](https://github.com/kitikonti/ownchart/commit/bb9d11a0c99c83ff9e4881f4f33d01ab3766b1da))
* review TaskBar — opacity constants, TYPOGRAPHY token, +27 tests ([daaead7](https://github.com/kitikonti/ownchart/commit/daaead7ca0527a17089975b05d03fb9f4e024dba))
* review TaskBar — shared bracket constants, hitzone offset, return type ([bc85f0c](https://github.com/kitikonti/ownchart/commit/bc85f0c6eb067163f9ce3846b0bb3dc44ce57a09))
* review TimelineHeader, ConnectionHandles, DependencyArrows — magic numbers→constants, dead code removed, non-null assertions→guards, +47 tests ([fce29c1](https://github.com/kitikonti/ownchart/commit/fce29c197ba9841a2c0353fc1a0a6f265491f775))
* review uiSlice — move side effects out of Immer and add missing tests ([e0e7302](https://github.com/kitikonti/ownchart/commit/e0e7302655110af459754aedcf228f867fbc37c6))
* review userPreferencesSlice — fix unsafe JSON.parse, remove dead code, move side effects ([19d4cbb](https://github.com/kitikonti/ownchart/commit/19d4cbb62a1e0dc451be54deda24758e21934041))
* sort GanttChart barrel exports alphabetically ([2cb5631](https://github.com/kitikonti/ownchart/commit/2cb5631af20c8407f6dc48dc2b09e64a369400cf))
* type-safe validation sets in userPreferencesSlice, remove redundant comments ([6899764](https://github.com/kitikonti/ownchart/commit/68997641ce0d0cbc32ef0e1b13b836b5d14472cf))
* use design token for default task color in validation ([f11c776](https://github.com/kitikonti/ownchart/commit/f11c77676de72640307cb66f6710e62986dbe005)), closes [#0F6](https://github.com/kitikonti/ownchart/issues/0F6)

### [0.0.43](https://github.com/kitikonti/ownchart/compare/v0.0.42...v0.0.43) (2026-02-20)


### Code Refactoring

* fix all review findings for chartSlice.ts ([2fd75be](https://github.com/kitikonti/ownchart/commit/2fd75bef98d36849d431dff9fa922f3a3c5ffd64))
* fix final review findings for chartSlice.ts ([6d9cc48](https://github.com/kitikonti/ownchart/commit/6d9cc4841a08beeb3a900b7d78bb52e4c4cfcab3))
* fix remaining review findings for chartSlice.ts ([57adc9d](https://github.com/kitikonti/ownchart/commit/57adc9d5d878cb1c77c8640adcd890f222dbcf1f))

### [0.0.42](https://github.com/kitikonti/ownchart/compare/v0.0.41...v0.0.42) (2026-02-20)


### Bug Fixes

* update jspdf and lodash to resolve security vulnerabilities ([4b01c8f](https://github.com/kitikonti/ownchart/commit/4b01c8f3ff047f6da5bd28aa2d026a7cd01a8437))

### [0.0.41](https://github.com/kitikonti/ownchart/compare/v0.0.40...v0.0.41) (2026-02-20)


### Bug Fixes

* clean up dependencies on deleteTask undo/redo ([8bda139](https://github.com/kitikonti/ownchart/commit/8bda139169371985ed4a8dc8b9c3dfd2fb4d0979))
* clone deletedTasks in undoDeleteTask to prevent frozen-object mutation ([3efdb22](https://github.com/kitikonti/ownchart/commit/3efdb22e146cad2c0b76d7672e4e8b7b04a4882d))
* clone filtered tasks in redoDeleteTask to prevent frozen-object mutation ([4d1a917](https://github.com/kitikonti/ownchart/commit/4d1a9173557a89fcfe9953a9c715e2f624c15047))
* remove broken command from undo stack on failure, scope parent collection in undoReorderTasks ([49c9631](https://github.com/kitikonti/ownchart/commit/49c96316ff17635c12e099582b51dddc1ae27873))
* skip mobile E2E tests on Firefox (isMobile not supported) ([b392959](https://github.com/kitikonti/ownchart/commit/b3929596f655b4aacce1603300e18b4bb385ee5c))
* use fresh dependency state in redoPasteRows to prevent stale data ([7d1f172](https://github.com/kitikonti/ownchart/commit/7d1f172a0c27b355190e581b84c1b0821c784183))


### Code Refactoring

* extract shared executeStackAction helper for undo/redo ([692d642](https://github.com/kitikonti/ownchart/commit/692d642f037aee98af25f75430e420a2902427ee))
* fix all code review findings for historySlice ([a3c42a5](https://github.com/kitikonti/ownchart/commit/a3c42a5fefff34c2faf423af4d9211b58df90c44))
* fix code review findings for historySlice ([876488f](https://github.com/kitikonti/ownchart/commit/876488f47099342867c2c299d13c72e6fec2ef51))
* fix code review findings for historySlice ([f4581ae](https://github.com/kitikonti/ownchart/commit/f4581ae8bde37abef69a6cfb09530096e0442534))
* merge identical undoHide handlers, remove non-null assertion ([b5e79f6](https://github.com/kitikonti/ownchart/commit/b5e79f63d9f583cdb5fea083d2c0502ac311424c))
* replace Command interface with discriminated union, eliminating 35 as-casts ([e69085a](https://github.com/kitikonti/ownchart/commit/e69085a16355c3ef2334f7db0d4042cf122ebb8b))
* review fixes for historySlice — bug fix, handler extraction, code quality ([75e971d](https://github.com/kitikonti/ownchart/commit/75e971d42d930a897b705458736c8d91b08d71a8))

### [0.0.40](https://github.com/kitikonti/ownchart/compare/v0.0.39...v0.0.40) (2026-02-19)


### Features

* add comprehensive in-app help documentation ([#21](https://github.com/kitikonti/ownchart/issues/21)) ([5e5816b](https://github.com/kitikonti/ownchart/commit/5e5816b60e006ca4e931e82648d54606ef4bbaff))
* add context menu with Paste action to placeholder row (Issue [#53](https://github.com/kitikonti/ownchart/issues/53)) ([e831b04](https://github.com/kitikonti/ownchart/commit/e831b04bcc161fed9302256b74905d722a866871))
* add mobile device block screen ([d08d659](https://github.com/kitikonti/ownchart/commit/d08d659f031b887d25916f88e2c130da354face7)), closes [#27](https://github.com/kitikonti/ownchart/issues/27)
* unify context menus across TaskTable and Timeline zones ([934af93](https://github.com/kitikonti/ownchart/commit/934af93810fad525e978b4722359b8f4a21bb488))


### Bug Fixes

* address review findings from context menu unification ([28649bd](https://github.com/kitikonti/ownchart/commit/28649bdd304ffb3121a1100c26ea25817b6eff16))
* address review findings from help documentation ([#21](https://github.com/kitikonti/ownchart/issues/21)) ([f690627](https://github.com/kitikonti/ownchart/commit/f690627434737b4c4b4f4ca8ecd6533a56dd41e2))
* address review findings from indent/outdent undo ([b3d66ca](https://github.com/kitikonti/ownchart/commit/b3d66ca2976529b0c66cee04b30972c9b2bfb0ed))
* correct depth checks and delete cascade undo ([d1752fc](https://github.com/kitikonti/ownchart/commit/d1752fcaedef1550bd641d3a5febf4f873341ad0))
* early-return in canIndentSelection before expensive descendant check ([98d9a72](https://github.com/kitikonti/ownchart/commit/98d9a726539f7a27523678ab85a0d3804a0bc08e))
* improve a11y on mobile block screen dismiss button ([40f4c7b](https://github.com/kitikonti/ownchart/commit/40f4c7b60e97d0c99d7a7008ac781752189442cd))
* indent validation now checks descendant depth, not just task level ([9aee544](https://github.com/kitikonti/ownchart/commit/9aee5445d27aede340895e9ce81a454dfa7a5307))
* restore original task position on indent/outdent undo ([b9403a3](https://github.com/kitikonti/ownchart/commit/b9403a3d100f3f73f32bd9b7db79f368a5157e83))


### Code Refactoring

* add grid, handle, row number, and toast design tokens ([edfd5eb](https://github.com/kitikonti/ownchart/commit/edfd5eb02967dc21f99fb1341e7ecfb9c4f3443f))
* clean up taskSlice code quality issues ([710ab35](https://github.com/kitikonti/ownchart/commit/710ab3544211fb4fb59dab8aa7a51225bd0cb9ed))
* consolidate insert methods into insertTasksRelative helper ([b80f7da](https://github.com/kitikonti/ownchart/commit/b80f7daac7eb5877678bf256979de6f3699ebf3b))
* extract grouping and insertion actions from taskSlice ([72214cf](https://github.com/kitikonti/ownchart/commit/72214cf720ed75faa35fc99a7bb2c299e3eb5924))
* extract indent/outdent actions from taskSlice ([b2106e9](https://github.com/kitikonti/ownchart/commit/b2106e9c9608ac07558d5085c95244edb1eb1eff))
* extract magic numbers and hardcoded strings to constants ([8864405](https://github.com/kitikonti/ownchart/commit/88644054c05ef15a558b840bcffa7705adc1c059))
* extract PLACEHOLDER_TASK_ID to shared config, fix test isolation ([42e7eeb](https://github.com/kitikonti/ownchart/commit/42e7eeb066c907d5d3c0919f3a2169d8e3310a59))
* extract recordCommand helper to reduce undo boilerplate ([b0bc058](https://github.com/kitikonti/ownchart/commit/b0bc05835708a16fa141642948be5b87f26e3763))
* extract selection, expansion, and column actions from taskSlice ([e9fbad3](https://github.com/kitikonti/ownchart/commit/e9fbad305ae6b8dbfb0b5d9c5dc48c272701f518))
* extract shared helpers and constants to taskSliceHelpers.ts ([c750796](https://github.com/kitikonti/ownchart/commit/c7507968f2618957d7af00194e45b4b9860ea0ab))
* extract shared helpers and reduce duplication ([ce18b27](https://github.com/kitikonti/ownchart/commit/ce18b27344c3f2342be3914e1607e338f5eb0240))
* extract type-change logic and harden previousValues capture in updateTask ([3f74fe9](https://github.com/kitikonti/ownchart/commit/3f74fe9fb0cbd2a72ba69d5679f8a7c539106abb))
* fourth-pass review fixes for taskSlice ([8a464ee](https://github.com/kitikonti/ownchart/commit/8a464ee87fe0dcf275c98ad906d8cfd1d152445c))
* remove toast.error from reorderTasks in taskSlice ([a558945](https://github.com/kitikonti/ownchart/commit/a5589451b0ce3843748cfad8a6eb4fab8e5b19de))
* remove unused command types and dead undo/redo handlers ([2d20246](https://github.com/kitikonti/ownchart/commit/2d202464fdc976864610ee93a91b5e5f363c6158))
* remove unused get parameter from action creators and format ([570aaca](https://github.com/kitikonti/ownchart/commit/570aaca25334fc740df3273c13943efdb946ead9))
* replace any casts with proper param types in historySlice ([7298aa5](https://github.com/kitikonti/ownchart/commit/7298aa504dd7f255a97936f7d29190fe861cb78a))
* replace hardcoded hex colors with design tokens in 11 component files ([bc7ae1c](https://github.com/kitikonti/ownchart/commit/bc7ae1c8108aefe5c57c826cbb56778af2b3319a))
* review fixes for extracted taskSlice action modules ([4bdf04c](https://github.com/kitikonti/ownchart/commit/4bdf04c5a02c1f17020bf5b2c959e74b41b3cc0f))
* structuredClone, remove console, merge set calls ([b912649](https://github.com/kitikonti/ownchart/commit/b912649ab8084ee601acebd726d76cebb70deafa))
* third-pass review fixes for taskSlice ([210bf51](https://github.com/kitikonti/ownchart/commit/210bf5140452e3d6ef33cc11b4cb21482b322d90))
* use lightweight hierarchy snapshot for reorderTasks undo ([6c36bce](https://github.com/kitikonti/ownchart/commit/6c36bcea2d582c17aa7f00ab3f36cfabacd61baf))

### [0.0.39](https://github.com/kitikonti/ownchart/compare/v0.0.38...v0.0.39) (2026-02-17)


### Features

* add About dialog with open-source attribution and sponsor link ([8b27fd3](https://github.com/kitikonti/ownchart/commit/8b27fd3fd8c7f4f240bc1b41fccf394956d93a57))
* add timeline header date range selection with zoom-to-selection ([#54](https://github.com/kitikonti/ownchart/issues/54)) ([5682113](https://github.com/kitikonti/ownchart/commit/56821134975f4d2f318377e8943e932d5e2d2a12))


### Bug Fixes

* address review findings from About dialog feature ([25fcaea](https://github.com/kitikonti/ownchart/commit/25fcaeab529e0043378ae5faae55b1feacde6318)), closes [#0F6](https://github.com/kitikonti/ownchart/issues/0F6)
* address review findings from header date selection ([#54](https://github.com/kitikonti/ownchart/issues/54)) ([c242de8](https://github.com/kitikonti/ownchart/commit/c242de893abb0ab7ab38767c72bab1f5f1de1e89))
* synchronize app version from package.json at build time ([882ff82](https://github.com/kitikonti/ownchart/commit/882ff82189b0955f7ecc1fbb1e45f67d9cd01d8a))

### [0.0.38](https://github.com/kitikonti/ownchart/compare/v0.0.37...v0.0.38) (2026-02-17)


### Features

* add ungroup (dissolve summary) with Ctrl+Shift+G ([3acf50a](https://github.com/kitikonti/ownchart/commit/3acf50a6b082681f6dfdd411e79249a1af6f52f7))


### Bug Fixes

* address review findings from header context menu refactor ([2033b96](https://github.com/kitikonti/ownchart/commit/2033b96989972a39bd3ddb4149c683e7a4db4c35))
* address review findings from ungroup feature ([0761a84](https://github.com/kitikonti/ownchart/commit/0761a8468540a66b75b825c7fe63395362be9bf6))


### Code Refactoring

* replace Columns dropdown with Explorer-style header context menu ([db8d108](https://github.com/kitikonti/ownchart/commit/db8d108f78a0008af181d753f1b2db92c771699f))

### [0.0.37](https://github.com/kitikonti/ownchart/compare/v0.0.36...v0.0.37) (2026-02-17)


### Features

* expand context menu to 4 zones — table row, header, timeline bar, empty area (Issue [#48](https://github.com/kitikonti/ownchart/issues/48)) ([839911a](https://github.com/kitikonti/ownchart/commit/839911ac9237da4f95165870ef01c9947ad49a2a))


### Code Refactoring

* DRY context menu hooks — extract shared builders, tokenize constants, test with renderHook ([6ead121](https://github.com/kitikonti/ownchart/commit/6ead1217dd584ebe83378c3738fd5047546ae4d1))
* tokenize remaining hardcoded colors and stabilize context menu callbacks ([ac3d5c9](https://github.com/kitikonti/ownchart/commit/ac3d5c94a1a55bbe2cf7f9ec1a47073e6dd37977)), closes [#334155](https://github.com/kitikonti/ownchart/issues/334155)

### [0.0.36](https://github.com/kitikonti/ownchart/compare/v0.0.35...v0.0.36) (2026-02-16)


### Features

* add /review skill for comprehensive code reviews (Issue [#44](https://github.com/kitikonti/ownchart/issues/44)) ([6fb3e88](https://github.com/kitikonti/ownchart/commit/6fb3e88a2c56312d37f14b0a53cf6fe97cd0558c))
* add group selected tasks (Ctrl+G) ([a29fc5e](https://github.com/kitikonti/ownchart/commit/a29fc5e22ecd40d6d2fc5ea252e1719ac7300fe9))
* add hide/show rows in task table (Issue [#47](https://github.com/kitikonti/ownchart/issues/47)) ([225ef65](https://github.com/kitikonti/ownchart/commit/225ef65b00f383754b0080421541d004e2ab630b))


### Bug Fixes

* mark file dirty on undo/redo for data-modifying operations ([04a2c0a](https://github.com/kitikonti/ownchart/commit/04a2c0aba5953c88d3714aa80a8a5cddd1761897))
* resolve stale closure, test casts, and UI issues in hide/show feature ([3a6f7a5](https://github.com/kitikonti/ownchart/commit/3a6f7a534df0275092ff900581aeea04bec07227))
* update jspdf to 4.1.0 to resolve high-severity security vulnerabilities ([3aca2e1](https://github.com/kitikonti/ownchart/commit/3aca2e126f838064d680f296cca2e096be130951))


### UI/UX

* restyle context menu to MS 365 style and unify unhide behavior ([85f6057](https://github.com/kitikonti/ownchart/commit/85f60571a06a8459574693be5fa8801066c89a51))


### Code Refactoring

* extract components and fix review findings from hide/show feature ([3dee573](https://github.com/kitikonti/ownchart/commit/3dee573de0ee5d271d35886807281defa345b4f5)), closes [#0F6](https://github.com/kitikonti/ownchart/issues/0F6)
* extract components and improve code organization ([c4bfc80](https://github.com/kitikonti/ownchart/commit/c4bfc805511c76f29a6e6cd5d565c03b03c39a73)), closes [#0F6](https://github.com/kitikonti/ownchart/issues/0F6)
* extract MAX_HIERARCHY_DEPTH constant to shared hierarchy module ([f27b421](https://github.com/kitikonti/ownchart/commit/f27b421babf68b33c48f85e2f6d03dd9d24c0673))
* replace HiddenRowsIndicator with Excel-style double-line on RowNumberCell ([be7db2b](https://github.com/kitikonti/ownchart/commit/be7db2bb8f98fdcec3248a0d1e578719cc86e6ae)), closes [#a3a3a3](https://github.com/kitikonti/ownchart/issues/a3a3a3)
* review fixes — extract helper, tokenize CSS colors, add tests ([d3d33da](https://github.com/kitikonti/ownchart/commit/d3d33da64fa382af139a3c9c151d018d1a68ffcc))

### [0.0.35](https://github.com/kitikonti/ownchart/compare/v0.0.33...v0.0.35) (2026-02-14)


### Features

* add "Apply Colors to Manual" button in color dropdown ([2fb5d8d](https://github.com/kitikonti/ownchart/commit/2fb5d8db568f4265dc4a87683ed230cf0af09a0d))
* add Alt+Shift+Right/Left indent/outdent shortcuts and remove Tab indent ([#2](https://github.com/kitikonti/ownchart/issues/2)) ([6a1c667](https://github.com/kitikonti/ownchart/commit/6a1c66795713c42dbf0efcfe61e709ef245aa43d))
* add column visibility toggle and task table snap-to-collapse ([#37](https://github.com/kitikonti/ownchart/issues/37)) ([4b78391](https://github.com/kitikonti/ownchart/commit/4b783912f19ae91f1124b156f17f6ab0c2316cbb))
* add draggable progress handle on task bars ([#24](https://github.com/kitikonti/ownchart/issues/24)) ([7ab154e](https://github.com/kitikonti/ownchart/commit/7ab154e2631554f3da80918040f06e584ce87f4c))
* add Excel-style Ctrl++/Ctrl+- row insert and delete shortcuts ([#36](https://github.com/kitikonti/ownchart/issues/36)) ([173a01f](https://github.com/kitikonti/ownchart/commit/173a01f56387d929ab45313008dae15f11fb2160))
* add file icons and LaunchQueue support for PWA file handling ([d9f04a7](https://github.com/kitikonti/ownchart/commit/d9f04a783a88b8be582c0d680ac2a73a94bd0063))
* add Format tab and reorganize View tab in ribbon toolbar ([5e281eb](https://github.com/kitikonti/ownchart/commit/5e281ebaef69edc12169f2f0e64f90b6f683d05c))
* add progress column toggle to Columns dropdown ([c65f345](https://github.com/kitikonti/ownchart/commit/c65f345eadd134e22c183523b5517a827f24c3a6))
* add Smart Labels responsive collapse to ribbon toolbar ([02412c0](https://github.com/kitikonti/ownchart/commit/02412c0b536869238daef7e876d4ea18ff648dda))
* consolidate color dropdowns and improve theme coloring algorithm ([4cb40e9](https://github.com/kitikonti/ownchart/commit/4cb40e93f83b45de7e9c058abcbf3eef306eed36))
* integrate custom OwnChart logo and PWA infrastructure ([6ccd913](https://github.com/kitikonti/ownchart/commit/6ccd913e175c253ddd48dac22421c689ccb4ea2d))
* replace 12 monochrome palettes with 27 multi-hue palettes ([bbebd5b](https://github.com/kitikonti/ownchart/commit/bbebd5bef44f4e00a98090f9597763c9d14ac844))


### Bug Fixes

* 0% progress task no longer looks identical to 100% ([891bbb4](https://github.com/kitikonti/ownchart/commit/891bbb4d8b230724e634c318c373a10e08591b96))
* add vite-plugin-svgr for proper SVG React component imports ([58a37d7](https://github.com/kitikonti/ownchart/commit/58a37d712a7ab08bd97a4851104cf1a2be362d9a))
* align PDF export header/footer with preview and app color scheme ([#39](https://github.com/kitikonti/ownchart/issues/39)) ([2f389fa](https://github.com/kitikonti/ownchart/commit/2f389fadeb8a9a491fdcb31175beeb6ef2f33d31)), closes [#475569](https://github.com/kitikonti/ownchart/issues/475569) [#e2e8f0](https://github.com/kitikonti/ownchart/issues/e2e8f0)
* cell navigation and range selection use visual order instead of raw array index ([70efc71](https://github.com/kitikonti/ownchart/commit/70efc7104622fc6ddff8e8d82aad2eaf46cdc6d6))
* color column in PDF/PNG/SVG exports now respects color themes ([650eb37](https://github.com/kitikonti/ownchart/commit/650eb3707e93ad85217fcbf21394d13fcf29e779)), closes [#42](https://github.com/kitikonti/ownchart/issues/42)
* drag-and-drop row reordering no longer corrupts task hierarchy ([316f9e3](https://github.com/kitikonti/ownchart/commit/316f9e3e40a04d7ea297c578e77fa7b823ca3ecf))
* ensure true transparency in favicon.ico ([3ba93d7](https://github.com/kitikonti/ownchart/commit/3ba93d7bfe1d9d8f249c3ddc467e0b2e087c5c3a))
* F2 shortcut conflict resolved, Escape deactivates active cell ([5546b84](https://github.com/kitikonti/ownchart/commit/5546b84bd9d926842a8d9043912c277e93a375ee))
* flip color picker popover upward when near bottom of viewport ([c06720a](https://github.com/kitikonti/ownchart/commit/c06720a975ca8dd595f58cf80415863ed372397d))
* force RGBA format for PNGs to ensure transparent background ([d56fc20](https://github.com/kitikonti/ownchart/commit/d56fc206c20768816732aec00497bdd8e1a0730b))
* hide progress drag triangles in export output ([cf7cbc9](https://github.com/kitikonti/ownchart/commit/cf7cbc94726fe7247552a1fc102998b25929e0cf))
* improve logo quality and transparency ([d9d8805](https://github.com/kitikonti/ownchart/commit/d9d880599a0e035f40a1de173b72067a87b56624))
* improve progress bar visibility on task bars ([#38](https://github.com/kitikonti/ownchart/issues/38)) ([90c29ab](https://github.com/kitikonti/ownchart/commit/90c29ab641015c43cb94e03870fb03b6c7d3175a))
* make Ctrl+- delete active cell task when no row selected ([#36](https://github.com/kitikonti/ownchart/issues/36)) ([86e1ff8](https://github.com/kitikonti/ownchart/commit/86e1ff832833a875478da048ad02a6e8a5218c26))
* PDF export preview now matches actual export in Fit to Page mode ([741af08](https://github.com/kitikonti/ownchart/commit/741af086ed8382e8b7034f5d0b408092865ea42b)), closes [#39](https://github.com/kitikonti/ownchart/issues/39)
* prevent horizontal scroll when cell enters edit mode ([9578291](https://github.com/kitikonti/ownchart/commit/9578291c1ce272c8713d7fc2fe525dcae9d0e088))
* remove double scrollbar in color dropdown theme view ([18c3987](https://github.com/kitikonti/ownchart/commit/18c398721d4b20b8b667af24de408b2b0f51c24c))
* replace browser-default focus outlines with consistent focus-visible styles ([c480c81](https://github.com/kitikonti/ownchart/commit/c480c81f6d7a4e43b3e48018bcc06ccc29236466))
* shift+click range selection in row number cells ([#29](https://github.com/kitikonti/ownchart/issues/29)) ([e947807](https://github.com/kitikonti/ownchart/commit/e947807613b889986d61d19097d643caed80663c))
* summary color mode writes directly to task.color for summary tasks ([1000035](https://github.com/kitikonti/ownchart/commit/1000035340aac064f5815bfa64ffa3d670acda04))
* Tab navigation from color cell follows visual column order ([2a994de](https://github.com/kitikonti/ownchart/commit/2a994ded38634de1ebae79669c91ee67323cf20b))
* toolbar 'Add Task' button now creates tasks with 7 calendar days (not 8) ([4a256e0](https://github.com/kitikonti/ownchart/commit/4a256e061c8bc5d283e082fefedcb59c3528ddce))
* use consistent default task color ([#0](https://github.com/kitikonti/ownchart/issues/0)F6CBD) across all task creation methods ([5e7c31d](https://github.com/kitikonti/ownchart/commit/5e7c31deb2e9cdfdb750daf5ec49a07c01e94b47)), closes [#0F6](https://github.com/kitikonti/ownchart/issues/0F6) [#17](https://github.com/kitikonti/ownchart/issues/17) [#0F6](https://github.com/kitikonti/ownchart/issues/0F6) [#FAA916](https://github.com/kitikonti/ownchart/issues/FAA916)
* use explicit color in favicon.svg instead of currentColor ([9ffce8e](https://github.com/kitikonti/ownchart/commit/9ffce8e413510402fa2581eb0ef598dd3ddbe0cf)), closes [#0f6](https://github.com/kitikonti/ownchart/issues/0f6)


### Performance Improvements

* optimize bundle splitting and remove unused d3 dependency ([9d9f2ac](https://github.com/kitikonti/ownchart/commit/9d9f2ac1f32e70a4dcac69a3b4567b9a5b4bd66d))
* optimize logo for pixel-perfect rendering at small sizes ([8de6291](https://github.com/kitikonti/ownchart/commit/8de6291324f53644c226708bc878be097f31177f))


### Code Refactoring

* unify dropdown styling with shared components and consolidate settings into ribbon ([a83ec9c](https://github.com/kitikonti/ownchart/commit/a83ec9cbbf5b82942f4a857392f2e1ab133f4f01))
* use DropdownItem in ZoomDropdown/ColorOptionsDropdown and match MS Project selected styling ([88ab7fd](https://github.com/kitikonti/ownchart/commit/88ab7fdb089476ad544446069970a3b6eb3b4922))


### UI/UX

* align hover styling with MS Office (neutral-50 bg, sub-pixel border, darker text) ([3f18718](https://github.com/kitikonti/ownchart/commit/3f18718ef7a2b76ea5ff3068a3cdbb95873e1045)), closes [#f5f5f5](https://github.com/kitikonti/ownchart/issues/f5f5f5) [#303030](https://github.com/kitikonti/ownchart/issues/303030)
* refine primary button styling to match Outlook design ([f1732ff](https://github.com/kitikonti/ownchart/commit/f1732ff600529e18c119fe59194adc54045ef073))
* remove custom monochrome option from color dropdown ([bc16fab](https://github.com/kitikonti/ownchart/commit/bc16fab457b06873f7c01a062e841e9bd2e0fe78))
* update favicon and app icons ([5838633](https://github.com/kitikonti/ownchart/commit/5838633e5a74f7564e13a094b097220ccb4a3f8b))

### [0.0.33](https://github.com/kitikonti/ownchart/compare/v0.0.32...v0.0.33) (2026-01-30)


### Features

* add "F" keyboard shortcut for fit to view ([84b000b](https://github.com/kitikonti/ownchart/commit/84b000bb0c4ca7e73efaf0f47e80c100a738dfe2)), closes [#7](https://github.com/kitikonti/ownchart/issues/7)


### Bug Fixes

* add undo/redo support for indent/outdent operations ([bdba8d4](https://github.com/kitikonti/ownchart/commit/bdba8d4af4a85c4c4490b3f9d2f4017a640aaf78)), closes [#1](https://github.com/kitikonti/ownchart/issues/1)
* persist colorModeState to .ownchart files ([#13](https://github.com/kitikonti/ownchart/issues/13)) ([094822f](https://github.com/kitikonti/ownchart/commit/094822fb14774ab5b9dc8092cd8666062781bb00))
* preserve dates during task type switching ([e968070](https://github.com/kitikonti/ownchart/commit/e968070302ac78083b39bc87f600fba17fb791c6)), closes [#8](https://github.com/kitikonti/ownchart/issues/8) [#9](https://github.com/kitikonti/ownchart/issues/9) [#8](https://github.com/kitikonti/ownchart/issues/8) [#9](https://github.com/kitikonti/ownchart/issues/9)
* prevent ghost preview and fading on selected tasks when dragging unselected task ([962e33d](https://github.com/kitikonti/ownchart/commit/962e33d119aa09a41b2f05b359a46df76a09780d))
* prevent summary/milestone resize and sync milestone endDate on drag ([a34a0fb](https://github.com/kitikonti/ownchart/commit/a34a0fbdcab230cd67c4a36a5b025b8b2a37fcb8))
* prevent TaskTable/Timeline vertical desync when adding tasks via placeholder ([#16](https://github.com/kitikonti/ownchart/issues/16)) ([8f3df30](https://github.com/kitikonti/ownchart/commit/8f3df30d521a543b08c0fd19338edecd4189a80d))
* recalculate summary dates after deleteSelectedTasks and refactor cascade logic ([71f387e](https://github.com/kitikonti/ownchart/commit/71f387ed9f92aa1698381071ff13a86a92130286))
* recalculate summary dates after insertTaskAbove/Below ([8660b37](https://github.com/kitikonti/ownchart/commit/8660b3748f06b234d17019470bd70f673092faca))
* resolve undo/redo task duplication when deleting multiple tasks ([860669e](https://github.com/kitikonti/ownchart/commit/860669eb8ec1743fe7416458551f1842e2a7e8bb)), closes [#4](https://github.com/kitikonti/ownchart/issues/4)
* scroll timeline to project when opening a second file ([a99eddf](https://github.com/kitikonti/ownchart/commit/a99eddfdf526f0cee9c8ef2ec2b54e3f42de2a91))
* set milestone endDate to startDate instead of empty string ([7ae52d5](https://github.com/kitikonti/ownchart/commit/7ae52d56f18b379184831b1fd9b342ad955b144d))
* skip tasks with invalid dates in export date range calculation ([5e248ba](https://github.com/kitikonti/ownchart/commit/5e248bacb4ba4480671a2a4461d8385c03c02b72)), closes [#11](https://github.com/kitikonti/ownchart/issues/11)
* suppress single-key shortcuts when a table cell is active ([92d2d1b](https://github.com/kitikonti/ownchart/commit/92d2d1b7dfbb263a55b695b8a51c5777035bbd59))
* tree-walk ordering for hierarchy and normalize task order after mutations ([4fa4df1](https://github.com/kitikonti/ownchart/commit/4fa4df1483c30106986b53563d57dbed85b6fd0b))


### UI/UX

* show "Week N, Mon YYYY" in timeline header top row at 30-60+ px/day zoom ([3f75a2d](https://github.com/kitikonti/ownchart/commit/3f75a2d17d69efdb45720e55e5c24420cd3119b0))

### [0.0.32](https://github.com/kitikonti/ownchart/compare/v0.0.31...v0.0.32) (2026-01-25)


### Bug Fixes

* resolve lint errors for CI ([6ad63bf](https://github.com/kitikonti/ownchart/commit/6ad63bf3837e8c611c10b3ba199aecff5243342d))


### UI/UX

* align all dialogs with export dialog design system ([95b7d8b](https://github.com/kitikonti/ownchart/commit/95b7d8b0e5ed965eec8ebbdf8111a2cf9b8f9701))


### Code Refactoring

* extract reusable UI components to reduce code duplication ([9b5f5cb](https://github.com/kitikonti/ownchart/commit/9b5f5cb32f8718ecfbef094373db2db73a4d9842))
* improve component consistency and reduce ESLint suppressions ([9e99b3d](https://github.com/kitikonti/ownchart/commit/9e99b3dbfb81049332dbb4e10025a742065f116d))

### [0.0.31](https://github.com/kitikonti/ownchart/compare/v0.0.30...v0.0.31) (2026-01-15)


### Features

* add Smart Color Management with 5 color modes ([3921849](https://github.com/kitikonti/ownchart/commit/3921849b4e6e0f92ce185ce8c2898e4b2b920a28))

### [0.0.30](https://github.com/kitikonti/ownchart/compare/v0.0.29...v0.0.30) (2026-01-15)


### Bug Fixes

* resolve export preview flash and PDF bold font issues ([6dea551](https://github.com/kitikonti/ownchart/commit/6dea55177cb908a7bd1886aea5cd1c0b460ce8b4))
* unify default task color to brand color ([#0](https://github.com/kitikonti/ownchart/issues/0)F6CBD) ([07fb764](https://github.com/kitikonti/ownchart/commit/07fb764b16c626dba9590f07ca9b7b8ca48015c2)), closes [#0F6](https://github.com/kitikonti/ownchart/issues/0F6) [#FAA916](https://github.com/kitikonti/ownchart/issues/FAA916) [#0F6](https://github.com/kitikonti/ownchart/issues/0F6) [#0d9488](https://github.com/kitikonti/ownchart/issues/0d9488) [#0F6](https://github.com/kitikonti/ownchart/issues/0F6) [#0F6](https://github.com/kitikonti/ownchart/issues/0F6)


### Code Refactoring

* extract reusable components from export dialogs ([dcd53a2](https://github.com/kitikonti/ownchart/commit/dcd53a23f1f506f96b41f1feafb189fe9e0c19ad))

### [0.0.29](https://github.com/kitikonti/ownchart/compare/v0.0.28...v0.0.29) (2026-01-15)


### Bug Fixes

* export preview rendering blank due to invisible container ([883fcd1](https://github.com/kitikonti/ownchart/commit/883fcd1c8ed8c39035617418ef96d14556626d8b))


### UI/UX

* adjust export dialog layout to 55/45 preview/settings ratio ([bc90d0a](https://github.com/kitikonti/ownchart/commit/bc90d0a85c1cdb65529fd1074fbc798141ce5ea0))
* expand export dialog with larger preview, fixed settings width ([553f41a](https://github.com/kitikonti/ownchart/commit/553f41a865bcb7f92c41ec6b631ed124ed8f3892))
* increase export preview panel to 65% width ([7c7c71c](https://github.com/kitikonti/ownchart/commit/7c7c71cf7d4158cc83f02b663a28d61b8ca9e47e))
* widen settings panel to 480px, expand dialog to max-w-7xl ([3652702](https://github.com/kitikonti/ownchart/commit/3652702a6261dfbe94b0fab99567c53bfb9b2245))

### [0.0.28](https://github.com/kitikonti/ownchart/compare/v0.0.27...v0.0.28) (2026-01-15)


### Features

* add dynamic text color contrast for task labels ([d48c089](https://github.com/kitikonti/ownchart/commit/d48c08967a552bcf12256e95bff267a81e6a8d8f)), closes [#1e293](https://github.com/kitikonti/ownchart/issues/1e293)
* redesign export dialog with Figma-style layout and live preview ([4679179](https://github.com/kitikonti/ownchart/commit/4679179b377ee42869a400fa8ba5e61650734c02))


### Bug Fixes

* auto column width respects headers and placeholder text ([77fca04](https://github.com/kitikonti/ownchart/commit/77fca04b45ca39c743473169bdceecd8c974247a))
* remove stray rectangle in placeholder row number cell ([9da123c](https://github.com/kitikonti/ownchart/commit/9da123c7b4dffcd061edfd1c2ac59554b077c3c8))


### UI/UX

* change today marker from red to blue with header highlight ([83d73bc](https://github.com/kitikonti/ownchart/commit/83d73bcf799f57ba5e1e5e38f6546b8f71d5c689)), closes [#fa5252](https://github.com/kitikonti/ownchart/issues/fa5252) [#228be6](https://github.com/kitikonti/ownchart/issues/228be6) [#e7f1](https://github.com/kitikonti/ownchart/issues/e7f1)
* standardize font weights to 400/600 only ([a7f934e](https://github.com/kitikonti/ownchart/commit/a7f934e7fe31d4dfb4c76f80599fbd6a9ee028f4))
* switch to Inter font with embedded PDF support ([721bd09](https://github.com/kitikonti/ownchart/commit/721bd0908278aa38d3d4497fefb19cb7bd3b2a07))

### [0.0.27](https://github.com/kitikonti/ownchart/compare/v0.0.26...v0.0.27) (2026-01-13)


### UI/UX

* simplify View tab dropdown labels ([8c898de](https://github.com/kitikonti/ownchart/commit/8c898de9c4c7ce3390f033e7c024648f13abf95e))

### [0.0.26](https://github.com/kitikonti/ownchart/compare/v0.0.25...v0.0.26) (2026-01-13)


### Features

* add Chart Settings button to Help tab ([53a13ef](https://github.com/kitikonti/ownchart/commit/53a13ef8cb2636cee5841ae502b39c1d039f7b8f))

### [0.0.25](https://github.com/kitikonti/ownchart/compare/v0.0.24...v0.0.25) (2026-01-13)


### Bug Fixes

* repair broken tests after UI refactoring ([1b93d11](https://github.com/kitikonti/ownchart/commit/1b93d1189f084c0b84706a1bca6f40789fb1aa36))
* resolve lint errors for interactive roles ([9cf5ec1](https://github.com/kitikonti/ownchart/commit/9cf5ec1715439f0d463156530f216ece64d0ca6f))
* use div instead of nav for tablist role ([8d7ce4c](https://github.com/kitikonti/ownchart/commit/8d7ce4c68529c1a062fdf12c34ddd34a3b9be1b5))

### [0.0.24](https://github.com/kitikonti/ownchart/compare/v0.0.23...v0.0.24) (2026-01-12)


### Features

* auto-fit column widths on density and content changes ([c47a324](https://github.com/kitikonti/ownchart/commit/c47a324965dfe7db438ebd5277d9cef5135b455f))


### Bug Fixes

* drag select now uses visible task order instead of raw array ([ef2ebaf](https://github.com/kitikonti/ownchart/commit/ef2ebafe4df3a02599176f91b325e6ce4ea3fd4e))


### Code Refactoring

* **ui:** MS Office-style Ribbon UI and cleanup ([2b71984](https://github.com/kitikonti/ownchart/commit/2b7198410a2da83c070b15ab9db59ce7569fa71d)), closes [#008A99](https://github.com/kitikonti/ownchart/issues/008A99)


### UI/UX

* MS Office-style selection and status bar improvements ([00b4ba4](https://github.com/kitikonti/ownchart/commit/00b4ba4a5692ed3e898dd59b80fa0b42b06cd353)), closes [#008A99](https://github.com/kitikonti/ownchart/issues/008A99)
* update View tab icons and add week settings ([1bee106](https://github.com/kitikonti/ownchart/commit/1bee1068cbbe61f69305770d917c902a6ffb118c))

### [0.0.23](https://github.com/kitikonti/ownchart/compare/v0.0.22...v0.0.23) (2026-01-10)


### Features

* **export:** embed Inter-Italic font for proper italic rendering in PDF ([f63c416](https://github.com/kitikonti/ownchart/commit/f63c416e004f6974f49c40d3e017284742a7ea26))
* **export:** implement PDF and SVG export functionality ([783f938](https://github.com/kitikonti/ownchart/commit/783f93891303d82dceadb2126cb19f971073dbcd))
* **export:** rewrite PDF export with svg2pdf.js for visual consistency ([24b04b0](https://github.com/kitikonti/ownchart/commit/24b04b0488084efac0b22f0b7edcd9702b2e497b))
* **export:** rewrite SVG export with native SVG elements ([099db17](https://github.com/kitikonti/ownchart/commit/099db17cc0b56cbe4503df9dca0fcecf76118a48))


### Bug Fixes

* **export:** ensure all exports match app text formatting and layout ([6ee229f](https://github.com/kitikonti/ownchart/commit/6ee229fe6d5d925fa1bca720c7b5f47af4f6dc41))
* **export:** fix lint errors and format PDF/SVG export code ([487974b](https://github.com/kitikonti/ownchart/commit/487974b2c1af97fffb970c781d563ec9c061954b))
* persist all chart settings in localStorage and restore on file open ([87873fd](https://github.com/kitikonti/ownchart/commit/87873fd94301feb12753b04d44895c7c7e4c5d13))


### UI/UX

* **export:** apply teal accent color consistently to all active elements ([828176e](https://github.com/kitikonti/ownchart/commit/828176e978b2330135374f5a3d40a8b4515937a4))
* **export:** improve visual hierarchy with section dividers ([846bf2e](https://github.com/kitikonti/ownchart/commit/846bf2e50b34f50d3b5d36340c0b88d199e70ac9))
* **export:** simplify export dialog design ([73b5059](https://github.com/kitikonti/ownchart/commit/73b5059e5583cf47b2482909ef50b0e458fd46e9))
* **export:** unify export dialog design with teal accent and shared settings ([a190899](https://github.com/kitikonti/ownchart/commit/a19089992fc38a0d381199effcf313a13ad3c053))
* **export:** use teal-tinted grays on colored backgrounds ([1bf04ea](https://github.com/kitikonti/ownchart/commit/1bf04ea6ebd7d3cb1824c3cf0caa09a369e7daf2))


### Code Refactoring

* **export:** extract shared code from PDF/SVG export modules ([531d058](https://github.com/kitikonti/ownchart/commit/531d058095244099a4ba40ebae19bbff9a3231e9))
* **export:** unify DPI calculations across PNG and PDF exports ([468eb5c](https://github.com/kitikonti/ownchart/commit/468eb5c5d5a5db7bf9a6ba2faeb31224346bf7da))

### [0.0.22](https://github.com/kitikonti/ownchart/compare/v0.0.21...v0.0.22) (2026-01-08)


### Features

* **labels:** add milestone labels and fix label clipping in fit-to-view ([67c7a0d](https://github.com/kitikonti/ownchart/commit/67c7a0d197f70ec1ea3c0aadb4d5f6ee7fe91b78))


### Bug Fixes

* **dependencies:** prevent automatic task movement when creating dependencies ([17d3033](https://github.com/kitikonti/ownchart/commit/17d303344d3a35049f4b5629d18f58b3ce28cc1d))

### [0.0.21](https://github.com/kitikonti/ownchart/compare/v0.0.20...v0.0.21) (2026-01-08)


### Features

* **export:** include project name in PNG export filename ([cbafb8f](https://github.com/kitikonti/ownchart/commit/cbafb8fe3c999c6501f722f5d73bcbce34525b03))


### Bug Fixes

* **file:** restore column widths when opening files ([0d018d6](https://github.com/kitikonti/ownchart/commit/0d018d6292d5b48eb8fccf3a5d9de60d275a9bcb))

### [0.0.20](https://github.com/kitikonti/ownchart/compare/v0.0.19...v0.0.20) (2026-01-08)


### Features

* **zoom:** implement exponential zoom for consistent feel at all levels ([c17a98c](https://github.com/kitikonti/ownchart/commit/c17a98ce5b92aa14adf5f886adce2d5777423abe))

### [0.0.19](https://github.com/kitikonti/ownchart/compare/v0.0.18...v0.0.19) (2026-01-08)


### Features

* **export:** add advanced timeline scale options to PNG export ([17b2cae](https://github.com/kitikonti/ownchart/commit/17b2caec8609250b66c4bc7c74e4128a0562e413))


### UI/UX

* **export:** polish export dialog with consistent slate palette ([afc01f5](https://github.com/kitikonti/ownchart/commit/afc01f5216195158d913e7730bdab4ef1a78bf35))

### [0.0.18](https://github.com/kitikonti/ownchart/compare/v0.0.17...v0.0.18) (2026-01-08)


### Features

* add infinite scroll to timeline ([02e48a8](https://github.com/kitikonti/ownchart/commit/02e48a8b35f7cbaaae9ae57db67e81f79517cca2))
* implement infinite scroll for timeline ([39ce070](https://github.com/kitikonti/ownchart/commit/39ce070169f106664b1dc80be9fcf4c11dde5727))
* implement zoom anchoring for stable scroll position ([ac7a32f](https://github.com/kitikonti/ownchart/commit/ac7a32fdd27dbf8b0b36c408f42eff044babd29d))


### Bug Fixes

* disable false-positive a11y lint error for separator ([f46e9de](https://github.com/kitikonti/ownchart/commit/f46e9dee6122e51fd1bfb425f38e3b9156b0c8dd))
* prevent dependency arrows from animating during scroll ([065f2f6](https://github.com/kitikonti/ownchart/commit/065f2f6e1ec05dbb1d7be605f826b7afb33accb5))
* smooth left-scrolling for infinite timeline ([d3f1e35](https://github.com/kitikonti/ownchart/commit/d3f1e358cee1bf7064e58a927415a4586f258e3f))


### UI/UX

* remove TODAY label from today marker ([b4174cf](https://github.com/kitikonti/ownchart/commit/b4174cfb97fce405c0eb60b43bc2fa0a0dabee04))

### [0.0.17](https://github.com/kitikonti/ownchart/compare/v0.0.16...v0.0.17) (2026-01-06)


### UI/UX

* change default task color to teal and unify brand color ([12c25f0](https://github.com/kitikonti/ownchart/commit/12c25f082d933f4e583c928abdafaa1a4e062b98)), closes [#6366f1](https://github.com/kitikonti/ownchart/issues/6366f1) [#0d9488](https://github.com/kitikonti/ownchart/issues/0d9488) [#6366f1](https://github.com/kitikonti/ownchart/issues/6366f1) [#334155](https://github.com/kitikonti/ownchart/issues/334155)

### [0.0.16](https://github.com/kitikonti/ownchart/compare/v0.0.15...v0.0.16) (2026-01-06)

### [0.0.15](https://github.com/kitikonti/ownchart/compare/v0.0.14...v0.0.15) (2026-01-06)


### UI/UX

* increase checkbox and radio button size to 16px ([4ac2d8a](https://github.com/kitikonti/ownchart/commit/4ac2d8a80c781fe453ed432f6777290870cee405))
* refine design system with improved typography and form controls ([239a2c0](https://github.com/kitikonti/ownchart/commit/239a2c06ab9b22c7828015a8eee70eaaf53303b7))
* replace IBM Plex Sans with Inter font ([411a255](https://github.com/kitikonti/ownchart/commit/411a2554a444d0fcc4789b5d646d8e0f06414b45))

### [0.0.14](https://github.com/kitikonti/ownchart/compare/v0.0.13...v0.0.14) (2026-01-06)


### Features

* configure custom domain ownchart.app ([c742e7a](https://github.com/kitikonti/ownchart/commit/c742e7ad7c919a4a2ded00c63e371921265da8a7))

### [0.0.13](https://github.com/kitikonti/ownchart/compare/v0.0.12...v0.0.13) (2026-01-06)


### Features

* add holidays and task label position to export dialog ([3a85d1d](https://github.com/kitikonti/ownchart/commit/3a85d1d121301d98139c2058df6cf53b84f5a5db))
* auto-open chart settings dialog when creating new file ([73d270d](https://github.com/kitikonti/ownchart/commit/73d270d3ecfb1efebfa69fcab44a82d4ddcd0f7f))
* implement Sprint 1.5.9 User Preferences & Settings ([ab8a932](https://github.com/kitikonti/ownchart/commit/ab8a932da3dfb11509799f6c283ab304cdcbeeeb))
* move holiday region from user preferences to chart settings ([ff4fc03](https://github.com/kitikonti/ownchart/commit/ff4fc03d4ca68a016c41bdad36663b8ae290eb8a))


### Bug Fixes

* resolve Sprint 1.5.9 settings bugs and add week numbering ([e68f7be](https://github.com/kitikonti/ownchart/commit/e68f7bed27d64a0d608d0faa1d934f3470f5c77a))
* wrap default case in braces to fix lint error ([9fb5825](https://github.com/kitikonti/ownchart/commit/9fb5825086089b4ee94441483b39b46cc92d7351))


### UI/UX

* show calendar week in timeline header at lower zoom levels ([92c7296](https://github.com/kitikonti/ownchart/commit/92c7296066594d548fe3d8977b9309a47da58cc0))
* update toolbar and settings dialog icons ([f94c155](https://github.com/kitikonti/ownchart/commit/f94c155dc0eb8848599ddd8027ceab6d1799a12f))


### Code Refactoring

* rename concept/ folder to docs/ ([2a997ec](https://github.com/kitikonti/ownchart/commit/2a997ec04bf954a2d5c690f3a12d3de9a7d3058a))
* restructure AppToolbar with reusable primitives ([d42ce67](https://github.com/kitikonti/ownchart/commit/d42ce67bc838139e57dd98ab84dbfe3aa6fad427))

### [0.0.12](https://github.com/kitikonti/ownchart/compare/v0.0.11...v0.0.12) (2026-01-05)


### Features

* add density selection to export dialog ([6bf77b6](https://github.com/kitikonti/ownchart/commit/6bf77b6b6891e10cb57fd83c9884acb83154b52f))
* add density-aware color bar height ([cf1001d](https://github.com/kitikonti/ownchart/commit/cf1001d42a50ae34f5955fc6b8401f239965e64e))
* add density-aware column widths ([1962c60](https://github.com/kitikonti/ownchart/commit/1962c60ae84c07d069cbae967e911f8a56f5c50f))
* add UI density settings (compact/normal/comfortable) ([8ce1094](https://github.com/kitikonti/ownchart/commit/8ce1094448347691bb6e9709a55ebe41815733e4))


### Bug Fixes

* export now uses comfortable density regardless of user setting ([29a1d70](https://github.com/kitikonti/ownchart/commit/29a1d70207310f21d20154028aee9965e007fb58))
* increase bar font sizes by 1px (13→12→11) ([694ae35](https://github.com/kitikonti/ownchart/commit/694ae351cc2672a345ee7fccfb38091c74dd8143))
* restore original font sizes for comfortable density ([405e01f](https://github.com/kitikonti/ownchart/commit/405e01fcd699f24828cac3881a4712cfeda5d411))
* scale dependency arrow corners for different densities ([2c0e05d](https://github.com/kitikonti/ownchart/commit/2c0e05d1f34cf5ef8a38473a35dc8efd467c7c8c))
* use linear font size progression (16→15→14) ([efe900c](https://github.com/kitikonti/ownchart/commit/efe900ce2a4a84786cfe72ca75ec518398c4393d))

### [0.0.11](https://github.com/kitikonti/ownchart/compare/v0.0.10...v0.0.11) (2026-01-05)


### Features

* auto-fit name column when opening files ([2186809](https://github.com/kitikonti/ownchart/commit/21868093b0aba81e4f014244a1abe61374b3a78d))
* **export:** add grid lines/weekends options and persist settings in project file ([0395acb](https://github.com/kitikonti/ownchart/commit/0395acbae8d93bc16f3737d2e09ca1e46845a8f1))


### Bug Fixes

* persist column widths in multi-tab localStorage ([ec92e22](https://github.com/kitikonti/ownchart/commit/ec92e2218f046a76777ae703bf46c19fcbbcf486))
* persist dependencies in multi-tab localStorage ([94b4f54](https://github.com/kitikonti/ownchart/commit/94b4f546d220a330ea9fa932dadfa35aafd052b9))
* **welcome:** respect "Don't show again" checkbox ([c426186](https://github.com/kitikonti/ownchart/commit/c426186651d6bd7ddc2b7249a39ce845aa9c5bd6))


### Code Refactoring

* change file extension from .gantt to .ownchart ([4480d80](https://github.com/kitikonti/ownchart/commit/4480d80879293bd518e6dbff0482d8f46be5d22f))
* **export:** switch to html-to-image with offscreen rendering ([4a97843](https://github.com/kitikonti/ownchart/commit/4a978435626d7514fbad9e237ac1599c03e62375))
* restrict column resizing to name column only ([e7ff4cb](https://github.com/kitikonti/ownchart/commit/e7ff4cbaf257b25cc7227494200bc5e2874cca79))

### [0.0.10](https://github.com/kitikonti/ownchart/compare/v0.0.9...v0.0.10) (2026-01-05)


### Bug Fixes

* resolve accessibility lint error in Modal component ([d4e7949](https://github.com/kitikonti/ownchart/commit/d4e7949abadd34e0fab0541319d370c69c97b823))

### [0.0.9](https://github.com/kitikonti/ownchart/compare/v0.0.8...v0.0.9) (2026-01-05)


### Features

* add multi-task dragging in timeline view ([8cfea20](https://github.com/kitikonti/ownchart/commit/8cfea209514c548f7bc36c8bafe78ccf41f45e73))
* add PNG export, help panel, and welcome tour ([f5b2387](https://github.com/kitikonti/ownchart/commit/f5b2387736fcf709f2f17a8dba1b451d3b642f2e))

### [0.0.8](https://github.com/kitikonti/ownchart/compare/v0.0.7...v0.0.8) (2026-01-04)


### Features

* add cross-tab copy/paste via system clipboard ([d427d54](https://github.com/kitikonti/ownchart/commit/d427d5491f87be25f658073aed8c2bc09f9b3df6))
* add insert task above/below toolbar buttons ([47dfb7a](https://github.com/kitikonti/ownchart/commit/47dfb7a80b93f50235ab010e60f7be3efc3af23f))


### Bug Fixes

* auto-resize name column accounts for hierarchy indent ([fcc3180](https://github.com/kitikonti/ownchart/commit/fcc3180bde92dd5fc9e56e1554e0637bf2493bdc))
* restrict collapse/expand to summary tasks only ([4c6c2c7](https://github.com/kitikonti/ownchart/commit/4c6c2c727b8805071ad74c5dbd6d9bf74918fa87))
* update clipboard tests to use clipboardTaskIds ([debfffb](https://github.com/kitikonti/ownchart/commit/debfffb91f44128a002bf62a667ce863570db5ef))

### [0.0.7](https://github.com/kitikonti/ownchart/compare/v0.0.6...v0.0.7) (2026-01-04)

### [0.0.6](https://github.com/kitikonti/ownchart/compare/v0.0.5...v0.0.6) (2026-01-04)


### Features

* add DEL key and toolbar button to delete selected tasks ([8838294](https://github.com/kitikonti/ownchart/commit/88382945dfeeb2fae4a41e549888bcf2627e9622))


### UI/UX

* fix cell edit mode vertical centering and left padding ([41bbcd2](https://github.com/kitikonti/ownchart/commit/41bbcd2ddc691c1cfbab1f3af6bcc25183b65df0))
* improve clipboard visual feedback ([c531b18](https://github.com/kitikonti/ownchart/commit/c531b187cea4b7dcfaa1122276877afac98bcca4))
* match placeholder row edit styling with regular cells ([083ddde](https://github.com/kitikonti/ownchart/commit/083ddde3c9b0f42ed49ea20c3ae778be651d2d76))
* use consistent placeholder text for new task row ([e049146](https://github.com/kitikonti/ownchart/commit/e0491461636e04ffaa89d0118612d8746058493b))
* use dashed border overlay for clipboard selection ([b5c0edd](https://github.com/kitikonti/ownchart/commit/b5c0edd1d4027f30efd67bc35b26d7b709372068))
* use dotted border for clipboard selection ([abef7be](https://github.com/kitikonti/ownchart/commit/abef7be517cceca9f391832d375adc6632ab43ed))

### [0.0.5](https://github.com/kitikonti/ownchart/compare/v0.0.4...v0.0.5) (2026-01-04)


### Features

* add clipboard operations and placeholder row for task creation ([ba8b0b2](https://github.com/kitikonti/ownchart/commit/ba8b0b24c791f067c82d711397bfd354a52cd316))

### [0.0.4](https://github.com/kitikonti/ownchart/compare/v0.0.3...v0.0.4) (2026-01-04)


### Features

* add rectangular marquee selection in timeline view ([423036c](https://github.com/kitikonti/ownchart/commit/423036c6380b3dfbd5a41fbbbfb50675c1f47f25))


### Bug Fixes

* resolve lint errors for unused variables ([fedd225](https://github.com/kitikonti/ownchart/commit/fedd22534120f8cce0c5a521e2e5b51582fecc32))
* resolve marquee selection closure issue ([1e47a96](https://github.com/kitikonti/ownchart/commit/1e47a96f1f1af348b38955c2db150ef4ebe2569f))


### UI/UX

* clear row selection when clicking a cell (Excel behavior) ([d64accc](https://github.com/kitikonti/ownchart/commit/d64accc0cd6a2d684b1cb985cdd125c6070a171a))
* disable text selection in TaskTable except in edit mode ([6c6319e](https://github.com/kitikonti/ownchart/commit/6c6319e6836752c13fdb5fe7965731688e5b0f91))
* replace task bar selection outline with full row highlight ([5944990](https://github.com/kitikonti/ownchart/commit/594499083d1abbd077f5257726e3d2c592aa53a0))

### [0.0.3](https://github.com/kitikonti/ownchart/compare/v0.0.2...v0.0.3) (2026-01-04)


### Features

* add task dependencies with Finish-to-Start relationships ([3b2b739](https://github.com/kitikonti/ownchart/commit/3b2b7390f07e4bba8ee453141baecc6e4b7120d0))
* configure GitHub Pages deployment ([1b23694](https://github.com/kitikonti/ownchart/commit/1b236940049a317f7ff3b39b53637398b02d2a78))
* implement multi-tab support for parallel chart editing ([6d06397](https://github.com/kitikonti/ownchart/commit/6d063977aa0d4c119c647b3e81d130afa2044baa))
* rebrand to OwnChart throughout application ([9d99b1c](https://github.com/kitikonti/ownchart/commit/9d99b1c9ee4a90fd4f241cebb77201f5aa256971))


### Bug Fixes

* add automatic migration from v1 to v2 storage ([c12b87a](https://github.com/kitikonti/ownchart/commit/c12b87ab35d9c429c6859414b752709c942d4647))
* prevent data loss on page reload by removing beforeunload cleanup ([9e17c98](https://github.com/kitikonti/ownchart/commit/9e17c98b692aca3d64acb3b2b51a08eb996b51bf))

### [0.0.2](https://github.com/kitikonti/ownchart/compare/v0.0.1...v0.0.2) (2026-01-03)


### Features

* add custom indent/outdent icons with horizontal lines 67622df
* add editable type column to task table 8561622
* add integration tests and toast notifications for undo/redo eb2230c
* add localStorage persistence to preserve data after browser refresh 3f3f724
* add validation to prevent multi-level jumps in hierarchy 662fd9b
* complete Sprint 1.2 Package 2 - Interactive Editing (drag-to-edit) 26de088
* complete Sprint 1.3 - File Operations with comprehensive security 0151b88
* enable type switching via clickable icon and remove type column 9a6d9f2
* implement automated versioning and release management 213828b
* implement hierarchical task organization (SVAR pattern) 15a0e21
* implement hierarchy indent/outdent functionality be04a92
* implement resizable split pane between TaskTable and Timeline bc4631b
* implement Sprint 1.2 Package 1 - Core Foundation c7a4eb2
* implement Sprint 1.5 - Undo/Redo system with keyboard shortcuts 49af349
* implement SVAR-style sticky scroll layout for timeline 4100c40
* improve milestone handling and unify task styling 46ff348
* integrate competitive analysis insights and enhance data model 9df604d
* migrate from Heroicons to Phosphor Icons 2180141
* redesign color column as compact vertical bar 195fba8
* remove 1:1 reset zoom button 9d95448
* **store:** add task CRUD operations 70b2e9a
* **store:** add task selection and reordering 8894d85
* **store:** initialize task store with Zustand 93a7bea
* switch indent/outdent shortcuts from Ctrl+[/] to Tab/Shift+Tab 4d22ffc
* **types:** add Chart and AppState interfaces dd230da
* **types:** add Dependency interface 87df387
* **types:** add Task interface definition 97c1a1c
* **ui:** add auto-fit column width on double-click cf8734a
* **ui:** add delete task functionality 77afa4b
* **ui:** add drag-and-drop reordering with [@dnd-kit](undefined/dnd-kit) 1493346
* **ui:** add inline editing to TaskRow 9edbd96
* **ui:** add live preview for column resizing 08b0ea0
* **ui:** add multi-selection with checkboxes 2fc945d
* **ui:** add TaskList container component 0d902d0
* **ui:** add TaskRow component with display mode 8ab38ce
* **ui:** integrate TaskList into App.tsx 7714549
* **ui:** transform TaskList into Excel-like spreadsheet table 3a90bad
* update icons to Phosphor icons ad22795
* **utils:** add basic validation functions b19d999
* **utils:** add validateTask function 265f09c


### Bug Fixes

* add undo/redo support for task reordering and color changes c500ff1, closes #3 #4
* correct duration calculation for tasks and summaries 06b4d15
* improve zoom indicator and adaptive grid lines 8bda22d
* prevent cascade effect when indenting multiple selected tasks 2ba6c60
* resolve delete task undo bug with deep clone and batch setState dae0e78
* resolve redo race condition by removing async imports ced6ff4
* resolve zoom functionality and fit-to-view double-padding bug 0ef8448
* skip milestone type when cycling types for tasks with children 8576c12
* **ui:** auto-open color picker on edit mode activation ca72ff9
* **ui:** ensure consistent color field appearance across all modes f6495ba
* **ui:** improve drag-and-drop visual feedback in TaskTable 7ca1410
* **ui:** prevent active cell border from being covered by hover f457db2
* **ui:** prevent color field vertical shift in edit mode 6969f64
* **ui:** remove text shift when entering edit mode eb2fe72
* **ui:** simplify color column display 01c09dc


### Code Refactoring

* redesign app header and simplify UI af5d0a6
* rename Sprint 1.15 → 1.1.1 and Sprint 1.16 → 1.1.2 a9ddd86
* rename usePanZoom to useZoom ee41c04
* reorganize toolbar following industry standard patterns 975f76e
* replace scaleLocked pattern with dateRange source of truth 511808a
* split App.tsx into sub-components e21e928


### UI/UX

* shorten progress column header to save space caba9db

## [0.0.3] - 2026-01-02

### Added - Sprint 1.2 Package 3: Navigation & Scale
- **Mouse Wheel Zoom**: Ctrl+Wheel zooms timeline centered on mouse cursor
- **Zoom Toolbar**: Zoom in/out buttons, percentage dropdown (10%-500%), Fit All button
- **Zoom Indicator**: Temporary overlay showing current zoom percentage (fixed center of viewport)
- **Fit-to-View**: Automatically calculates zoom level to show all tasks with 10% padding
- **Adaptive Grid Lines**: Grid density changes based on zoom level
  - Daily lines at ≥40% zoom
  - Weekly lines at 12-40% zoom (aligned to ISO 8601 Monday week start)
  - Monthly lines at <12% zoom (aligned to month boundaries)
- **Weekend Highlighting**: Visible at all zoom levels
- **SVAR-Style Sticky Scroll Layout**: Horizontal scrollbar always at viewport bottom
- **Keyboard Shortcuts**: Ctrl+0 (reset to 100%), Ctrl++ (zoom in), Ctrl+- (zoom out)

### Changed
- Implemented SVAR-inspired sticky scroll architecture for better UX
- Grid lines now use ISO 8601 week boundaries (Monday as week start)
- ZoomIndicator moved to root level with fixed positioning for stability
- Timeline header synchronized with chart zoom level

### Technical Details
- New `ZoomToolbar`, `ZoomIndicator`, `ZoomControls` components
- New `usePanZoom` hook for zoom event handling
- Enhanced `chartSlice.ts` with zoom state (single source of truth)
- Enhanced `GridLines.tsx` with adaptive density using `startOfWeek`/`startOfMonth`
- SVAR-style layout in `App.tsx` with pseudo-rows and sticky container
- Virtual scrolling via `translateY` transforms

### Performance
- Zoom maintains 60fps with 100+ tasks
- CSS transforms for GPU-accelerated rendering
- Grid calculation optimized with useMemo

## [0.0.2] - 2025-12-31

### Added - Sprint 1.2 Package 2: Interactive Editing
- **Drag-to-Move**: Drag task bars horizontally to shift dates
- **Drag-to-Resize**: Resize tasks from left/right edges to change duration
- **Milestone Dragging**: Milestones can be dragged with visual preview
- **Visual Preview**: Solid blue outline shows target position during drag
- **Snap-to-Grid**: Dates automatically round to nearest day boundary
- **Cursor Feedback**: Visual feedback (grab/grabbing/resize/not-allowed)
- **Summary Bracket Visualization**: Custom bracket/clamp SVG path for summary tasks
  - Horizontal bar at 30% of row height
  - 60-degree triangular downward tips
  - Rounded top corners (10px radius)
  - Rounded inner corners (3px radius)
  - Task name displayed to right of bracket
- **Recursive Cascade**: Parent summary dates update automatically through unlimited hierarchy levels
- **Validation**: Minimum 1-day duration enforced for regular tasks
- **Error Toasts**: Clear error messages for invalid operations

### Changed
- Summary tasks now render as bracket/clamp shapes instead of regular bars
- Summary tasks display task name to the right of the bracket
- Milestones now properly handle missing endDate field
- Keyboard shortcuts now use case-insensitive key comparison (fixes Ctrl+Shift+Z)
- Summary cascade now recursively updates all ancestor summaries

### Fixed
- Milestone rendering when only startDate is set (no endDate required)
- Redo functionality with frozen objects (mutable copy created)
- Summary type conversion now recalculates dates from children
- Nested summary cascade now updates top-level summaries correctly
- Date range calculation now filters out invalid/empty dates

### Technical Details
- Added `useTaskBarInteraction` hook for unified drag/resize handling
- Added `dragValidation.ts` for validation utilities
- Added `MilestoneDiamond` component for milestone rendering
- Added `SummaryBracket` component for summary bracket rendering
- Enhanced `taskSlice.ts` with recursive cascade algorithm
- Updated `historySlice.ts` to handle cascade updates in undo/redo
- Modified `TaskBar.tsx` to integrate interaction hook and preview rendering
- Updated `timelineUtils.ts` with milestone date fallback
- Modified `dateUtils.ts` to filter invalid dates

### Performance
- Drag start to first preview: <20ms
- Frame time during drag: <16ms (60fps maintained)
- Tested with 100+ tasks: No jank, smooth interaction
- Recursive cascade handles unlimited nesting levels efficiently

## [0.0.1] - 2025-12-30

### Added - Sprint 1.5: Undo/Redo System
- **Full Undo/Redo**: Complete command pattern implementation
- **Keyboard Shortcuts**: Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+Y (redo)
- **Toolbar Buttons**: Visual undo/redo controls with disabled states
- **Toast Notifications**: Real-time feedback for all undo/redo operations
- **Smart Command Recording**: Tracks all task operations automatically
- **Branching Support**: New actions after undo clear the redo stack

### Added - Sprint 1.2 Package 1: Timeline Visualization
- **Interactive Timeline**: SVG-based Gantt chart visualization
- **Sticky Headers**: Toolbar, table header, and timeline header stay visible
- **Synchronized Scrolling**: Table and timeline scroll together
- **Auto-Resize**: Timeline adapts to window size changes
- **Multi-Level Timeline**: Month + Day scale system (SVAR-inspired)
- **Weekend Highlighting**: Visual distinction for Sat/Sun
- **Today Marker**: Red line indicating current date
- **Task Types**: Visual rendering for tasks, summaries, milestones
- **Progress Bars**: Visual progress indication on task bars
- **Grid System**: Adaptive grid with proper alignment

### Technical Details
- Vertical flex layout with sticky header row
- Common vertical scroll container for synchronized scrolling
- Separate horizontal scroll per panel (table and timeline)
- ResizeObserver for responsive timeline
- Command pattern with Memento snapshots for undo/redo
- Zustand store with Immer middleware for state management

## [0.0.0] - 2025-12-23

### Added - Phase 0: Foundation
- Project initialization with Vite + React + TypeScript
- Build tools configured (Vite, TypeScript, ESLint, Prettier)
- Code quality tools set up (ESLint, Prettier, TypeScript strict mode)
- Testing infrastructure ready (Vitest, Playwright)
- CI/CD pipeline active (GitHub Actions)
- Documentation complete (concept folder structure)
- Basic project structure and folder organization
- README with development workflow
- Contributing guidelines

[Unreleased]: https://github.com/username/app-gantt/compare/v0.0.3...HEAD
[0.0.3]: https://github.com/username/app-gantt/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/username/app-gantt/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/username/app-gantt/compare/v0.0.0...v0.0.1
[0.0.0]: https://github.com/username/app-gantt/releases/tag/v0.0.0
