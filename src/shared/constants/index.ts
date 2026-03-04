// Single source of truth for all magic strings and numbers.
// Centralizing these prevents typos in message type strings and makes
// it easy to tune timeouts without hunting through the codebase.

// --- Transcription Engine ---

export const TRANSCRIPTION = {
    // Web Speech API silently stops after ~25s of audio.
    // We restart proactively at 20s to avoid any gap in coverage.
    RESTART_INTERVAL_MS: 20_000,

    // Maximum restart attempts before surfacing an error to the user.
    MAX_RESTART_ATTEMPTS: 10,

    // How long to wait for the first result before considering it a timeout.
    INITIAL_TIMEOUT_MS: 5_000,

    // Minimum confidence score to display a transcript (0-1).
    MIN_CONFIDENCE: 0.5,
} as const;

// --- Audio Capture ---

export const AUDIO = {
    // MediaRecorder chunk interval in milliseconds.
    CHUNK_INTERVAL_MS: 250,

    // Sample rate for audio capture.
    SAMPLE_RATE: 16_000,
} as const;

// --- Storage ---

export const STORAGE_KEYS = {
    USER_SETTINGS: 'echolearn_settings',
    EXTENSION_VERSION: 'echolearn_version',
} as const;

// --- DOM ---

export const DOM = {
    OVERLAY_ID: 'echolearn-caption-overlay',
    CAPTION_TEXT_ID: 'echolearn-caption-text',
    OVERLAY_CLASS: 'echolearn-overlay',
    VIDEO_SELECTOR: 'video',
} as const;

// --- Offscreen ---

export const OFFSCREEN = {
    DOCUMENT_PATH: 'offscreen/index.html',
    REASON: 'USER_MEDIA' as chrome.offscreen.Reason,
    JUSTIFICATION: 'Capture tab audio for real-time transcription',
} as const;

// --- Extension ---

export const EXTENSION = {
    // How long to wait for offscreen document to initialize.
    OFFSCREEN_INIT_TIMEOUT_MS: 3_000,

    // Debounce delay for settings changes.
    SETTINGS_DEBOUNCE_MS: 300,
} as const;