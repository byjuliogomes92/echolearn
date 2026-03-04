# EchoLearn

> Legendas em tempo real para estudantes surdos em plataformas EAD brasileiras.

Chrome extension that captures tab audio and transcribes it live using Web Speech API or Deepgram — injecting a draggable caption overlay directly over the video player. No server. No account. No data leaves the browser.

Built because my sister couldn't follow her university lectures on Unicesumar. The platform uses Video.js with HLS streams and has no native captioning support.

---

## How it works

```
Tab audio (chrome.tabCapture)
    └── Background Service Worker
            └── Offscreen Document (MV3)
                    ├── Web Speech API  ──┐
                    └── Deepgram WS    ──┴── Transcription result
                                                    └── Content Script
                                                            └── Caption Overlay (Shadow DOM)
```

The service worker captures a `streamId` via `chrome.tabCapture.getMediaStreamId`, passes it to an offscreen document (required in MV3 for audio processing outside the service worker), which feeds the stream to the transcription engine. Results are forwarded back through the message bus and rendered in a Shadow DOM overlay injected into the page.

Shadow DOM is not optional here — EAD platforms like Studeo use aggressive CSS resets that would break any injected UI without style isolation.

---

## Architecture

Clean layered architecture with strict separation between domain, infrastructure, and presentation.

```
src/
├── shared/
│   ├── types/          # Discriminated unions for all cross-context messages
│   ├── errors/         # Typed error hierarchy (AudioCaptureError, TranscriptionError, ...)
│   ├── logger/         # Structured logger — console is banned everywhere else
│   ├── validation/     # Zod schemas for settings with runtime boundary validation
│   ├── constants/      # Single source of truth for timeouts, DOM ids, storage keys
│   └── utils/          # Typed message bus wrapping chrome.runtime.sendMessage
├── background/
│   ├── repositories/   # SettingsRepository — only place that touches chrome.storage
│   ├── services/       # TabStateManager, OffscreenManager, CaptionService
│   └── factories/      # TranscriptionEngineFactory with exhaustive provider switch
├── offscreen/
│   ├── audio/          # AudioCaptureProcessor — bridges streamId to engine
│   └── transcription/  # WebSpeechEngine, DeepgramEngine
├── content/
│   └── components/     # CaptionOverlay (Shadow DOM), DragBehavior
├── popup/              # Toggle UI with real-time status display
└── options/            # Settings form with live preview values
```

Every cross-context message is a discriminated union. Every switch on message type has an exhaustive `never` check — adding a new message type without handling it breaks the build.

---

## Tech

- **TypeScript** strict mode with `exactOptionalPropertyTypes`, `noUnusedLocals`, `noImplicitReturns`
- **Vite** with 5 isolated entry points (service-worker, content, offscreen, popup, options)
- **Zod** for settings validation at the chrome.storage boundary
- **Web Speech API** as the default provider — free, no account, works offline
- **Deepgram** as the high-accuracy alternative via WebSocket streaming
- **Vitest** + jsdom for unit tests, chrome APIs stubbed via `vi.stubGlobal`
- **ESLint** with `@typescript-eslint/recommended-type-checked` — no `any`, no floating promises, exhaustive switches
- **Husky** + standard-version — pre-commit lint, semantic versioning, auto-generated changelog
- **GitHub Actions** — lint → typecheck → test → coverage → build on every push

---

## Why Web Speech stops working after 25 seconds

Chrome's Web Speech API silently terminates recognition after ~25s of audio. There's no event, no error, no warning. The `onend` handler fires and that's it.

`WebSpeechEngine` schedules a restart at `TRANSCRIPTION.RESTART_INTERVAL_MS` (20s) — proactively, before the timeout — and caps retries at `MAX_RESTART_ATTEMPTS` to surface a real error if the API fails persistently rather than looping forever.

---

## Why an offscreen document

MV3 service workers have no DOM and can't call `getUserMedia`. Audio processing requires a real page context. Chrome 116+ supports `chrome.offscreen.createDocument` for exactly this — a hidden page that can access audio APIs without being visible to the user.

The `OffscreenManager` guards against the MV3 constraint that only one offscreen document can exist per extension at a time, with an `isCreating` flag to prevent race conditions on concurrent start requests.

---

## Supported platforms

| Platform | Player | Status |
|---|---|---|
| Unicesumar / Studeo | Video.js + HLS | ✅ Primary target |
| Anhanguera | Moodle-based | ✅ Supported |
| Estácio | Custom player | ✅ Supported |
| Any Moodle instance | Variable | ⚠️ Best effort |

`chrome.tabCapture` captures the tab's audio output regardless of the underlying player implementation. The extension doesn't need to know anything about the player — it captures at the OS audio level.

---

## Local development

```bash
git clone https://github.com/byjuliogomes92/echolearn
cd echolearn
npm install
npm run dev
```

Load the extension in Chrome:
1. Navigate to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/` folder

```bash
npm run test          # run unit tests
npm run test:coverage # coverage report (70% threshold)
npm run lint          # ESLint with zero warnings tolerance
npm run build         # production build
```

---

## Releasing

```bash
npm run release              # patch bump (0.0.x)
npm run release:minor        # minor bump (0.x.0)
git push --follow-tags origin master
```

standard-version generates the CHANGELOG from conventional commits and creates a git tag. Pushing the tag triggers the GitHub Actions release pipeline, which builds the extension, zips `dist/`, and attaches it to a GitHub Release.

---

## Motivation

My sister is deaf and enrolled at Unicesumar. The platform's video player has no captioning support and the institution's response was to suggest she watch videos with a lip-reading assistant — which isn't always available and doesn't scale.

This extension was the practical solution. It works on any tab, requires no changes to the platform, and gives her independence in how she consumes the content.

If you're a student or teacher at an institution with the same problem, the extension works on any platform. If you find it useful, consider [supporting development](https://github.com/byjuliogomes92/echolearn).

---

## License

MIT