// Every message that crosses context boundaries (background ↔ content ↔ offscreen)
// must be a discriminated union. This forces exhaustive handling at every receiver
// and makes it impossible to send a malformed message.

export type ExtensionStatus = 'idle' | 'capturing' | 'transcribing' | 'error' | 'disabled';

export type TranscriptionProvider = 'webSpeech' | 'deepgram';

export type CaptionPosition = 'bottom' | 'top' | 'middle';

// --- Tab State ---

export interface ITabState {
    tabId: number;
    status: ExtensionStatus;
    provider: TranscriptionProvider;
    startedAt: number | null;
    errorMessage: string | null;
}

// --- Transcription ---

export interface ITranscriptionResult {
    transcript: string;
    isFinal: boolean;
    confidence: number;
    timestamp: number;
}

// --- Messages (discriminated unions) ---

export type BackgroundMessage =
    | { type: 'START_CAPTION'; tabId: number; provider: TranscriptionProvider }
    | { type: 'STOP_CAPTION'; tabId: number }
    | { type: 'GET_STATUS'; tabId: number }
    | { type: 'UPDATE_SETTINGS' };

export type OffscreenMessage =
    | { type: 'INIT_AUDIO'; streamId: string; provider: TranscriptionProvider }
    | { type: 'STOP_AUDIO' }
    | { type: 'TRANSCRIPTION_RESULT'; result: ITranscriptionResult }
    | { type: 'TRANSCRIPTION_ERROR'; error: string };

export type ContentMessage =
    | { type: 'SHOW_CAPTION'; text: string; isFinal: boolean }
    | { type: 'HIDE_CAPTION' }
    | { type: 'SET_STATUS'; status: ExtensionStatus };

export type PopupMessage =
    | { type: 'STATUS_UPDATE'; tabId: number; status: ExtensionStatus }
    | { type: 'ERROR'; message: string };

// --- Settings ---

export interface IUserSettings {
    enabled: boolean;
    provider: TranscriptionProvider;
    fontSize: number;
    position: CaptionPosition;
    opacity: number;
    deepgramApiKey: string | null;
    language: string;
}