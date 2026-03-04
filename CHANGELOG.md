# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.0.2 (2026-03-04)


### Features

* **background:** add caption service orchestrator 6c48ff1
* **background:** add manifest.json and extension icons 8e5470f
* **background:** add offscreen document manager bd86a72
* **background:** add settings repository with chrome.storage abstraction 67109f8
* **background:** implement tab state manager 3d747bb
* **background:** implement transcription engine factory bb56515
* **background:** wire service worker entry point fab0757
* **constants:** centralize magic strings and configuration values 159b079
* **content:** add CSS isolation for overlay host element 0e92371
* **content:** add drag behavior for overlay positioning 119d659
* **content:** implement caption overlay component 1a9a7c9
* **content:** implement content script message handler e1d52a5
* **content:** wire content script entry point 3712fe6
* **errors:** implement typed error hierarchy 32a283e
* **logger:** add structured logger with module context d83b0f9
* **offscreen:** add audio capture processor 8443e02
* **offscreen:** add offscreen document HTML page a7ae5c0
* **offscreen:** implement Deepgram transcription engine 3018df5
* **offscreen:** implement Web Speech transcription engine 0445071
* **offscreen:** wire offscreen document entry point 2fbf94e
* **options:** add options page entry point cee44b9
* **options:** add options page HTML structure 55cb1ce
* **options:** add options page styles d59af0c, closes #252B37
* **options:** implement options page logic ae8d697
* **popup:** add popup entry point cb5d5fd
* **popup:** add popup HTML structure 34eca19
* **popup:** add popup styles with design system tokens e773424, closes #252B37 #2684 #F5F9
* **popup:** implement popup toggle logic and status display 61ff267
* **types:** define core domain types and message contracts bfae439
* **utils:** implement typed message bus for cross-context communication 6b558b2
* **validation:** add Zod schemas for settings validation f0d68bd


### Tests

* **background:** add unit tests for CaptionService 6ab368d
* **background:** add unit tests for SettingsRepository eb73664
* **background:** add unit tests for TabStateManager b9b1209
* **errors:** add unit tests for typed error hierarchy fc2c6de
* **logger:** add unit tests for structured logger 488b2d9
* should be blocked b67294d
* **validation:** add unit tests for Zod settings schema e4f0645


### Chores

* add ESLint and Prettier with extension-specific rules 5a31f54
* add semantic versioning with standard-version 609bdda
* add TypeScript with strict configuration f90145e
* **ci:** add GitHub Actions workflow for lint, test and build 0f26b38
* **ci:** add release pipeline for tagged versions d2a8939
* configure Husky pre-commit hooks with lint-staged 37cf406
* configure Vite for multi-entry Chrome extension build 2f4f38b
* initialize project structure and package.json 42042ab
* remove test file used to validate pre-commit hook 65c0d07
* **test:** configure Vitest with jsdom and coverage thresholds 5ef32d0

# Changelog

All notable changes to EchoLearn will be documented in this file.
See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.