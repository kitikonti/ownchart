# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.2.6](https://github.com/kitikonti/ownchart/compare/v1.2.5...v1.2.6) (2026-03-13)


### Code Refactoring

* convert vi.mock() paths to @/ alias for consistency ([88610ce](https://github.com/kitikonti/ownchart/commit/88610ce2706a5dc44d927d3f206c42a55021d2a6)), closes [#63](https://github.com/kitikonti/ownchart/issues/63)
* replace relative imports with @/ path alias ([#63](https://github.com/kitikonti/ownchart/issues/63)) ([deebde6](https://github.com/kitikonti/ownchart/commit/deebde64ed45592867721fcb2e4cac7345419cc8))

## [1.2.5](https://github.com/kitikonti/ownchart/compare/v1.2.4...v1.2.5) (2026-03-13)


### Bug Fixes

* allow milestone date editing by syncing both dates ([#68](https://github.com/kitikonti/ownchart/issues/68)) ([678de2b](https://github.com/kitikonti/ownchart/commit/678de2bebca7b19769f6e0b3047b6a5050bff34e))

## [1.2.4](https://github.com/kitikonti/ownchart/compare/v1.2.3...v1.2.4) (2026-03-13)


### Bug Fixes

* **a11y:** add roving-tabindex arrow-key navigation to SegmentedControl ([f8ffafd](https://github.com/kitikonti/ownchart/commit/f8ffafd9cff28a03428657fe3a7d2e26e32b72c1))
* **a11y:** improve SegmentedControl semantics and fix dead-code defaults ([9798056](https://github.com/kitikonti/ownchart/commit/979805649329413caeaf5e13c2a8b9c0f2d1d34a))
* **a11y:** wrap ArrowDown/Up in SegmentedControl grid layout + add keyboard nav tests ([43928b1](https://github.com/kitikonti/ownchart/commit/43928b19cff51c24220ace259ec219ae962ac0f2))
* **export:** validate mm/px args in mmToPxAtDpi and pxToMmAtDpi ([9b2ff63](https://github.com/kitikonti/ownchart/commit/9b2ff634fce3941562899a2ed5f839279c60c625))
* **review:** add [@param](https://github.com/param) JSDoc to registerInterFont; add downloadBlob DOM-cleanup and edge-case tests ([562be4f](https://github.com/kitikonti/ownchart/commit/562be4f18bd38bc19b4e28b3125b712cbf1cebec))
* **review:** address a11y and clarity findings in Checkbox and MobileBlockScreen ([2131c6c](https://github.com/kitikonti/ownchart/commit/2131c6ca791cb403dc43ed0e08bf0337ab033c87))
* **review:** address a11y and documentation findings in ZoomControls, FitToWidthSelector, CustomZoomControl ([cf797b8](https://github.com/kitikonti/ownchart/commit/cf797b8f79c66263579fed0d2ec9736cbc1d426b))
* **review:** address a11y and semantic findings in UI components ([b210b31](https://github.com/kitikonti/ownchart/commit/b210b3117111482bb86db6df9c37cfd757066139))
* **review:** address review findings in AppErrorBoundary, CustomZoomControl, FitToWidthSelector, TimelinePanel ([438d461](https://github.com/kitikonti/ownchart/commit/438d461dbe92e3ca71b49f6e12365fff3365b9d1))
* **review:** address review findings in AppErrorBoundary, CustomZoomControl, FitToWidthSelector, TimelinePanel ([88b42ce](https://github.com/kitikonti/ownchart/commit/88b42ce5652530182cfed45618948391775858c2))
* **review:** address review findings in AppErrorBoundary, ZoomControls, FitToWidthSelector, CustomZoomControl ([5f3d6c3](https://github.com/kitikonti/ownchart/commit/5f3d6c305bcb95cb1cefe2b8b585a5e9d2268fc3))
* **review:** address review findings in AppErrorBoundary, ZoomControls, FitToWidthSelector, CustomZoomControl ([b90d3d5](https://github.com/kitikonti/ownchart/commit/b90d3d5501b3d4ad71c26f6f29cce582fd97b7d6))
* **review:** address review findings in AppErrorBoundary, ZoomControls, FitToWidthSelector, CustomZoomControl, TimelinePanel ([9b04d13](https://github.com/kitikonti/ownchart/commit/9b04d13c7ff26580c711bb22a23ebb11460a9f62))
* **review:** address review findings in AppErrorBoundary, ZoomControls, FitToWidthSelector, CustomZoomControl, TimelinePanel ([5136e99](https://github.com/kitikonti/ownchart/commit/5136e99a1bc69e8a8fcdb16f3e431ac91ec4b081))
* **review:** address review findings in AppErrorBoundary, ZoomControls, FitToWidthSelector, CustomZoomControl, TimelinePanel ([8a8ebf3](https://github.com/kitikonti/ownchart/commit/8a8ebf302c6a008a0cfa0d3e3c1a474b6087801a))
* **review:** address review findings in AppErrorBoundary, ZoomControls, FitToWidthSelector, CustomZoomControl, TimelinePanel ([5c7e973](https://github.com/kitikonti/ownchart/commit/5c7e9730c1bbf3c80db7c92b4849b203d957b8da))
* **review:** address review findings in AppErrorBoundary, ZoomControls, FitToWidthSelector, CustomZoomControl, TimelinePanel ([1375591](https://github.com/kitikonti/ownchart/commit/1375591f834941f002d4ae98421c21cf03fd47ac))
* **review:** address review findings in AppErrorBoundary, ZoomControls, FitToWidthSelector, CustomZoomControl, TimelinePanel ([17b5d32](https://github.com/kitikonti/ownchart/commit/17b5d3268e314d6c725ee58a1aea9ac6a9979a32))
* **review:** address review findings in AppErrorBoundary, ZoomControls, FitToWidthSelector, CustomZoomControl, TimelinePanel ([b5d011a](https://github.com/kitikonti/ownchart/commit/b5d011a05d42ec24b2fbce98e78f6f71f9720ba9))
* **review:** address review findings in AppErrorBoundary, ZoomControls, FitToWidthSelector, CustomZoomControl, TimelinePanel ([8b4a11b](https://github.com/kitikonti/ownchart/commit/8b4a11b62c8c0339dc2df3b60861dd3396e5cb1d))
* **review:** address review findings in AppErrorBoundary, ZoomControls, FitToWidthSelector, CustomZoomControl, TimelinePanel ([42654fa](https://github.com/kitikonti/ownchart/commit/42654fa5eafd5c99729bd5b9aa822e5877b8cb45))
* **review:** address review findings in AppErrorBoundary, ZoomControls, FitToWidthSelector, CustomZoomControl, TimelinePanel ([8494dc9](https://github.com/kitikonti/ownchart/commit/8494dc993225f4cec32659e6ed5cddfd98233b16))
* **review:** address review findings in AppErrorBoundary, ZoomControls, FitToWidthSelector, CustomZoomControl, ZoomModeSelector ([3ef51c4](https://github.com/kitikonti/ownchart/commit/3ef51c41b9448345e64545b3f86c31f3eab4f978))
* **review:** address review findings in branded, task, and ui types ([de1330b](https://github.com/kitikonti/ownchart/commit/de1330becaa322e7be748c842a7ea5fdc66a50b1))
* **review:** address review findings in calculations, captureChart, and helpers ([d0f49f8](https://github.com/kitikonti/ownchart/commit/d0f49f8b8dda34500acb1af3e49bc55ddaa715e7))
* **review:** address review findings in calculations, captureChart, and helpers ([908f448](https://github.com/kitikonti/ownchart/commit/908f4484b8c8ef52a48c0ef3f9e93eb601f697fc))
* **review:** address review findings in cellStyles and inputStyles ([8d07559](https://github.com/kitikonti/ownchart/commit/8d075595d4b51dc5f302e9dee8c7b8a5e01f24c1))
* **review:** address review findings in config files ([82c9f66](https://github.com/kitikonti/ownchart/commit/82c9f660d221ede2be27a58b11cc785f9469f594))
* **review:** address review findings in config files ([bfed380](https://github.com/kitikonti/ownchart/commit/bfed3804430d3d6c0cd4e5192dc7cb23a718bf1d))
* **review:** address review findings in export utils ([0a2bd20](https://github.com/kitikonti/ownchart/commit/0a2bd2035563934216dccb0486270c77ff2f0a5b))
* **review:** address review findings in export utils ([1bfc762](https://github.com/kitikonti/ownchart/commit/1bfc7627137ed298330a8e61dfee042685d1d7f2))
* **review:** address review findings in export utils ([02b2330](https://github.com/kitikonti/ownchart/commit/02b23300f0dfb5b4fac40858eceaa4b6b0360597))
* **review:** address review findings in export utils ([df28200](https://github.com/kitikonti/ownchart/commit/df28200b4a267018d74c18c57fc4e14c0579d6ef))
* **review:** address review findings in export utils ([78ee6ba](https://github.com/kitikonti/ownchart/commit/78ee6ba02cb45b166b7d11c81345460fc981a38b))
* **review:** address review findings in export utils ([c2d9e23](https://github.com/kitikonti/ownchart/commit/c2d9e2300a1e64ee26aca9453b1aeb8fa27c5a30))
* **review:** address review findings in export utils ([ce8d968](https://github.com/kitikonti/ownchart/commit/ce8d968bcdd88c8575bff6e04e32ca3be9f64adc))
* **review:** address review findings in export utils (constants, dpi, downloadPng, sanitizeFilename, index) ([50461bb](https://github.com/kitikonti/ownchart/commit/50461bbab7753eb27be972693c3f12952b723aa5))
* **review:** address review findings in export utils (dpi, downloadPng, sanitizeFilename) ([2bcf6c6](https://github.com/kitikonti/ownchart/commit/2bcf6c63fe2016a224514589a3117a4db9d080ab))
* **review:** address review findings in export utils (dpi, sanitizeFilename, downloadPng, index) ([5b7ae39](https://github.com/kitikonti/ownchart/commit/5b7ae39ac9c10e4d2246242ff2821df6aff57f20))
* **review:** address review findings in export utils (index, downloadPng, dpi, constants, sanitizeFilename, interFont) ([1f7e29a](https://github.com/kitikonti/ownchart/commit/1f7e29a6376a75861b33bc6f56d8d8500e5b75fc))
* **review:** address review findings in export utils (index, downloadPng, dpi, constants, sanitizeFilename, interFont) ([24e8fe3](https://github.com/kitikonti/ownchart/commit/24e8fe3d7691cb346b6974c6261697c4d4794e6c))
* **review:** address review findings in export utils (index, downloadPng, dpi, constants, sanitizeFilename, interFont) ([ea2d431](https://github.com/kitikonti/ownchart/commit/ea2d43150945812d662f5f38af55270a505a8197))
* **review:** address review findings in export utils (index, downloadPng, dpi, constants, sanitizeFilename, interFont) ([5431c8e](https://github.com/kitikonti/ownchart/commit/5431c8e386a73b648e6fcdfa4e12974c6ef4bc51))
* **review:** address review findings in graphHelpers ([4b5ea77](https://github.com/kitikonti/ownchart/commit/4b5ea77bc9235bfb0568e312fe67487caa9e1790))
* **review:** address review findings in hooks (useDropdown, useRibbonCollapse, useTimelineAreaContextMenu, useProgressDrag, useAutoColumnWidth) ([14505d6](https://github.com/kitikonti/ownchart/commit/14505d65cced63260a4b828bb56f845d85b024d9))
* **review:** address review findings in hooks (useTimelineAreaContextMenu, useProgressDrag, useRibbonCollapse, useDropdown, useAutoColumnWidth) ([c811881](https://github.com/kitikonti/ownchart/commit/c811881c30ca666d0e8239f7aca6ab192e7c89c3))
* **review:** address review findings in hooks batch (useDeviceDetection, useProjectColors, useHelpSearch, useTaskTableRowContextMenu) ([26e0f2a](https://github.com/kitikonti/ownchart/commit/26e0f2ad7a62dd896ccf1ffaa50006deaa999795))
* **review:** address review findings in hooks batch 08 ([77430bb](https://github.com/kitikonti/ownchart/commit/77430bbf5fe85b4cca11bfff6ac677bacf9481e9))
* **review:** address review findings in hooks batch 09 ([7476ab8](https://github.com/kitikonti/ownchart/commit/7476ab88ec1892cb359c2dd283c889366cc94bb3))
* **review:** address review findings in hooks batch 09 ([4c09999](https://github.com/kitikonti/ownchart/commit/4c09999ab7edf3d1fa4f13356d49c62fcaa8af1f))
* **review:** address review findings in hooks batch 09 ([e7ec2e8](https://github.com/kitikonti/ownchart/commit/e7ec2e8f9b80404fe389014a5d055c2dc39e0c40))
* **review:** address review findings in hooks batch 09a ([6fe945c](https://github.com/kitikonti/ownchart/commit/6fe945c75465808fc7d775a2e5db88b2f70c29ef))
* **review:** address review findings in hooks batch 09a ([8769539](https://github.com/kitikonti/ownchart/commit/87695392f290e66c8203d555ca835487d6536ad5))
* **review:** address review findings in hooks batch 09a ([880f2f6](https://github.com/kitikonti/ownchart/commit/880f2f622594901a4670319643385f7e643f5150))
* **review:** address review findings in hooks batch 09a test files ([83cd421](https://github.com/kitikonti/ownchart/commit/83cd4217f13f0290788b334f949c4a7536266ded))
* **review:** address review findings in hooks batch 9a ([57ca900](https://github.com/kitikonti/ownchart/commit/57ca9007d2a4ca92553cf530a7c19b00bef043be))
* **review:** address review findings in MobileBlockScreen, DropdownPanel, LabeledCheckbox ([65de371](https://github.com/kitikonti/ownchart/commit/65de37126b50aee76682359410aef4e1f3250597))
* **review:** address review findings in new components ([f35d2da](https://github.com/kitikonti/ownchart/commit/f35d2da56d59ce2df7d38b06a095ddb770832284))
* **review:** address review findings in new Export and Layout components ([82dc9eb](https://github.com/kitikonti/ownchart/commit/82dc9eb69b57cf976f0f25a2134bd287ddde9e81))
* **review:** address review findings in new export utils ([744f544](https://github.com/kitikonti/ownchart/commit/744f54475c4187c7c1b5b0d1d0f61921f130366a))
* **review:** address review findings in new export utils ([3bca4d5](https://github.com/kitikonti/ownchart/commit/3bca4d5456602fcfe53ffd05fa154ef35057af9a))
* **review:** address review findings in new hook files ([4a2034c](https://github.com/kitikonti/ownchart/commit/4a2034c56f17cbf4958abf9f9f2fbd4b16ac658b))
* **review:** address review findings in new hooks ([3f646fb](https://github.com/kitikonti/ownchart/commit/3f646fbebb7503610e3323322e956b0b5c014b1c))
* **review:** address review findings in new hooks ([5b9d7aa](https://github.com/kitikonti/ownchart/commit/5b9d7aa861289f955e965d4b3808c3fb703c2f69))
* **review:** address review findings in new hooks batch ([940f9d8](https://github.com/kitikonti/ownchart/commit/940f9d8c2beb95432f327511b4a3e9631806637f))
* **review:** address review findings in new hooks batch ([06a015d](https://github.com/kitikonti/ownchart/commit/06a015da9e106380313e73564180097c005f6fdb))
* **review:** address review findings in new hooks batch ([7ae07bb](https://github.com/kitikonti/ownchart/commit/7ae07bb3f17edfaaa209742c4096910e98428767))
* **review:** address review findings in new hooks batch ([97067c8](https://github.com/kitikonti/ownchart/commit/97067c8eaf6ca2a554e1529204299e0ee88d7683))
* **review:** address review findings in new hooks batch ([8a0be01](https://github.com/kitikonti/ownchart/commit/8a0be01f54aeaa13a9fe025497f74a291bde0d0e))
* **review:** address review findings in new hooks batch 03 ([79be6f3](https://github.com/kitikonti/ownchart/commit/79be6f3b7e9f935e3fcd479a17461aa35b68b33f))
* **review:** address review findings in new hooks batch 03 ([6f66452](https://github.com/kitikonti/ownchart/commit/6f66452fb7ef8e0faf814feb88260b58300334e1))
* **review:** address review findings in new hooks batch 03 ([9f741ad](https://github.com/kitikonti/ownchart/commit/9f741ad85bff8ea42af96f4cb699dcde654866d6))
* **review:** address review findings in new hooks batch 3 ([2b31e4a](https://github.com/kitikonti/ownchart/commit/2b31e4a70bea22a3e3b627eec91627b830e75f11))
* **review:** address review findings in new TaskList and common components ([104113e](https://github.com/kitikonti/ownchart/commit/104113ea4b6429e0e3021f34fb8c6dec60a88946))
* **review:** address review findings in new UI components ([a5b65dd](https://github.com/kitikonti/ownchart/commit/a5b65dda0d3456771a917ba335666b01187baccd))
* **review:** address review findings in new UI components ([4a279d6](https://github.com/kitikonti/ownchart/commit/4a279d6c3af49b83e01a1dafbabf5800543ee7f2))
* **review:** address review findings in new utils batch ([b671fa1](https://github.com/kitikonti/ownchart/commit/b671fa188dc1a082203cd370bad91e0c5c11538e))
* **review:** address review findings in prepareRowPaste and compare ([f45b813](https://github.com/kitikonti/ownchart/commit/f45b813ad6cf9b975862cc1893048400e2d12230))
* **review:** address review findings in prepareRowPaste and compare ([1029619](https://github.com/kitikonti/ownchart/commit/102961918ffc264ea47b09b5fc47911f07a23962))
* **review:** address review findings in prepareRowPaste and compare ([18beb15](https://github.com/kitikonti/ownchart/commit/18beb153d408273d17e267be5018c1427e218518))
* **review:** address review findings in prepareRowPaste and compare ([986a06f](https://github.com/kitikonti/ownchart/commit/986a06f838b572b50f6c3d80f556c67757e467e2))
* **review:** address review findings in prepareRowPaste and compare ([79ad203](https://github.com/kitikonti/ownchart/commit/79ad203cb9cbeb4081bcdf6aadded0f4b2fbb846))
* **review:** address review findings in RadioOptionCard, Checkbox, LabeledCheckbox, DropdownPanel ([231176d](https://github.com/kitikonti/ownchart/commit/231176dbba04dba90405c61e02027bcfbc4c90b4))
* **review:** address review findings in RadioOptionCard, Checkbox, LabeledCheckbox, DropdownPanel ([a611f5c](https://github.com/kitikonti/ownchart/commit/a611f5cd4d15a18a57265a0fec8816f8c5ae7671))
* **review:** address review findings in RadioOptionCard, LabeledCheckbox, and common UI components ([fef688b](https://github.com/kitikonti/ownchart/commit/fef688bc3d7e5e5d64c492a9cb39c1cee3e985fb))
* **review:** address review findings in RadioOptionCard, Radio, Checkbox, and related UI components ([cbe54f6](https://github.com/kitikonti/ownchart/commit/cbe54f6e900c368f6dfaa89ef4433ebdb88ca937))
* **review:** address review findings in RadioOptionCard, Radio, Checkbox, MobileBlockScreen, DropdownPanel ([f6e63bc](https://github.com/kitikonti/ownchart/commit/f6e63bc8f38349217eb67a92f49545852093598b))
* **review:** address review findings in RadioOptionCard, Radio, Checkbox, MobileBlockScreen, DropdownPanel, LabeledCheckbox ([c51baa1](https://github.com/kitikonti/ownchart/commit/c51baa1b2143665c39784efb30fa627d5c074d11))
* **review:** address review findings in RadioOptionCard, Radio, Checkbox, MobileBlockScreen, DropdownPanel, LabeledCheckbox ([e48e138](https://github.com/kitikonti/ownchart/commit/e48e13850b712f962948c6572caa84d7daeba9e1))
* **review:** address review findings in RadioOptionCard, Radio, MobileBlockScreen, DropdownPanel ([e9846df](https://github.com/kitikonti/ownchart/commit/e9846dfc6dd6c2a7f4f7f9df7cc85a5721204a67))
* **review:** address review findings in SegmentedControl, InsertRowButton, InsertLine, RowOverlays, dragSelectionState ([6bbcf73](https://github.com/kitikonti/ownchart/commit/6bbcf7372e214f10c3b458e7e9a179b552b0074a))
* **review:** address review findings in SegmentedControl, InsertRowButton, InsertLine, useRowSelectionHandler ([3d9600b](https://github.com/kitikonti/ownchart/commit/3d9600bcebd46192e745b4c1d1c7ff98b13b5310))
* **review:** address review findings in task, branded, and ui types ([a350e18](https://github.com/kitikonti/ownchart/commit/a350e189f42c4afc286886c8f82fee582407e131))
* **review:** address review findings in task.types, branded.types, ui.types ([e80c2dd](https://github.com/kitikonti/ownchart/commit/e80c2dd25d20b1cf6daf608e50704011d48425e0))
* **review:** address review findings in task.types, branded.types, ui.types ([6b51cce](https://github.com/kitikonti/ownchart/commit/6b51ccec5162a240c9500fdf1276fe88dcdb9a79))
* **review:** address review findings in task.types, branded.types, ui.types ([58d589e](https://github.com/kitikonti/ownchart/commit/58d589e5b2c12b2fe1fc42400da32ef044fa6d70))
* **review:** address review findings in task.types, branded.types, ui.types ([6e48201](https://github.com/kitikonti/ownchart/commit/6e48201ccc9632437c59a3623df45a1227a30641))
* **review:** address review findings in UI common components ([16e7c79](https://github.com/kitikonti/ownchart/commit/16e7c79b6146021af37011f636e909dd11401f81))
* **review:** address review findings in UI components ([f73cf9b](https://github.com/kitikonti/ownchart/commit/f73cf9be8fbed81a4aa75178a880d6ea5629f8a8))
* **review:** address review findings in UI components ([dfa58a1](https://github.com/kitikonti/ownchart/commit/dfa58a1b4d138d8d249ef824ccc92a88a920ef42))
* **review:** address review findings in UI components ([24a5123](https://github.com/kitikonti/ownchart/commit/24a51239aef5bfa28cd60aaf91d265285857e8a0))
* **review:** address review findings in UI components ([934de46](https://github.com/kitikonti/ownchart/commit/934de46e7d2fcadf081b2c1f8157cf3c80e7de66))
* **review:** address review findings in UI components ([23943b0](https://github.com/kitikonti/ownchart/commit/23943b0e6c31b77840a91eb21dc0674dc60c9d56))
* **review:** address review findings in UI components ([98fd93a](https://github.com/kitikonti/ownchart/commit/98fd93a810c632f8e034b32f74b7aa8e5cc55cb2))
* **review:** address review findings in UI primitive components ([f63349a](https://github.com/kitikonti/ownchart/commit/f63349a6ca78f1de9596dfed4c6723e2c43b3312))
* **review:** address review findings in useContainerDimensions, useSyncScroll, useNewTaskCreation, and related hooks ([3b3223d](https://github.com/kitikonti/ownchart/commit/3b3223d1997e7b99c283dbc84910eb87e074ea05))
* **review:** address review findings in useDropdown, useProgressDrag, useRibbonCollapse, useAutoColumnWidth, useTimelineAreaContextMenu ([00eec05](https://github.com/kitikonti/ownchart/commit/00eec056b1ee55f1e7563396a09c3670484d8f35))
* **review:** address review findings in useExportDialog and useCellEdit ([3dd4c6c](https://github.com/kitikonti/ownchart/commit/3dd4c6c103173d1a4430a9414ec96095aed578c3))
* **review:** address review findings in useHomeTabActions and useInfiniteScroll ([726435a](https://github.com/kitikonti/ownchart/commit/726435a1f6ee9c4792692c5ee2a5706c78db6abc))
* **review:** address review findings in useHomeTabActions, usePlaceholderNameEdit, useInfiniteScroll, useViewTabActions ([e4ab600](https://github.com/kitikonti/ownchart/commit/e4ab6003ed43df8c6a8141570990d3d22a700e33))
* **review:** address review findings in useHomeTabActions, usePlaceholderNameEdit, useInfiniteScroll, useViewTabActions ([5c0952c](https://github.com/kitikonti/ownchart/commit/5c0952cdbb634e6626b44702d79cb6a5d333f772))
* **review:** address review findings in useHomeTabActions, usePlaceholderNameEdit, useInfiniteScroll, useViewTabActions ([891e89a](https://github.com/kitikonti/ownchart/commit/891e89a99bbf5d26b717e4689b52b072ff6df849))
* **review:** address review findings in useTimelineAreaContextMenu, useProgressDrag, useDropdown, useAutoColumnWidth ([e9e950a](https://github.com/kitikonti/ownchart/commit/e9e950af332c6326678da134d8a82e862f1a0789))
* **review:** address review findings in useTimelineBarContextMenu, useFlattenedTasks, useTableDimensions, useLaunchQueue, useDocumentTitle ([ddbfe0b](https://github.com/kitikonti/ownchart/commit/ddbfe0ba1ddb565894237db9e165f61508da66fc))
* **review:** address review findings in useTimelineBarContextMenu, useFlattenedTasks, useTableDimensions, useLaunchQueue, useDocumentTitle, useUnsavedChanges ([d134dfe](https://github.com/kitikonti/ownchart/commit/d134dfe93bc9dce68f1c3b0a508deb9c78468c02))
* **review:** address review findings in ZoomControls, FitToWidthSelector, CustomZoomControl ([a939153](https://github.com/kitikonti/ownchart/commit/a9391534b542e962917024912353033419745647))
* **review:** apply review findings for exportLayout, pagePresets, columns, dateFormatting ([3fbc9ab](https://github.com/kitikonti/ownchart/commit/3fbc9ab03351f89bb4997868d13959efbb081cc5))
* **review:** apply review fixes to export utils ([667bd36](https://github.com/kitikonti/ownchart/commit/667bd363701371169e17f52ffe15311d9ff6af67))
* **review:** eliminate nested try/finally exception masking in downloadBlob; improve formatDpiDescription JSDoc ([7c54185](https://github.com/kitikonti/ownchart/commit/7c54185a209520ed73af8c294e218e838fed2de8))
* **review:** export formatResolutionDescription, add format tests, strengthen JSDoc ([cdaedf8](https://github.com/kitikonti/ownchart/commit/cdaedf8eff23e37bad4f1fa786cfef8c321750ba))
* **review:** improve robustness of export utils (downloadPng, dpi, interFont) ([4755587](https://github.com/kitikonti/ownchart/commit/47555879f50e3c38bed749219c83ba42c381d7c0))
* **review:** reconcile stale MQL state in useDeviceDetection on mount ([5925fdb](https://github.com/kitikonti/ownchart/commit/5925fdbbbdcc8fef62a7f7bd1729b73e56a999b3))
* **review:** robustness improvements in hooks ([2882912](https://github.com/kitikonti/ownchart/commit/2882912c9738cff39f3cbd88c4b5d0e95edaf622))
* **review:** tighten export calculations types and split long method ([aaffee7](https://github.com/kitikonti/ownchart/commit/aaffee77b747153ddd700a69a7105156dfc341e3))
* **review:** wire inputStyles constants into Radio, Checkbox, and option card consumers ([5e5872b](https://github.com/kitikonti/ownchart/commit/5e5872b66b9048563df2cb428e5e3ed8706960ed))


### Performance Improvements

* memo-wrap InsertRowButton and HelpTabContent; add clarifying comments ([31c6002](https://github.com/kitikonti/ownchart/commit/31c600204585ebc9938cdc55317b57131dc3fc76))


### Code Refactoring

* address review findings from hooks-02 merge ([e204589](https://github.com/kitikonti/ownchart/commit/e20458974afcf954e1d42c031b41df7dc427222c))
* consolidate InsertRowButton hit-area constant and clean up magic numbers ([85a3274](https://github.com/kitikonti/ownchart/commit/85a3274b3a3a82b8be69c90a6bb77f16f70c71dc))
* eliminate SegmentedControl button duplication and memo InsertLine ([95ac386](https://github.com/kitikonti/ownchart/commit/95ac386cf4d93f4e1623e96c9d75062ba0b58c95))
* fix cross-cutting concerns from code review ([621e44c](https://github.com/kitikonti/ownchart/commit/621e44cf774a284a18e76c4d6b4c1b4df2ea8422))
* **hooks:** address review findings in useHideOperations, useTaskRowData, useTableHeaderContextMenu ([42629ad](https://github.com/kitikonti/ownchart/commit/42629ad3bd351452ef4461b8308770973d3bf6e2))
* **hooks:** extract helper functions to meet 50-line function budget ([7ea75b4](https://github.com/kitikonti/ownchart/commit/7ea75b435c75ca4f05e349c1c4b90c2c34a7a9b9))
* **hooks:** extract resolveNeighborsAndGaps helper, annotate hook length ([b616239](https://github.com/kitikonti/ownchart/commit/b6162390ac40a180664bfbb84388292710b9ce77))
* **hooks:** group import type lines last in useHideOperations and useTableHeaderContextMenu ([84590bd](https://github.com/kitikonti/ownchart/commit/84590bdc2d5d551ffd516fdb69d367b576d51a03))
* **hooks:** merge ReactNode type import into main React import line ([206fd3e](https://github.com/kitikonti/ownchart/commit/206fd3e69cabf281e859732d7a4383b2470baf98))
* **hooks:** review fixes for useExportDialog and useCellEdit ([18a3876](https://github.com/kitikonti/ownchart/commit/18a38762205ae7649a8bebd46fa127a028690486))
* **review:** add REVIEW-OK stabilisation comments to new hooks ([a5cfdd7](https://github.com/kitikonti/ownchart/commit/a5cfdd74067d81ba55abe9a22066c7e9ad3a1b17))
* **review:** address review findings in calculations, captureChart and helpers ([1413b11](https://github.com/kitikonti/ownchart/commit/1413b1141dbe075717205a9673f0f9ddc992858e))
* **review:** address review findings in calculations, captureChart and helpers ([40a7240](https://github.com/kitikonti/ownchart/commit/40a724079facc7c263f0724d7d559b3d20e92baa))
* **review:** address review findings in calculations, captureChart, and helpers ([b9dd077](https://github.com/kitikonti/ownchart/commit/b9dd0770e69a1dd9488681f6d2f375f7d26e21b2))
* **review:** address review findings in calculations, captureChart, and helpers ([b9ad744](https://github.com/kitikonti/ownchart/commit/b9ad744c0f5e76b9fe8e5cbc8c3388fed1e5ee5b))
* **review:** address review findings in calculations, captureChart, and helpers ([757a242](https://github.com/kitikonti/ownchart/commit/757a2422dfa9cfda1ef6145d2552ac0bd99a0060))
* **review:** address review findings in calculations, captureChart, and helpers ([0388c31](https://github.com/kitikonti/ownchart/commit/0388c315e9e5de129f7671ce356db115ee48c83e))
* **review:** address review findings in calculations, captureChart, and helpers ([2617a0f](https://github.com/kitikonti/ownchart/commit/2617a0f6e6d029ad0b206841af519b9ffa36a2ba))
* **review:** address review findings in calculations, captureChart, and helpers ([fe653dc](https://github.com/kitikonti/ownchart/commit/fe653dcb591ac9ab7931135404c97d56e3df0b4b))
* **review:** address review findings in calculations, captureChart, and helpers ([118e8d7](https://github.com/kitikonti/ownchart/commit/118e8d742e135453cd2a10b77695d3f1c2c4dff2))
* **review:** address review findings in calculations, captureChart, and helpers ([ea49bd7](https://github.com/kitikonti/ownchart/commit/ea49bd7b6ff1e905753b846ada98ca8609233825))
* **review:** address review findings in calculations, captureChart, and helpers ([59450e4](https://github.com/kitikonti/ownchart/commit/59450e48393976befde5da7c2ee4614207af6135))
* **review:** address review findings in calculations, captureChart, and helpers ([61580be](https://github.com/kitikonti/ownchart/commit/61580beb776a89b2f695b9372f85de0cba90dd7c))
* **review:** address review findings in calculations, captureChart, and helpers ([78149df](https://github.com/kitikonti/ownchart/commit/78149df7c09a4462f6f9bad3f476f063487dce3f))
* **review:** address review findings in calculations, captureChart, helpers ([7bf726d](https://github.com/kitikonti/ownchart/commit/7bf726d7d6e07dcd5a2bac512b963021e1e12fda))
* **review:** address review findings in calculations, captureChart, helpers ([2065925](https://github.com/kitikonti/ownchart/commit/2065925b978799a2e1af75a97fb3d7eabe6a8924))
* **review:** address review findings in calculations, captureChart, helpers ([59580c5](https://github.com/kitikonti/ownchart/commit/59580c5bb3582e786683dc8263ae34d9aa56f604))
* **review:** address review findings in calculations, captureChart, helpers ([dafaa16](https://github.com/kitikonti/ownchart/commit/dafaa16cfc3a5d9b5461ae97b848e44699a9a150))
* **review:** address review findings in calculations, captureChart, helpers ([df63414](https://github.com/kitikonti/ownchart/commit/df63414d8ea6bf7724b36cb7f90c22111a0dc714))
* **review:** address review findings in calculations, captureChart, helpers ([498ab43](https://github.com/kitikonti/ownchart/commit/498ab436c8437c65face7271e64ccdd14901d5e7))
* **review:** address review findings in calculations, helpers, and captureChart ([9480187](https://github.com/kitikonti/ownchart/commit/94801872f3f21c3c81f4086e291c1f32c15d15bd))
* **review:** address review findings in cellStyles and inputStyles ([78255b9](https://github.com/kitikonti/ownchart/commit/78255b9fbf9edd22f2d63e4cbd9b27cb13dfa0b3))
* **review:** address review findings in common UI components ([c0c0c23](https://github.com/kitikonti/ownchart/commit/c0c0c2304a461a79ea12410d03314624d8a0595e))
* **review:** address review findings in common UI components ([3a6d877](https://github.com/kitikonti/ownchart/commit/3a6d87784a563f20d63d922fed52b719b147d14d))
* **review:** address review findings in common UI components ([f1a6462](https://github.com/kitikonti/ownchart/commit/f1a646229fbd5c3f553f93ecd8a5058198aa099f))
* **review:** address review findings in common UI components ([da8b7c8](https://github.com/kitikonti/ownchart/commit/da8b7c80be1db99e68d513eae0c5891e6a6f48d7))
* **review:** address review findings in common UI components ([9c238be](https://github.com/kitikonti/ownchart/commit/9c238beb72d9e8f577a55f600e744e344be2b4a2))
* **review:** address review findings in computeTaskColor, taskBarDragHelpers, taskTypeUtils, svgCoords ([f12ee19](https://github.com/kitikonti/ownchart/commit/f12ee190f887a44a1e5473f8b0a487eb67c99f3b))
* **review:** address review findings in export utility files ([1650ef3](https://github.com/kitikonti/ownchart/commit/1650ef30fa8b3088a359fb19fce749d42b9c4446))
* **review:** address review findings in graphHelpers ([76caab9](https://github.com/kitikonti/ownchart/commit/76caab95689d91869818ad5a559b7f6fcc14f7fc))
* **review:** address review findings in HelpTopicCard and ToolbarDropdown ([9518d5e](https://github.com/kitikonti/ownchart/commit/9518d5e5264d1233c234c0d72f66f56d70c9cc87))
* **review:** address review findings in HelpTopicCard, DropdownTrigger, ToolbarDropdown, Alert, GettingStartedTab, HelpSectionList ([a1e21d1](https://github.com/kitikonti/ownchart/commit/a1e21d1037321bd7322afca8898e6112f42beba1))
* **review:** address review findings in hooks ([b53d625](https://github.com/kitikonti/ownchart/commit/b53d6259b3230c1df427ec449a037d0e9a6b1932))
* **review:** address review findings in hooks ([d77ed15](https://github.com/kitikonti/ownchart/commit/d77ed155b4ff2d632e863232e29efb8621864447))
* **review:** address review findings in hooks batch 09 ([9dfeab5](https://github.com/kitikonti/ownchart/commit/9dfeab501d43547393736b96b8b81142dec64565))
* **review:** address review findings in hooks batch 09 ([c544566](https://github.com/kitikonti/ownchart/commit/c5445662f229c519b3f5409cd25504bdfb55480a))
* **review:** address review findings in hooks batch 09a ([0e10947](https://github.com/kitikonti/ownchart/commit/0e1094710fd5223cf3769c2b2f147816b5ff7b14))
* **review:** address review findings in hooks batch 09a ([2ef9df9](https://github.com/kitikonti/ownchart/commit/2ef9df94970746b771502c2ae6ae9fa87ddc1387))
* **review:** address review findings in hooks batch 09a ([34866d1](https://github.com/kitikonti/ownchart/commit/34866d143b2515d9eeef86b47c076b146924f41f))
* **review:** address review findings in new hooks batch ([08b99af](https://github.com/kitikonti/ownchart/commit/08b99af35e0257b0abeb21831e1a5a081d545013))
* **review:** address review findings in new hooks batch 03 ([12406d0](https://github.com/kitikonti/ownchart/commit/12406d037e8db9858c70e7015d07e9d16b36512d))
* **review:** address review findings in new hooks batch 03 ([5508940](https://github.com/kitikonti/ownchart/commit/5508940d453c898c67f468a9723ebc81ece91244))
* **review:** address review findings in new hooks batch 03 ([f3cf52a](https://github.com/kitikonti/ownchart/commit/f3cf52ab509ef1d4dad7a8a76c5fd1bf9821cef4))
* **review:** address review findings in new hooks batch 03 ([391c233](https://github.com/kitikonti/ownchart/commit/391c2335405183a1c4ebdea63278dec0767be48e))
* **review:** address review findings in new utils ([7ffebb3](https://github.com/kitikonti/ownchart/commit/7ffebb3e10c310dfc645256e40c844e383c26e00))
* **review:** address review findings in new utils ([5c25eef](https://github.com/kitikonti/ownchart/commit/5c25eef5fb66df9f856b0cec19444cf11eb87d58))
* **review:** address review findings in new utils (iteration 4) ([addd85a](https://github.com/kitikonti/ownchart/commit/addd85a09bdaf7da5ff74ceeafbbe51bae07b0fa))
* **review:** address review findings in new utils batch ([fa9f851](https://github.com/kitikonti/ownchart/commit/fa9f851fe3e9857b5aeb16c83381ff60b3e268aa))
* **review:** address review findings in new utils batch ([6274379](https://github.com/kitikonti/ownchart/commit/627437924663b824a482c961594f2b94ddf6dcc9))
* **review:** address review findings in prepareRowPaste ([64325a6](https://github.com/kitikonti/ownchart/commit/64325a67fa41db74c0a24e6e0e511ef7c37c3050))
* **review:** address review findings in prepareRowPaste and compare ([b3a3380](https://github.com/kitikonti/ownchart/commit/b3a33807cee2bf6bd9e259d24320cc337a16bd58))
* **review:** address review findings in prepareRowPaste and compare ([b722a20](https://github.com/kitikonti/ownchart/commit/b722a20971ea6c022614679b10fb64a17e16e629))
* **review:** address review findings in prepareRowPaste and compare ([5f7ac23](https://github.com/kitikonti/ownchart/commit/5f7ac23515ec29d51025ae78ed35326a8a721146))
* **review:** address review findings in RadioOptionCard, Checkbox, LabeledCheckbox ([fffb09e](https://github.com/kitikonti/ownchart/commit/fffb09e8690acc4788c0b0810c25e7743dcaf229))
* **review:** address review findings in RadioOptionCard, Checkbox, LabeledCheckbox ([b67e9e5](https://github.com/kitikonti/ownchart/commit/b67e9e59c190334a699e67ba87474353b6976469))
* **review:** address review findings in RadioOptionCard, Checkbox, LabeledCheckbox, DropdownPanel ([9c79ae4](https://github.com/kitikonti/ownchart/commit/9c79ae4070255a23748056cc228d8fab5c49f2e8))
* **review:** address review findings in RadioOptionCard, Radio, Checkbox, MobileBlockScreen, DropdownPanel, LabeledCheckbox ([170a5ba](https://github.com/kitikonti/ownchart/commit/170a5ba63922fd642741d62bc43be5a9c7ee3e54))
* **review:** address review findings in timeline/progress/ribbon/dropdown/autoColumn hooks ([e2fbb4b](https://github.com/kitikonti/ownchart/commit/e2fbb4bb2e3f3115c6f09f4b62868fa9120c1443))
* **review:** address review findings in ui common components ([f7aa3be](https://github.com/kitikonti/ownchart/commit/f7aa3be5a99359a14e4c3c49e0cd22184978a430))
* **review:** address review findings in UI common components ([35ca475](https://github.com/kitikonti/ownchart/commit/35ca47543541dd9bbe6442fef0c6129067818b09))
* **review:** address review findings in UI common components ([1687e9c](https://github.com/kitikonti/ownchart/commit/1687e9c7d1cf3a8fc6716f7b3dac561fb644790e))
* **review:** address review findings in UI common components ([f62981e](https://github.com/kitikonti/ownchart/commit/f62981ed0c33eeea94b661784e5b5226d9ee8efb))
* **review:** address review findings in UI common components ([cfc8740](https://github.com/kitikonti/ownchart/commit/cfc8740e1ea30dd9a7cf7c7109597ed96e88302f))
* **review:** address review findings in UI common components ([600f19b](https://github.com/kitikonti/ownchart/commit/600f19bcc53100b3c4d005a383d1934007f1b850))
* **review:** address review findings in UI common components ([a2130e6](https://github.com/kitikonti/ownchart/commit/a2130e67f82215b9a6f6f5fee8071d2ff6ffa40b))
* **review:** address review findings in UI common components ([0c4db22](https://github.com/kitikonti/ownchart/commit/0c4db22a9abe5465553d9d3ad31cf019e110c434))
* **review:** address review findings in UI common components ([313a385](https://github.com/kitikonti/ownchart/commit/313a3851e879bf24fbea8aec0653e6ad0a6def5b))
* **review:** address review findings in UI common components ([56b0447](https://github.com/kitikonti/ownchart/commit/56b0447afe04b6bded8c66f7857fed9603f89ea7))
* **review:** address review findings in UI components ([9243904](https://github.com/kitikonti/ownchart/commit/9243904b7eb2248a3e776953b45523bbc894e668))
* **review:** address review findings in UI components ([75d9795](https://github.com/kitikonti/ownchart/commit/75d9795d2305377bc9e4a03bf1923138d1c04450))
* **review:** address review findings in UI components ([f8161bb](https://github.com/kitikonti/ownchart/commit/f8161bb705ec5ab3e98f07151784a794cf304678))
* **review:** address review findings in UI components ([1277ae2](https://github.com/kitikonti/ownchart/commit/1277ae2de462cc03ae9c4960e5f0b15e801a54fa))
* **review:** address review findings in UI components ([590e736](https://github.com/kitikonti/ownchart/commit/590e7366fe880498ff9f96d53795c26c88dea54b))
* **review:** address review findings in UI components ([dc07dcf](https://github.com/kitikonti/ownchart/commit/dc07dcff3467877e4b8f76f48f17402cb8862b4a))
* **review:** address review findings in ui-components-04b ([359f64c](https://github.com/kitikonti/ownchart/commit/359f64c603d88147764774e97cf040484e663ecb))
* **review:** address review findings in useExportDialog and useCellEdit ([febe8f9](https://github.com/kitikonti/ownchart/commit/febe8f9f151272e42dfb9e2d0cdcaf8888a45a61))
* **review:** address review findings in useHelpSearch, useDeviceDetection, useProjectColors, useTaskTableRowContextMenu ([b133053](https://github.com/kitikonti/ownchart/commit/b13305394aff988dafaf426286ceb73d59cc12bb))
* **review:** address review findings in useHideOperations and useTaskRowData ([9be77b6](https://github.com/kitikonti/ownchart/commit/9be77b6d1fc77c1ffaa9685ff1cfb940814d932b))
* **review:** address review findings in useHideOperations, useTableHeaderContextMenu ([daf9330](https://github.com/kitikonti/ownchart/commit/daf9330d721089f211206e210ecc287f90375c5d))
* **review:** address review findings in useHideOperations, useTaskRowData, useTableHeaderContextMenu ([8278b55](https://github.com/kitikonti/ownchart/commit/8278b5514e6644f95e8c83efd86204de2dc58ecf))
* **review:** address review findings in useHideOperations, useTaskRowData, useTableHeaderContextMenu ([c89506a](https://github.com/kitikonti/ownchart/commit/c89506a16832bde274dc99fafd8a3cd659fcb906))
* **review:** address review findings in useHideOperations, useTaskRowData, useTableHeaderContextMenu ([556a8dd](https://github.com/kitikonti/ownchart/commit/556a8dde28197cc7f8258eb82e03af6b70a39c64))
* **review:** address review findings in useHideOperations, useTaskRowData, useTableHeaderContextMenu ([56a1c98](https://github.com/kitikonti/ownchart/commit/56a1c983204ac48a4f97884b92ed779afc12b82d))
* **review:** address review findings in useHideOperations, useTaskRowData, useTableHeaderContextMenu ([6d3dd40](https://github.com/kitikonti/ownchart/commit/6d3dd40005d4923329d243d845ddaed6a5ccb109))
* **review:** address review findings in useHomeTabActions, usePlaceholderNameEdit, useInfiniteScroll ([03fd02e](https://github.com/kitikonti/ownchart/commit/03fd02e6a308818751bb9554afcfd140abe96af3))
* **review:** address review findings in useHomeTabActions, usePlaceholderNameEdit, useInfiniteScroll, useViewTabActions ([69b0198](https://github.com/kitikonti/ownchart/commit/69b01989021a77c220849723fc90e418de47511b))
* **review:** address review findings in useHomeTabActions, usePlaceholderNameEdit, useInfiniteScroll, useViewTabActions ([5f575bb](https://github.com/kitikonti/ownchart/commit/5f575bbfbb0b2aa5a013552c974781fb513fff01))
* **review:** address review findings in useHomeTabActions, useViewTabActions, and useInfiniteScroll ([a289b1e](https://github.com/kitikonti/ownchart/commit/a289b1ece98196784f49d747edf07c64afcf14b0))
* **review:** address review findings in useInfiniteScroll, usePlaceholderNameEdit, useViewTabActions ([46079b1](https://github.com/kitikonti/ownchart/commit/46079b10ecf76a348ebdc3de4b0d634f608c6d55))
* **review:** address review findings in useTableHeaderContextMenu and useTaskRowData ([00a1441](https://github.com/kitikonti/ownchart/commit/00a1441f20562bac9a9f88a542e53e7554f69588))
* **review:** address review findings in useViewTabActions, usePlaceholderNameEdit, useInfiniteScroll ([27d7f48](https://github.com/kitikonti/ownchart/commit/27d7f486c9233339373f001f3ce0ab00a99e6bf8))
* **review:** clarify comments and add [@internal](https://github.com/internal) annotations in export utils ([7d05327](https://github.com/kitikonti/ownchart/commit/7d05327026977e61dd5f517e33ae0f855a7ac352))
* **review:** clean up export utils from code review findings ([08c5803](https://github.com/kitikonti/ownchart/commit/08c58033c31717f5943c9f660889627fb34e53af))
* **review:** document pointer-queue trade-off in bfsReachable ([9b4070b](https://github.com/kitikonti/ownchart/commit/9b4070b9f261eafaac157685c4ea58f40c061f0a))
* **review:** document singleton guard reset behaviour in useLaunchQueue ([d2c4c0b](https://github.com/kitikonti/ownchart/commit/d2c4c0b432a13ee668f302f84980f468cd216a29))
* **review:** extract applyTaskTypeColor helper in computeTaskColor ([7ef9033](https://github.com/kitikonti/ownchart/commit/7ef903360af8d5e3ed82daf38087a02f44a1592f))
* **review:** extract buildLayoutParts helper and improve export utils ([64500ad](https://github.com/kitikonti/ownchart/commit/64500ada339abc1f983ce5fb26286a1c1f9bc72b))
* **review:** extract helpers to reduce function length, add JSDoc ([06828e9](https://github.com/kitikonti/ownchart/commit/06828e90a192f0f9bcd9ee2a46f9607e56628639))
* **review:** extract helpers, add types and docs in utils ([9614c34](https://github.com/kitikonti/ownchart/commit/9614c341e35828ebb4e16c0da3f262540140038e))
* **review:** extract resolveInsertContext and fix misleading cycle-detection comment ([770c34b](https://github.com/kitikonti/ownchart/commit/770c34b69c29605830f59e1385406a9e7a37f8f8))
* **review:** extract shared formVariantClasses, remove redundant guard in RowOverlays ([249976f](https://github.com/kitikonti/ownchart/commit/249976f1ad7c055d5c78d347bb699e29e186c3f0))
* **review:** extract shared helper in cellStyles, add getEditingCellStyle tests ([54127e0](https://github.com/kitikonti/ownchart/commit/54127e0f804db82092b1c1ac2ce26394a9164c66))
* **review:** extract shared helper to deduplicate adjacency list builders in graphHelpers ([8b23207](https://github.com/kitikonti/ownchart/commit/8b2320732a264f15a7391971baa47cc8813bcbd0))
* **review:** fix import order and hoist sentinel constant in hooks ([dfe126b](https://github.com/kitikonti/ownchart/commit/dfe126bf3f634acaea18e745a4f4a6869326189a))
* **review:** improve comments in export utils ([b1d15f4](https://github.com/kitikonti/ownchart/commit/b1d15f4d14d06fbe715f64e28c7f70a653b6a3b6))
* **review:** improve docs and code clarity in export utils ([255bb3c](https://github.com/kitikonti/ownchart/commit/255bb3c5f8f8863d41ac1e6869d78ed0fb14cbc8))
* **review:** improve documentation in useDocumentTitle and useUnsavedChanges ([b2917e5](https://github.com/kitikonti/ownchart/commit/b2917e5667cf0fcc540a15665432dc1bf6935d93))
* **review:** improve JSDoc clarity in graphHelpers ([b183488](https://github.com/kitikonti/ownchart/commit/b183488174a4cc2bce2d85aa1b607a7716d19417))
* **review:** improve robustness and docs in hooks batch 09a ([8660cc0](https://github.com/kitikonti/ownchart/commit/8660cc01ba44fbf101bb3f03a4fbd9c3747646bc))
* **review:** improve robustness in useLaunchQueue and useUnsavedChanges ([2f5fd7e](https://github.com/kitikonti/ownchart/commit/2f5fd7e978c671ddceb23e0380e0d13cb21c6f3d))
* **review:** improve type robustness in task.types and branded.types ([7bb7b1c](https://github.com/kitikonti/ownchart/commit/7bb7b1c56ec03dd444a232970573eaad33e95129))
* **review:** minor documentation and import-grouping polish in hooks batch 09a ([b339c46](https://github.com/kitikonti/ownchart/commit/b339c46fbfaddf75c3ce364b5793d4f1f5e916de))
* **review:** reduce long parameter lists in export layout utils ([fc0ffcb](https://github.com/kitikonti/ownchart/commit/fc0ffcb25771dbfa24a4db8eced405fa9e2b260c))
* **review:** rename MILESTONE_GOLD to DEFAULT_MILESTONE_COLOR for naming consistency ([0a8fc86](https://github.com/kitikonti/ownchart/commit/0a8fc864f618ac9bd9a0aff91836f8e92cc55286))
* **review:** tighten JSDoc, comments and import order in export utils ([09c8637](https://github.com/kitikonti/ownchart/commit/09c863785a4477545f8e6284bc994a0a85078d56))
* **review:** trim buildLayoutParts to under 50 lines ([78e1bbf](https://github.com/kitikonti/ownchart/commit/78e1bbf5aa4a97636a6c0017f1ac739c904c235a))
* **toolbar:** stabilize handleKeyDown with useCallback, fix JSX.Element types, add aria-label dev warning ([af7bbfb](https://github.com/kitikonti/ownchart/commit/af7bbfbf75fa78fa8e6e047f28e35bde02f43945))
* **ui:** move dev warning out of render path and add button type ([0f70e75](https://github.com/kitikonti/ownchart/commit/0f70e7525343142327e324c77383902a01688564))
* **useCellEdit:** import MutableRefObject directly instead of via React namespace ([31841c5](https://github.com/kitikonti/ownchart/commit/31841c5490a2ab25d4cc46f2515108d8f1df3829))

## [1.2.3](https://github.com/kitikonti/ownchart/compare/v1.2.2...v1.2.3) (2026-03-09)


### Bug Fixes

* **review:** address review findings in types and pdfLayout ([f14e6f9](https://github.com/kitikonti/ownchart/commit/f14e6f9c4778ef5a89b6f00bdf05b794bbc25182))


### Code Refactoring

* **review:** add JSDoc to AppInner and AppContent in App.tsx ([fccb6ce](https://github.com/kitikonti/ownchart/commit/fccb6ce32e094bfd16a3be02841100ef10dc5387))
* **review:** address review findings in App, main, and vite-env ([3d31e5c](https://github.com/kitikonti/ownchart/commit/3d31e5cf6ebd19869ab2f6eeb3307530d6c3e68c))
* **review:** address review findings in App, main, and vite-env ([db06de1](https://github.com/kitikonti/ownchart/commit/db06de15c14cfe35f84a0d3378e1b7454d32e30b))
* **review:** address review findings in App, main, and vite-env ([7dea3aa](https://github.com/kitikonti/ownchart/commit/7dea3aafa69adec49b7bb07b43272262bea01632))
* **review:** address review findings in App.tsx and design-tokens ([1fcd190](https://github.com/kitikonti/ownchart/commit/1fcd190bae75c391b5a003203c2140a115470fd7))
* **review:** address review findings in App.tsx, main.tsx, and vite-env.d.ts ([2f6b3da](https://github.com/kitikonti/ownchart/commit/2f6b3dafaabbc12972ac16b05523aac2b5b8c1ce))
* **review:** address review findings in contextMenuItemBuilders, useZoom, and useFullTaskContextMenuItems ([61bbc99](https://github.com/kitikonti/ownchart/commit/61bbc99773e736191563828b0234eb84b60ddc8e))
* **review:** address review findings in contextMenuItemBuilders, useZoom, useFullTaskContextMenuItems ([c66a548](https://github.com/kitikonti/ownchart/commit/c66a548fc94416bc725b2e4481fb028a922edbcb))
* **review:** address review findings in contextMenuItemBuilders, useZoom, useFullTaskContextMenuItems ([ba334e6](https://github.com/kitikonti/ownchart/commit/ba334e601c28c4f87b452e68a4d79e625d90e9ff))
* **review:** address review findings in contextMenuItemBuilders, useZoom, useFullTaskContextMenuItems ([727373b](https://github.com/kitikonti/ownchart/commit/727373b47de9e224bfe067f5e6350dd74cbe1416))
* **review:** address review findings in contextMenuItemBuilders, useZoom, useFullTaskContextMenuItems ([1959383](https://github.com/kitikonti/ownchart/commit/19593831630b10d0ab2605163e6af7b8da515484))
* **review:** address review findings in contextMenuItemBuilders, useZoom, useFullTaskContextMenuItems ([5da96f7](https://github.com/kitikonti/ownchart/commit/5da96f7396f3a6fb06a2348a7c6eaa1ce9377a45))
* **review:** address review findings in types and pdfLayout ([1eeb5e9](https://github.com/kitikonti/ownchart/commit/1eeb5e9e1619d9866c7ad2d11ec3a60e5541d552))
* **review:** address review findings in types and pdfLayout ([d943143](https://github.com/kitikonti/ownchart/commit/d943143535200012141b3c5d274efc301fb1a3dd))
* **review:** address review findings in types and pdfLayout ([3c83ade](https://github.com/kitikonti/ownchart/commit/3c83ade6f5a8bad756a58318ed6610035336a534))
* **review:** address review findings in types and pdfLayout ([242886a](https://github.com/kitikonti/ownchart/commit/242886a1b1a9e404f00e1af3f6e9ad51b8055ccc))
* **review:** address review findings in types and pdfLayout ([c2f6976](https://github.com/kitikonti/ownchart/commit/c2f697601b6bb51dba9fd51d4fa12b2d899f5176))
* **review:** address review findings in types and pdfLayout ([71495b1](https://github.com/kitikonti/ownchart/commit/71495b1e21648b3911271d90fe91fa79902a22ff))
* **review:** address review findings in types and pdfLayout ([7ae2f68](https://github.com/kitikonti/ownchart/commit/7ae2f680511b1aecdbb6e5c235664e7edfe95261))
* **review:** address review findings in types.ts and pdfLayout.ts ([f3d8209](https://github.com/kitikonti/ownchart/commit/f3d8209394adfafb5adf777d264b1df0862dacf2))
* **review:** address review findings in ui components ([3f0c3bd](https://github.com/kitikonti/ownchart/commit/3f0c3bd2fa87bf8eac141c58fa9bfac456443c72))
* **review:** address review findings in useZoom ([5a84a72](https://github.com/kitikonti/ownchart/commit/5a84a72d398c6614c7851c3f813710af607768d9))
* **review:** address review findings in useZoom and useFullTaskContextMenuItems ([5c56e87](https://github.com/kitikonti/ownchart/commit/5c56e876a79e62d3165e47f3ddbcb4665097c753))
* **review:** address review findings in WelcomeTour and AboutDialog ([6860e3e](https://github.com/kitikonti/ownchart/commit/6860e3e53b51635886cc2b78272a6c071de33bb1))
* **review:** address review findings in WelcomeTour and Button ([dcab221](https://github.com/kitikonti/ownchart/commit/dcab221c144ade2de77a7bfe90378ff90df7f9e4))
* **review:** address review findings in WelcomeTour and ZoomDialog ([5bf0054](https://github.com/kitikonti/ownchart/commit/5bf005420c611079eba922e495b1c9feaac18aee))
* **review:** address review findings in WelcomeTour, AboutDialog, and ZoomDialog ([7680bcc](https://github.com/kitikonti/ownchart/commit/7680bcc6d8ab62b9c5144abe6637858a39548d26))
* **review:** address review findings in WelcomeTour, AboutDialog, Button, ZoomDialog ([504ec29](https://github.com/kitikonti/ownchart/commit/504ec29f9f6ee2561e439fdb8dc05a6f28314b26))
* **review:** address review findings in WelcomeTour, AboutDialog, Button, ZoomDialog, DropdownItem ([750b9e9](https://github.com/kitikonti/ownchart/commit/750b9e919a2caeec7605a64087da9ac561662224))
* **review:** address review findings in WelcomeTour, AboutDialog, Button, ZoomDialog, DropdownItem ([ba58710](https://github.com/kitikonti/ownchart/commit/ba5871082d3e897cda15c9cb1ac7e78b94aeeb22))
* **review:** address review findings in WelcomeTour, AboutDialog, Button, ZoomDialog, DropdownItem ([642282d](https://github.com/kitikonti/ownchart/commit/642282d4ea92ba2d7c8c31aa29526f932e2b6136))
* **review:** address review findings in WelcomeTour, AboutDialog, Button, ZoomDialog, DropdownItem ([735160a](https://github.com/kitikonti/ownchart/commit/735160ae669154d767f40d6374eaf84477fc87fb))
* **review:** address review findings in WelcomeTour, AboutDialog, Button, ZoomDialog, DropdownItem ([fe6b449](https://github.com/kitikonti/ownchart/commit/fe6b449ad29baaa4b1c94c8c99de2a69f830c61e))
* **review:** address review findings in WelcomeTour, AboutDialog, Button, ZoomDialog, DropdownItem ([8459291](https://github.com/kitikonti/ownchart/commit/8459291def3d49eabae259a89f3016385b008436))
* **review:** address review findings in WelcomeTour, AboutDialog, Button, ZoomDialog, DropdownItem ([4a6046e](https://github.com/kitikonti/ownchart/commit/4a6046e8154121f53c3e4008a69392d1f888b15f))
* **review:** address review findings in WelcomeTour, AboutDialog, Button, ZoomDialog, DropdownItem ([2e856c1](https://github.com/kitikonti/ownchart/commit/2e856c105423b7707146dd3b0e6a156bde01da2e))
* **review:** address review findings in WelcomeTour, AboutDialog, Button, ZoomDialog, DropdownItem ([cff0e66](https://github.com/kitikonti/ownchart/commit/cff0e660e0f0531d616dce811e08cafb9b0c4674))
* **review:** address review findings in WelcomeTour, AboutDialog, Button, ZoomDialog, DropdownItem ([621c64a](https://github.com/kitikonti/ownchart/commit/621c64a219ea2c0cc0ad59edb8cd7a0e35433d43))
* **review:** address review findings in WelcomeTour, AboutDialog, Button, ZoomDialog, DropdownItem ([da414c1](https://github.com/kitikonti/ownchart/commit/da414c148bdd406120289616b2c2d3249fdb4d47))
* **review:** address review findings in WelcomeTour, AboutDialog, Button, ZoomDialog, DropdownItem ([77a564e](https://github.com/kitikonti/ownchart/commit/77a564ed4fc20323fcc49102ddb607aacc3a1702))
* **review:** address review findings in ZoomDialog and DropdownItem ([5bcb4b8](https://github.com/kitikonti/ownchart/commit/5bcb4b88bfa82c85bf6321d94c0eb8cc38b1d842))
* **review:** extract compensateForTallContent helper in pdfLayout ([2ab9d99](https://github.com/kitikonti/ownchart/commit/2ab9d99878ffb04c4ce59dbc6cf4ee3cb97cef56))
* **review:** improve comments in types.ts and pdfLayout.ts ([0cddaab](https://github.com/kitikonti/ownchart/commit/0cddaab1d1173e559900fbb1958e5ae0678d18cf))
* **review:** move runtime presets out of types.ts into pagePresets.ts ([4de0874](https://github.com/kitikonti/ownchart/commit/4de087475ea312fc4e87925cd2e56fb8c712120b))

## [1.2.2](https://github.com/kitikonti/ownchart/compare/v1.2.1...v1.2.2) (2026-03-08)


### Bug Fixes

* **review:** address a11y and clarity issues in ContextMenu, Modal, HelpDialog ([dcca54a](https://github.com/kitikonti/ownchart/commit/dcca54a3768f74e451be3af058071848f159e153))
* **review:** address review findings in ContextMenu, Modal, and HelpDialog ([16f3092](https://github.com/kitikonti/ownchart/commit/16f3092a48b4d69cfb330738b5b160566bee6d46))
* **review:** address review findings in ContextMenu, Modal, and HelpDialog ([562846a](https://github.com/kitikonti/ownchart/commit/562846a9c8a74d46e82547672d9eeafc85426087))
* **review:** address review findings in ContextMenu, Modal, HelpDialog ([d09f898](https://github.com/kitikonti/ownchart/commit/d09f898a6519d6e54c83d2e6ab49018eb9078e35))
* **review:** address review findings in ContextMenu, Modal, HelpDialog ([8951300](https://github.com/kitikonti/ownchart/commit/895130071d761a3979af19a7c817582647e55b7b))
* **review:** address review findings in ContextMenu, Modal, HelpDialog ([0d9eb1b](https://github.com/kitikonti/ownchart/commit/0d9eb1b641ff0687abb26f9231ccb7628fe7c920))
* **review:** address review findings in ContextMenu, Modal, HelpDialog ([e474db6](https://github.com/kitikonti/ownchart/commit/e474db6ad48256c2f101fc090dad24770b557762))
* **review:** address review findings in ContextMenu, Modal, HelpDialog ([0ffa542](https://github.com/kitikonti/ownchart/commit/0ffa5426948d96135dac1a0ad7bc7cc20821469b))
* **review:** address review findings in ContextMenu, Modal, HelpDialog ([4ee38b5](https://github.com/kitikonti/ownchart/commit/4ee38b543fc44474c679203874e1d2d61e943169))
* **review:** address review findings in ContextMenu, Modal, HelpDialog ([1d87f68](https://github.com/kitikonti/ownchart/commit/1d87f682fad659f056dcc421d40e35fb598d210e))
* **review:** address review findings in ContextMenu, Modal, HelpDialog ([3d22914](https://github.com/kitikonti/ownchart/commit/3d229147218d10a833fb7b8ae36041d93e243db3))
* **review:** address review findings in holidayService ([482e712](https://github.com/kitikonti/ownchart/commit/482e712e27d16a86775046850edb313232b288b5))
* **review:** address review findings in holidayService and config files ([f23a173](https://github.com/kitikonti/ownchart/commit/f23a1734e7de91e1651b2bf04bb7c2438b73afdb))
* **review:** address review findings in holidayService and config files ([592cc88](https://github.com/kitikonti/ownchart/commit/592cc8869c4d82dfc4dd575267fc9af6ebcc9b41))
* **review:** address review findings in holidayService and preferencesOptions ([87552bc](https://github.com/kitikonti/ownchart/commit/87552bc0891b00484c669142874a8eaf7bce725e))
* **review:** address review findings in holidayService and preferencesOptions ([4887872](https://github.com/kitikonti/ownchart/commit/4887872c9ba625153df09bd079012f176b63593e))
* **review:** address review findings in holidayService, appConfig, preferencesOptions, version ([1ab88c6](https://github.com/kitikonti/ownchart/commit/1ab88c62e736533002f1dfcf4eabdf0ebc0dc0ab))
* **review:** address review findings in svgExport and renderConstants ([f952d3f](https://github.com/kitikonti/ownchart/commit/f952d3f612d64fdb6364621a95a1981d1ac9ed37))
* **review:** address review findings in svgExport and renderConstants ([c9740af](https://github.com/kitikonti/ownchart/commit/c9740af12ef473c982ea287d304e31cfc0bd6436))
* **review:** address review findings in svgExport and renderConstants ([e8405f1](https://github.com/kitikonti/ownchart/commit/e8405f1558282218bb6652334239d52342783e72))
* **review:** address review findings in svgExport and renderConstants ([c3de5b9](https://github.com/kitikonti/ownchart/commit/c3de5b9d0c7b158c6824bda1b289f9991beab3fe))
* **review:** remove unnecessary async from handleNew in useFileOperations ([f6c3baf](https://github.com/kitikonti/ownchart/commit/f6c3baf7fd1badb1e1374787f2e44a217fe06dd5))
* **review:** strip file extension from end to avoid mid-name replacement ([56b9c73](https://github.com/kitikonti/ownchart/commit/56b9c73dfbcdbffde5ae682162c8ac03f86b0f1c))


### Code Refactoring

* **review:** address review findings in ContextMenu, Modal, HelpDialog ([3e5fe79](https://github.com/kitikonti/ownchart/commit/3e5fe790f47ddb893be2d2a3cef65306f83a9420))
* **review:** address review findings in holidayService and preferencesOptions ([448b0e1](https://github.com/kitikonti/ownchart/commit/448b0e1cfa114637ec88e756412c23d40ba6d7d0))
* **review:** address review findings in svgExport and renderConstants ([343d471](https://github.com/kitikonti/ownchart/commit/343d47134865bc9fd8768007b7610d4b10e799a2))
* **review:** address review findings in svgExport and renderConstants ([3eeb5aa](https://github.com/kitikonti/ownchart/commit/3eeb5aae63db6b6f8c72723d8e6a1f00a63a29f7))
* **review:** address review findings in svgExport and renderConstants ([6056e05](https://github.com/kitikonti/ownchart/commit/6056e0573981965e52a21b4b0ac7410a835951a4))
* **review:** address review findings in svgExport and renderConstants ([d1baa7f](https://github.com/kitikonti/ownchart/commit/d1baa7f85cfd20666368bcfc10f07526a52ffab5))
* **review:** address review findings in svgExport and renderConstants ([b2deb20](https://github.com/kitikonti/ownchart/commit/b2deb20888cef6164358644416a20853269b6fd6))
* **review:** address review findings in svgExport and renderConstants ([1cf203f](https://github.com/kitikonti/ownchart/commit/1cf203f06f4a230ce8b5d9e2a6cb0eb3c8dc6362))
* **review:** address review findings in svgExport and renderConstants ([91495b0](https://github.com/kitikonti/ownchart/commit/91495b051240311c48a47864aab343a50f2c47ff))
* **review:** apply parameter-object pattern and improve clipboard debug logging ([8974ce3](https://github.com/kitikonti/ownchart/commit/8974ce3ac8bdc52334a3db2a4ea8eccd5bb73f4b))
* **review:** apply review fixes in holidayService, preferencesOptions, appConfig, version ([e0bbede](https://github.com/kitikonti/ownchart/commit/e0bbedead4491ea49fb05793c7b6227986c0a9eb))
* **review:** apply review fixes to ContextMenu, Modal, HelpDialog ([eb545e7](https://github.com/kitikonti/ownchart/commit/eb545e7a6b5c4551e91e610c1cdb961ba74843d2))
* **review:** apply review fixes to holidayService and appConfig ([20caf4c](https://github.com/kitikonti/ownchart/commit/20caf4cd058fc85281f99a5e2fe05d17c969ee80))
* **review:** apply review fixes to holidayService and config files ([558c90b](https://github.com/kitikonti/ownchart/commit/558c90ba4fe878c879ea00fcd32dc1faa86f004c))
* **review:** apply review fixes to holidayService and preferencesOptions ([0064002](https://github.com/kitikonti/ownchart/commit/0064002c2a04d696202f0923e1d995fa31f92c85))
* **review:** apply review fixes to holidayService and preferencesOptions ([c8f5f4a](https://github.com/kitikonti/ownchart/commit/c8f5f4abea745206b51a81ba048797197fe8cc15))
* **review:** apply review fixes to holidayService, appConfig, and version ([2729344](https://github.com/kitikonti/ownchart/commit/2729344ec59d2f5ec6eb0f8b9789e675648dac31))
* **review:** apply review fixes to holidayService, preferencesOptions, appConfig, version ([7e4331f](https://github.com/kitikonti/ownchart/commit/7e4331f18de6a7849097a7252e00ea793fb0ae0d))
* **review:** apply review fixes to holidayService, preferencesOptions, version ([e57e664](https://github.com/kitikonti/ownchart/commit/e57e66456040d0ee39e2bad829507d4411fc9b6d))
* **review:** apply review fixes to useFileOperations, useMarqueeSelection, useClipboardOperations ([e8a4479](https://github.com/kitikonti/ownchart/commit/e8a4479391a95eb6f4ce2368ee6504f8c61f5943))
* **review:** apply review fixes to useFileOperations, useMarqueeSelection, useClipboardOperations ([37b0e41](https://github.com/kitikonti/ownchart/commit/37b0e41abbe9f5c71787fb2421508c6d6749341a))
* **review:** extract magic strings to named constants and improve comments ([5ee52d4](https://github.com/kitikonti/ownchart/commit/5ee52d4066291b501973b70fd4ca248628b18cb5))
* **review:** fix all review findings in holidayService and config files ([6eb91d7](https://github.com/kitikonti/ownchart/commit/6eb91d7a629b614341ee547b39d5fdc6e881c523))
* **review:** improve useFileOperations and useMarqueeSelection robustness ([6ff6449](https://github.com/kitikonti/ownchart/commit/6ff64499c7ef77e461516fb926f47034a60b59f7))
* **review:** improve useFileOperations, useMarqueeSelection, useClipboardOperations ([c8d80ad](https://github.com/kitikonti/ownchart/commit/c8d80ad5530c391a529c3453bc098ae9a984991b))
* **review:** split useViewSettings and clean up dep arrays ([262bfb2](https://github.com/kitikonti/ownchart/commit/262bfb28d7cf61e6e9b3fd066dc64916c945b5cd))

## [1.2.1](https://github.com/kitikonti/ownchart/compare/v1.2.0...v1.2.1) (2026-03-08)


### Code Refactoring

* **export:** fix all review findings in svgExport + renderConstants ([ac84809](https://github.com/kitikonti/ownchart/commit/ac84809e48ab7346418fe05766b46e33172395da))
* **export:** fix all review findings in svgExport + renderConstants ([c49c90b](https://github.com/kitikonti/ownchart/commit/c49c90b20028965a063948b6db1254330260190d))

## [1.2.0](https://github.com/kitikonti/ownchart/compare/v1.1.29...v1.2.0) (2026-03-08)


### Features

* **skills:** add review-loop skill for automated iterative review ([a4650a2](https://github.com/kitikonti/ownchart/commit/a4650a22f8a49d53b7f0e3776066a9707994e788))


### Bug Fixes

* **ui:** address all review findings in ContextMenu, Modal, HelpDialog ([a2b4f62](https://github.com/kitikonti/ownchart/commit/a2b4f62c607701de4bb38cda4ec3ed9f849ce6b0))
* **ui:** address second-pass review findings in ContextMenu, Modal, HelpDialog ([c4dc859](https://github.com/kitikonti/ownchart/commit/c4dc8597c083abeb4444371ae3f797784dd766f5))
* **ui:** fix a11y, focus restoration, and code quality in ContextMenu, Modal, HelpDialog ([65cb923](https://github.com/kitikonti/ownchart/commit/65cb923099e00623fdf0098fe3226a3cf106399f))


### Code Refactoring

* apply review fixes to useFileOperations, useMarqueeSelection, useClipboardOperations ([e46380e](https://github.com/kitikonti/ownchart/commit/e46380e51bab99c632585ca95bc8915c34db42e7))
* apply review fixes to useFileOperations, useMarqueeSelection, useClipboardOperations ([af0f5aa](https://github.com/kitikonti/ownchart/commit/af0f5aa48bda9a753ed34a81b3f691c11ddcaa56))
* apply review fixes to useFileOperations, useMarqueeSelection, useClipboardOperations ([2a61484](https://github.com/kitikonti/ownchart/commit/2a61484d7b628fbc1352b8b48b1ca8feff8be1ac))
* improve useFileOperations, useMarqueeSelection, useClipboardOperations ([010c1a9](https://github.com/kitikonti/ownchart/commit/010c1a9961070253aa886494c53fac298c480d79))
* improve useFileOperations, useMarqueeSelection, useClipboardOperations ([50dd55c](https://github.com/kitikonti/ownchart/commit/50dd55c54123ab3a35acd162000f35ffc401e57f))

## [1.1.29](https://github.com/kitikonti/ownchart/compare/v1.1.28...v1.1.29) (2026-03-06)


### Bug Fixes

* **helpContent:** replace VIEW_COLUMNS/VIEW_TABLE shortcuts with menuPath ([3625149](https://github.com/kitikonti/ownchart/commit/3625149ad338d41dc4290988b976ee0c1873c4b2))


### Code Refactoring

* **helpContent:** apply F001–F005 review fixes and future-proof hardening ([a0d6757](https://github.com/kitikonti/ownchart/commit/a0d6757d56ecb5b65dd2e5930845fd66c98e4fa8))
* **helpContent:** apply review fixes and future-proof hardening ([78103be](https://github.com/kitikonti/ownchart/commit/78103be08707f44bf90d98c0a64d55cc146d6002))
* **helpContent:** harden config file from code review (F001–F006) ([b003b57](https://github.com/kitikonti/ownchart/commit/b003b57e52215bbd7a3b5e4ea2734f51bfb3e931))

## [1.1.28](https://github.com/kitikonti/ownchart/compare/v1.1.27...v1.1.28) (2026-03-06)


### Bug Fixes

* use exit code 2 in PostToolUse hook to surface message to Claude ([43246c6](https://github.com/kitikonti/ownchart/commit/43246c6b1c87b47f720bd096219c9ef97cc126bc))


### Code Refactoring

* fix all review findings F001–F004 in taskTableRenderer ([dec74f7](https://github.com/kitikonti/ownchart/commit/dec74f715fa4f5ddce8b9625f31f535bf663ff88))
* fix F002 — group ColorModeState import with other type imports ([2afc910](https://github.com/kitikonti/ownchart/commit/2afc9107c9b053841ffb7fbb9d8fd8861318e4c0))
* harden taskTableRenderer — fix all review findings F001–F005 ([1cee430](https://github.com/kitikonti/ownchart/commit/1cee430d17cd69d26df902cf14d61590a608deb4))
* harden taskTableRenderer — fix all review findings F001–F006 ([56159dc](https://github.com/kitikonti/ownchart/commit/56159dcdb93d90335dbb458831ef58d7fbf9345b))
* harden taskTableRenderer — fix all review findings F001–F007 ([e2bf72c](https://github.com/kitikonti/ownchart/commit/e2bf72c4e70ba598f5e1eaddd8d24dcc11f7085a))
* harden taskTableRenderer — fix all review findings F001–F008 ([c2e32ee](https://github.com/kitikonti/ownchart/commit/c2e32ee2bfa16d799ff0421173c8a727caa20f60))
* harden taskTableRenderer — fix all review findings F001–F008 ([5759e6e](https://github.com/kitikonti/ownchart/commit/5759e6e94223c2bee144906a3a263aa8f5ac8edc))

## [1.1.27](https://github.com/kitikonti/ownchart/compare/v1.1.26...v1.1.27) (2026-03-06)


### Bug Fixes

* split chained commands before checking for --abort in PostToolUse hook ([b1386e6](https://github.com/kitikonti/ownchart/commit/b1386e639710579777a9709cbc6cbe5413234600))


### Code Refactoring

* eliminate inline styles from ToolbarButton and StatusBar ([be7cfbc](https://github.com/kitikonti/ownchart/commit/be7cfbcbaedc43cd6554d3b1154071b57fba5c48))
* fix a11y live region in StatusBar, enforce ToolbarGroup label, add tests ([a2dc959](https://github.com/kitikonti/ownchart/commit/a2dc95988cfb2fc6c17b8665e5226b1c48f6cce3))
* fix a11y, memo, and type safety in ToolbarPrimitives and StatusBar ([4f5b133](https://github.com/kitikonti/ownchart/commit/4f5b13341770f7befc828efd22f8f1a31c814ba1))
* fix title spread bug in ToolbarButton, rename Sep, strengthen tests ([2a9f84e](https://github.com/kitikonti/ownchart/commit/2a9f84e24c17cfe60dab74d9fcb094b6107be2de))
* improve ToolbarPrimitives and StatusBar after code review ([22d97ed](https://github.com/kitikonti/ownchart/commit/22d97edf0358535a4c68dd1c64433362a1b15679))

## [1.1.26](https://github.com/kitikonti/ownchart/compare/v1.1.25...v1.1.26) (2026-03-06)


### Code Refactoring

* harden date/locale/svg utils for type safety and performance ([266bc16](https://github.com/kitikonti/ownchart/commit/266bc161c00d3052a2beea4b6703619fbfafa377))
* harden locale/date utils and add missing test coverage ([96a3500](https://github.com/kitikonti/ownchart/commit/96a3500afaf2e836b2053d6530705a2dad06c88f))
* harden locale/drag/svg utils — caching, dead code, DOMPoint migration ([27bac38](https://github.com/kitikonti/ownchart/commit/27bac38f9cce180bf67551aaae497e2e78839055))
* harden utils docs, comments, and test coverage ([f37bf69](https://github.com/kitikonti/ownchart/commit/f37bf69888cf15f75a54010ea0b5f1db4695e80b))

## [1.1.25](https://github.com/kitikonti/ownchart/compare/v1.1.24...v1.1.25) (2026-03-06)


### Code Refactoring

* harden three hooks from code review (F001–F004) ([3d626b0](https://github.com/kitikonti/ownchart/commit/3d626b0f20f617fd2c5aef1343ec97ebc795ddb5))
* harden three hooks from code review (F001–F004) ([5489717](https://github.com/kitikonti/ownchart/commit/5489717575acf19dce0031abf9b55196a4e1f583))
* harden three hooks from code review (F001–F006) ([51e7c01](https://github.com/kitikonti/ownchart/commit/51e7c01042d9555f6afd9fc13451c02a751753fe))
* harden three hooks from code review (F001–F006) ([8909eea](https://github.com/kitikonti/ownchart/commit/8909eeac0bb274c82a73b75b4c48e6d4e95f8daf))
* harden three hooks from code review (F001–F008) ([922634c](https://github.com/kitikonti/ownchart/commit/922634ca6de7ea906f629498da6b1c2b8fe70d2f))
* harden three hooks from code review (F001–F008) ([335eee1](https://github.com/kitikonti/ownchart/commit/335eee1b90529c237a3cb56e2436b55a1da71443))
* harden three hooks from code review (F001–F008) ([dd4d93f](https://github.com/kitikonti/ownchart/commit/dd4d93f653c74ffc69fa96a7483cfeffc87c29ae))
* harden three hooks from code review (F001–F009) ([7178e30](https://github.com/kitikonti/ownchart/commit/7178e30afe30662c92ca51d8df27a05824def01c))
* harden three hooks from code review (F001–F009) ([65c2c2f](https://github.com/kitikonti/ownchart/commit/65c2c2f27492e6ecc55f5b3c63de879596d4c89a))
* harden three hooks from code review (F001–F012) ([7578b30](https://github.com/kitikonti/ownchart/commit/7578b3082d59aceffff0a70269cd7f2b947d2ebe))
* harden three hooks from code review (F001–F013) ([b6f9b90](https://github.com/kitikonti/ownchart/commit/b6f9b90fec9c866d275a05f963f421a50a711d2e))
* harden three hooks from code review (F001–F013) ([8c8a29b](https://github.com/kitikonti/ownchart/commit/8c8a29bdefc3f5b3ef147d910584b5fca8471cb3))
* harden three hooks from code review (F001–F019) ([336eab9](https://github.com/kitikonti/ownchart/commit/336eab9137d46f33c8ed5682f7079d55a938e277))

## [1.1.24](https://github.com/kitikonti/ownchart/compare/v1.1.23...v1.1.24) (2026-03-06)


### Code Refactoring

* address code review findings in textMeasurement and workingDaysCalculator utils ([5a6ebea](https://github.com/kitikonti/ownchart/commit/5a6ebea9999f3633f02565ae93d5e776739ba738))
* address code review findings in textMeasurement and workingDaysCalculator utils ([da677f6](https://github.com/kitikonti/ownchart/commit/da677f60589bfec43e7abcd06df1ee47a4de60c3))
* address code review findings in textMeasurement and workingDaysCalculator utils ([557a02e](https://github.com/kitikonti/ownchart/commit/557a02e5e396723bec384cee3398f0c1b690ddfe))
* address review findings in textMeasurement and workingDaysCalculator ([855fd62](https://github.com/kitikonti/ownchart/commit/855fd6232748c857f3d581bc4395dc5572114e5e))
* harden textMeasurement and workingDaysCalculator for future-proofing ([77fb2c3](https://github.com/kitikonti/ownchart/commit/77fb2c32fbe40d45e7817b5792efda51167bf780))
* harden textMeasurement and workingDaysCalculator utils ([bc4f9b6](https://github.com/kitikonti/ownchart/commit/bc4f9b6fb91eb74f4e7c1ccc6bb1454977c8a662))

## [1.1.23](https://github.com/kitikonti/ownchart/compare/v1.1.22...v1.1.23) (2026-03-06)


### Code Refactoring

* address code review findings in graph utils ([515fef0](https://github.com/kitikonti/ownchart/commit/515fef00b123abb4659050604ce352b133c779d1))
* address code review findings in graph utils ([44800b4](https://github.com/kitikonti/ownchart/commit/44800b4e7750ac5f18f1c72c09c37a20dee3ae14))
* address code review findings in graph utils ([7849446](https://github.com/kitikonti/ownchart/commit/78494464df9b105f459e3d8f91bfd5456fac9743))
* address code review findings in graph utils ([eb3e0ab](https://github.com/kitikonti/ownchart/commit/eb3e0ab40861af66af2f65ab65bc1027d58a58bd))
* address code review findings in graph utils ([64a3566](https://github.com/kitikonti/ownchart/commit/64a35666f2a3f4045590ff90f593b9145c49d205))
* move bfsReachable to graphHelpers, add PROBE_DEPENDENCY_TYPE constant ([315ab4a](https://github.com/kitikonti/ownchart/commit/315ab4addc689b7dcafe572c7cd8d28ac01171b0))

## [1.1.22](https://github.com/kitikonti/ownchart/compare/v1.1.21...v1.1.22) (2026-03-06)


### Code Refactoring

* decompose pdfExport.ts into focused single-responsibility functions ([c3d98f5](https://github.com/kitikonti/ownchart/commit/c3d98f5fffab4b91a5d466bdd4d93edb18363778))
* harden hierarchy, multiTabStorage, validation — review findings ([48ae111](https://github.com/kitikonti/ownchart/commit/48ae111ee45162c11d8c104f2c72ffac92e17cc0))
* harden pdfExport.ts — fix dead params, reduce coupling, add tests ([80f55f6](https://github.com/kitikonti/ownchart/commit/80f55f69130b491673ca59525cf5099176227e1a))
* harden pdfExport.ts — fix review findings F001–F002, defensive root cleanup ([74b6bec](https://github.com/kitikonti/ownchart/commit/74b6bec8fda9ccb56934cd7df0c131b707fb4bda))
* harden pdfExport.ts — fix review findings F001–F003, add PageDimensions ([99986c5](https://github.com/kitikonti/ownchart/commit/99986c5f2e0f087579942a774fe572bcaacb1dca))
* harden pdfExport.ts — fix review findings F001–F004 ([70f7d9d](https://github.com/kitikonti/ownchart/commit/70f7d9d80b095b93526b5329401dcc8415cbd808))
* harden pdfExport.ts — fix review findings F001–F006 ([1bba711](https://github.com/kitikonti/ownchart/commit/1bba7118823925f96bdb0a155857031075590989))
* harden pdfExport.ts — reduce coupling, sharpen types, fix test gaps ([827c46c](https://github.com/kitikonti/ownchart/commit/827c46c20bcf29ef9bd54dbeddc26f771392ee60))
* replace positional args with options objects in taskTableRenderer ([fd7a4c1](https://github.com/kitikonti/ownchart/commit/fd7a4c19aae298dedb5737e092c9bd4949832486))

## [1.1.21](https://github.com/kitikonti/ownchart/compare/v1.1.20...v1.1.21) (2026-03-06)


### Code Refactoring

* extract getVerticalDir/isSameRow helpers, remove no-op ELBOW_GAP_PADDING ([5015c62](https://github.com/kitikonti/ownchart/commit/5015c62d07a59941267e96e1077e7dee91237695))
* harden elbowPath — extract computeElbowParams, fix quadraticCorner naming, clamp arrowhead size ([47fc797](https://github.com/kitikonti/ownchart/commit/47fc79782821cfc0de10994560000ca7896f2c95))
* harden elbowPath — fix negative radius, extract qCorner, unify calculateDragPath API ([fb36e40](https://github.com/kitikonti/ownchart/commit/fb36e405a9dad52c4174c46beca0f0eb439f9ee1))
* harden elbowPath — remove dead defaults, simplify routing condition, rename threshold constant ([073445a](https://github.com/kitikonti/ownchart/commit/073445a59ae28f74fafc080fc1db1d499ffbd778))
* harden elbowPath — rename qCorner, remove thin wrapper, add zone docs ([177b49c](https://github.com/kitikonti/ownchart/commit/177b49c44e1c2a8afb00dbcb70e0e6653b8d6a44))
* harden elbowPath — typed qCorner, unified isSameRow guard, extract getFSConnectionPoints, scale calculateDragPath by rowHeight ([f243012](https://github.com/kitikonti/ownchart/commit/f243012385bc26b4591646045dd07862938038fb))
* harden elbowPath helpers with Point type and named helpers ([f9d722c](https://github.com/kitikonti/ownchart/commit/f9d722cb93ae616666e2075189a36d0c7f8cb4b1))
* merge worktree-review-graph-utils-01 — harden elbowPath utils ([c798f26](https://github.com/kitikonti/ownchart/commit/c798f2670aef04f7263786f89e23b7de2149b9f2))
* rename bezierPath → elbowPath, extract helpers, name magic numbers ([154cafa](https://github.com/kitikonti/ownchart/commit/154cafa33d020d1e46a7e2c15bce7fd6a3b64180))

## [1.1.20](https://github.com/kitikonti/ownchart/compare/v1.1.19...v1.1.20) (2026-03-06)


### Code Refactoring

* address code review findings in multiTabStorage and validation utils ([8cc1044](https://github.com/kitikonti/ownchart/commit/8cc10446dc0c83cc0ef005b0c37e9c8ecf0bff18))
* address code review findings in multiTabStorage and validation utils ([c2adc14](https://github.com/kitikonti/ownchart/commit/c2adc14a6508e3824a4fe6d2a3412c766aa663e7))
* harden multiTabStorage and validation utils ([f16a1f5](https://github.com/kitikonti/ownchart/commit/f16a1f577dcf025b9f46ba37cbe48e0a65b81d11))
* harden multiTabStorage and validation utils ([301a7bd](https://github.com/kitikonti/ownchart/commit/301a7bda87b3e21af176521868334dbc7d215d7c))
* harden multiTabStorage and validation utils ([7e20ca5](https://github.com/kitikonti/ownchart/commit/7e20ca5f35046a67d67ae20dc175f3168e79ba5e))
* harden validation and multiTabStorage utils ([41e364b](https://github.com/kitikonti/ownchart/commit/41e364bbd59b0007a6f78f19b3e56055d2d7dfa9))

## [1.1.19](https://github.com/kitikonti/ownchart/compare/v1.1.18...v1.1.19) (2026-03-04)


### Bug Fixes

* exclude hidden rows from PNG/PDF/SVG exports ([3324321](https://github.com/kitikonti/ownchart/commit/33243214c1d045121a183aefdb914f395e8731d7)), closes [#65](https://github.com/kitikonti/ownchart/issues/65)


### Code Refactoring

* harden export task filtering types and naming ([59541c6](https://github.com/kitikonti/ownchart/commit/59541c6f2d70429918f4bece07ccb7c011491bf8))

## [1.1.18](https://github.com/kitikonti/ownchart/compare/v1.1.17...v1.1.18) (2026-03-04)


### Bug Fixes

* prevent task insertion from reordering siblings when array order differs from display order ([1766bde](https://github.com/kitikonti/ownchart/commit/1766bdeeb842912f8b40dd9ae4f0e3cc96580845))


### Code Refactoring

* extract INSERTION_ORDER_STEP, add makeTask helper, merge double JSDoc ([5f6e0ed](https://github.com/kitikonti/ownchart/commit/5f6e0ede45a636456e993ca0fe1535829bc54586)), closes [#4A90D9](https://github.com/kitikonti/ownchart/issues/4A90D9)

## [1.1.17](https://github.com/kitikonti/ownchart/compare/v1.1.16...v1.1.17) (2026-03-04)


### Code Refactoring

* address remaining clipboard review findings ([a373b55](https://github.com/kitikonti/ownchart/commit/a373b5582959c82cfbc89086319e5dfa29e92e55))
* apply code review fixes to clipboard utils ([6a9802b](https://github.com/kitikonti/ownchart/commit/6a9802b146f29963bbfc759d215fd0a96ac2533b))
* apply fifth-pass code review fixes to clipboard utils ([e305bb6](https://github.com/kitikonti/ownchart/commit/e305bb6e8b380c8d4bad0f96214918a7abc37089))
* apply final review fixes to clipboard utils ([6197d14](https://github.com/kitikonti/ownchart/commit/6197d14bbaa25a9873ffa11bff3b9da3034d0ba7))
* apply fourth-pass code review fixes to clipboard utils ([3dc76a5](https://github.com/kitikonti/ownchart/commit/3dc76a5b03d2bed348a1230ac615a015ea8a0f4c))
* apply full code review fixes to clipboard utils ([27081f5](https://github.com/kitikonti/ownchart/commit/27081f58153798083f738e536ce9ff521bbb458e))
* apply review fixes and add unit tests for clipboard utils ([6c64feb](https://github.com/kitikonti/ownchart/commit/6c64feb167fdaf59833aba24c8aa470535cf7e21))
* apply review fixes to clipboard utils and consolidate TASK_TYPES ([2dc6d64](https://github.com/kitikonti/ownchart/commit/2dc6d6484db653ee4e603d23862371dc814f7ad8))
* apply second-pass code review fixes to clipboard utils ([8e813aa](https://github.com/kitikonti/ownchart/commit/8e813aabb3660c55816285f54af8a4715f4889d4))
* apply senior code review fixes to clipboard utils ([3adea2f](https://github.com/kitikonti/ownchart/commit/3adea2f6e3959bccd7ac4f6a0e0a3911b331307b))
* apply third-pass code review fixes to clipboard utils ([cefe1a3](https://github.com/kitikonti/ownchart/commit/cefe1a38a71247b9d2ddc7b1d309666f9be5e0a6))
* fix remaining clipboard review findings ([333739d](https://github.com/kitikonti/ownchart/commit/333739d1f6f42dc7c06e77775f7cb07b30013186))
* fix review findings in clipboard utils ([3069b44](https://github.com/kitikonti/ownchart/commit/3069b44b85515b6f4392e928e4c7ec32053db7a7))
* harden clipboard utils and fix ordering ([e7d6413](https://github.com/kitikonti/ownchart/commit/e7d641303fbf2274bff48fc881f0ff99a4649151))
* harden clipboard utils per review findings ([2e6fbf4](https://github.com/kitikonti/ownchart/commit/2e6fbf44551ea4416127f0f847aad0f417940fad))
* harden clipboard utils per review recommendations ([d591d45](https://github.com/kitikonti/ownchart/commit/d591d45a5111997f8b62802762b25c1ed4363473))
* harden clipboard utils with senior dev improvements ([133c869](https://github.com/kitikonti/ownchart/commit/133c869c8373709bc086c6e8e5d43d2544220b42))
* harden clipboard validation and improve parse error diagnostics ([ce43608](https://github.com/kitikonti/ownchart/commit/ce43608fba3667ce32ea92441baf8c3e232c534f))

## [1.1.16](https://github.com/kitikonti/ownchart/compare/v1.1.15...v1.1.16) (2026-03-04)


### Bug Fixes

* correct stableHash import path in computeTaskColor.test.ts ([6056b09](https://github.com/kitikonti/ownchart/commit/6056b0940586a1dd18da05a55ad1f81d248e67eb))


### Code Refactoring

* address all review findings in colorUtils.ts ([4512840](https://github.com/kitikonti/ownchart/commit/4512840de7d153dc7637e7d40ca1870f3e6fc53c))
* fix all review findings in colorUtils.ts ([fe8383b](https://github.com/kitikonti/ownchart/commit/fe8383b8626306b379c8d27ab782a8ec7d78c82b))
* fix all review findings in colorUtils.ts ([ce71691](https://github.com/kitikonti/ownchart/commit/ce716918eca72f288d64493681e96d636df56809))
* fix all review findings in colorUtils.ts ([bef0c93](https://github.com/kitikonti/ownchart/commit/bef0c93de4bb953eea9e0338e5bcb089f04f58f5)), closes [#0F6](https://github.com/kitikonti/ownchart/issues/0F6)
* harden colorUtils with named constants and expanded tests ([bbdbc7c](https://github.com/kitikonti/ownchart/commit/bbdbc7c975e498ce7f7c6b726b0b8c0c4102a629)), closes [#1e293](https://github.com/kitikonti/ownchart/issues/1e293)
* harden colorUtils with named constants and expanded tests ([e4be1fe](https://github.com/kitikonti/ownchart/commit/e4be1fec5f9244b6a924c756e2d68f59d44b0580))

## [1.1.15](https://github.com/kitikonti/ownchart/compare/v1.1.14...v1.1.15) (2026-03-04)


### Bug Fixes

* resolve two CI failures ([eba88f2](https://github.com/kitikonti/ownchart/commit/eba88f2c8579290af6f7a060eccc0104fbbab995))

## [1.1.14](https://github.com/kitikonti/ownchart/compare/v1.1.13...v1.1.14) (2026-03-04)


### Code Refactoring

* apply review fixes to useComputedTaskColor and useExportPreview ([7690f95](https://github.com/kitikonti/ownchart/commit/7690f956885c17881563a9fa6b2b7b5934402423))

## [1.1.13](https://github.com/kitikonti/ownchart/compare/v1.1.12...v1.1.13) (2026-03-04)


### Code Refactoring

* apply review findings to layout and export components (F001–F004) ([0e71288](https://github.com/kitikonti/ownchart/commit/0e71288d289bfb866c7bb0bf28b06196d5defe57))
* apply review findings to layout and export components (F001–F006) ([337a7f3](https://github.com/kitikonti/ownchart/commit/337a7f34efbbb58130346da2997d81189de1a206))
* apply review findings to layout and export components (F001–F007) ([dd7b496](https://github.com/kitikonti/ownchart/commit/dd7b496b0b7493756a1d88ac786487d2207c9024))
* apply review findings to layout and export components (F001–F010) ([c30d610](https://github.com/kitikonti/ownchart/commit/c30d61003ec71b3496a6d2c01434cde9676bb902))
* apply review findings to layout and export components (F001–F012) ([8749490](https://github.com/kitikonti/ownchart/commit/87494906a855184c3778ae4e0989545470895ba4))
* apply review findings to layout and export components (F002, F003, F005–F008) ([27e3356](https://github.com/kitikonti/ownchart/commit/27e33564fdb7ec0f1f35acc50560e749ac7ff862))

## [1.1.12](https://github.com/kitikonti/ownchart/compare/v1.1.11...v1.1.12) (2026-03-01)

## [1.1.11](https://github.com/kitikonti/ownchart/compare/v1.1.10...v1.1.11) (2026-03-01)

## [1.1.10](https://github.com/kitikonti/ownchart/compare/v1.1.9...v1.1.10) (2026-03-01)


### Bug Fixes

* use || instead of ?? in getTaskBarGeometry for empty endDate fallback ([2424a98](https://github.com/kitikonti/ownchart/commit/2424a984c5e1a3eb9b1667e28e953b7a57b68327))


### Code Refactoring

* apply review findings to timelineUtils.ts (F001–F004) ([47de9c7](https://github.com/kitikonti/ownchart/commit/47de9c732e5fd219113c60ad17d9337f4205cf86))
* apply review findings to timelineUtils.ts (F001–F005) ([2b6cb56](https://github.com/kitikonti/ownchart/commit/2b6cb56b6134bdcf6d20826330e7560c97a6ef52))
* apply review findings to timelineUtils.ts (F001–F006) ([c795c37](https://github.com/kitikonti/ownchart/commit/c795c37f0e2d8c5ac1d4ad3ced1ecdae81be6ad7))
* apply review findings to timelineUtils.ts (F001–F007) ([c389052](https://github.com/kitikonti/ownchart/commit/c389052f6650ab872c6e74486790ff788f2c8a42))
* apply review findings to timelineUtils.ts (F001–F008) ([bd011dc](https://github.com/kitikonti/ownchart/commit/bd011dc1cafe227e8d6cf575321552c8d58a7ac8))
* apply review findings to timelineUtils.ts (F001–F011) ([8fcb9d2](https://github.com/kitikonti/ownchart/commit/8fcb9d2e53ea30470a9785fc72baa7ec9fc9446b))

## [1.1.9](https://github.com/kitikonti/ownchart/compare/v1.1.8...v1.1.9) (2026-03-01)


### Code Refactoring

* apply review fixes to useKeyboardShortcuts ([8ffa904](https://github.com/kitikonti/ownchart/commit/8ffa90421fe36ef2c1ecf74b68a2d18fa071a541))
* apply review fixes to useKeyboardShortcuts (round 2) ([d3a925d](https://github.com/kitikonti/ownchart/commit/d3a925d5395048023e5ece224fca0caf5d9570ef))
* apply review fixes to useKeyboardShortcuts (round 3) ([42ea698](https://github.com/kitikonti/ownchart/commit/42ea698654a83bae7085c117f2d4e2f7561ae230))
* apply review fixes to useKeyboardShortcuts (round 4) ([ba05453](https://github.com/kitikonti/ownchart/commit/ba054539d34c60689706dec948f9cb63b516af26))
* apply review fixes to useKeyboardShortcuts (round 5) ([7e75924](https://github.com/kitikonti/ownchart/commit/7e7592426d367a90fe5916ba35011429a6d76837))
* apply review fixes to useKeyboardShortcuts (round 6) ([1b8bef7](https://github.com/kitikonti/ownchart/commit/1b8bef7b5dc2457d65f9f981881c05817b750c9f))
* apply review fixes to useKeyboardShortcuts (round 7) ([c680df4](https://github.com/kitikonti/ownchart/commit/c680df403ce1e5da3c82a31cea0f69a9d3c1b5a4))
* apply review fixes to useKeyboardShortcuts (round 8) ([b15057f](https://github.com/kitikonti/ownchart/commit/b15057fefab1b8025df7f038a47492c5963f9e05))
* overhaul useKeyboardShortcuts for correctness and performance ([79fd84d](https://github.com/kitikonti/ownchart/commit/79fd84df56b00dfdec769cbd508b133f05e6627d))
* split useKeyboardShortcuts into domain sub-hooks and export handlers ([487acd4](https://github.com/kitikonti/ownchart/commit/487acd47080737b06bd1ec5e8cb5717f0eb8c05b))

## [1.1.8](https://github.com/kitikonti/ownchart/compare/v1.1.7...v1.1.8) (2026-03-01)


### Code Refactoring

* apply code review fixes to HiddenRowIndicator, ColumnResizer, ColorCellEditor, TaskTypeIcon ([93e4996](https://github.com/kitikonti/ownchart/commit/93e499639d89322741a2e630f5dcd362a119f743))

## [1.1.7](https://github.com/kitikonti/ownchart/compare/v1.1.6...v1.1.7) (2026-03-01)


### Bug Fixes

* header cells stretch to full row height for proper borders ([f37aede](https://github.com/kitikonti/ownchart/commit/f37aedee32953f53bb1da3be322d52b73173eae9))

## [1.1.6](https://github.com/kitikonti/ownchart/compare/v1.1.5...v1.1.6) (2026-03-01)


### Code Refactoring

* apply review fixes to ChartPreview, SplitPane, export helpers ([4f2c17a](https://github.com/kitikonti/ownchart/commit/4f2c17a7932c9f5f34cd9438bbf98c44bbdb2d24))
* apply review fixes to ZoomModeSelector, ChartPreview, SplitPane ([1160018](https://github.com/kitikonti/ownchart/commit/1160018732b07eded0c2a19b93da7d327b222ceb))

## [1.1.5](https://github.com/kitikonti/ownchart/compare/v1.1.4...v1.1.5) (2026-03-01)


### Bug Fixes

* apply review findings to hierarchy.ts (F001–F006) ([5316756](https://github.com/kitikonti/ownchart/commit/53167563ab9fe6940c9c5aba9eb88ccda4017e6e))


### Code Refactoring

* apply review findings and performance improvements to hierarchy.ts ([7583900](https://github.com/kitikonti/ownchart/commit/7583900b81e270f7edc33489867499ee037d7bf2))
* apply review findings to hierarchy.ts (F001–F004) ([be9f23c](https://github.com/kitikonti/ownchart/commit/be9f23c1cb87b5461b422e7230225ff600958c28))
* apply review findings to hierarchy.ts (F001–F005) ([5e53f7a](https://github.com/kitikonti/ownchart/commit/5e53f7aee6fb348f01c137f740c702658480b706))
* overhaul hierarchy.ts for correctness, performance, and clarity ([89d5eb7](https://github.com/kitikonti/ownchart/commit/89d5eb7e80285dc274ff45085d0fa9534fab0050))

## [1.1.4](https://github.com/kitikonti/ownchart/compare/v1.1.3...v1.1.4) (2026-03-01)

## [1.1.3](https://github.com/kitikonti/ownchart/compare/v1.1.2...v1.1.3) (2026-03-01)


### Bug Fixes

* apply prettier formatting to PdfExportOptions ([7964863](https://github.com/kitikonti/ownchart/commit/79648635f259039533853e7b4a19bb63d644ac31))


### Code Refactoring

* apply code review fixes to TaskTableRow and TaskTableHeader ([3645dd0](https://github.com/kitikonti/ownchart/commit/3645dd0798772e3b5f3a18d74cb2fe1c4731e784))
* drive header rendering from column config, fix import order and return types ([17c9d90](https://github.com/kitikonti/ownchart/commit/17c9d908ada5078572b8c1b4563486a3c27e2e34))
* fix code review findings and DRY grid template logic ([8e2013e](https://github.com/kitikonti/ownchart/commit/8e2013e9e61abb4c942cbe06f51015c571fea19e))
* improve TaskTableRow and TaskTableHeader from code review ([1e6ce47](https://github.com/kitikonti/ownchart/commit/1e6ce4786b807d46e5c4415b863926396df53b76))

## [1.1.2](https://github.com/kitikonti/ownchart/compare/v1.1.1...v1.1.2) (2026-03-01)


### Code Refactoring

* apply code review fixes to PdfExportOptions and SharedExportOptions ([b11b5ca](https://github.com/kitikonti/ownchart/commit/b11b5caaeb06667fb573ff833d6a21291bfd11d3))
* harden export option handlers and fix a11y in CheckboxGroup ([309b542](https://github.com/kitikonti/ownchart/commit/309b542ce49b2454f332ffaacb4e853e8598e5f6))
* improve export options with FieldLabel, generic SegmentedControl, and validation fixes ([97f9e2a](https://github.com/kitikonti/ownchart/commit/97f9e2ac89e55d69b378d6182b98bd5c45f004ff))
* improve export options with SegmentedControl, type safety, and a11y ([b2b9315](https://github.com/kitikonti/ownchart/commit/b2b9315b00890895891d498987c8f0749d5f5037))

## [1.1.1](https://github.com/kitikonti/ownchart/compare/v1.1.0...v1.1.1) (2026-03-01)


### Code Refactoring

* apply code review fixes to useTaskBarInteraction ([b124ebb](https://github.com/kitikonti/ownchart/commit/b124ebba8f90c8b362c833bb68aea158426c83e5))
* apply review fixes to useTaskBarInteraction ([ddb829a](https://github.com/kitikonti/ownchart/commit/ddb829ad00e4bb63590082080a8100ac8fdd51a1))
* extract task bar drag helpers to utility module ([57792c1](https://github.com/kitikonti/ownchart/commit/57792c15cafa3ee930229db904ed8fcca30953cd))
* slim down useTaskBarInteraction using extracted helpers ([0a2dd2c](https://github.com/kitikonti/ownchart/commit/0a2dd2c3732497c4e93add4742086de2a9978263))
* stabilize useTaskBarInteraction with ref-based listeners and improved coverage ([8428c88](https://github.com/kitikonti/ownchart/commit/8428c88a6936f747416d00088fcfa0904f73f712))

## [1.1.0](https://github.com/kitikonti/ownchart/compare/v1.0.4...v1.1.0) (2026-03-01)


### Features

* add model recommendation to review skill ([a0c93cb](https://github.com/kitikonti/ownchart/commit/a0c93cb6abaa2f141e474740395504db6bf8720d))


### Code Refactoring

* apply PaletteId and HexColor branded types to ColorPalette interface ([64f4930](https://github.com/kitikonti/ownchart/commit/64f4930ebaf1dc50df2aea408c8892b2166f2fc8))
* harden colorPalettes with type safety, consistency, and tests ([14d519d](https://github.com/kitikonti/ownchart/commit/14d519d627dbbf881e904f61fc827055a0743d73))
* replace type assertion in PALETTES_BY_CATEGORY with explicit annotation ([a4c44e3](https://github.com/kitikonti/ownchart/commit/a4c44e3784d1bf062c450b13544372943f3c61e7))

## [1.0.4](https://github.com/kitikonti/ownchart/compare/v1.0.3...v1.0.4) (2026-02-28)

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
