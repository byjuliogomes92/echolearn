// Typed error hierarchy for EchoLearn.
// Using specific error classes instead of generic Error objects means
// catch blocks can narrow the type and respond appropriately —
// a StorageError should be handled differently from a PermissionError.

export type ErrorCode =
    | 'AUDIO_CAPTURE_FAILED'
    | 'AUDIO_STREAM_LOST'
    | 'TRANSCRIPTION_FAILED'
    | 'TRANSCRIPTION_TIMEOUT'
    | 'STORAGE_READ_FAILED'
    | 'STORAGE_WRITE_FAILED'
    | 'STORAGE_CORRUPTED'
    | 'PERMISSION_DENIED'
    | 'OFFSCREEN_INIT_FAILED'
    | 'UNKNOWN';

export abstract class EchoLearnError extends Error {
    abstract readonly code: ErrorCode;

    constructor(
        message: string,
        public readonly context?: Record<string, unknown>,
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class AudioCaptureError extends EchoLearnError {
    readonly code: ErrorCode;

    constructor(message: string, code: Extract<ErrorCode, 'AUDIO_CAPTURE_FAILED' | 'AUDIO_STREAM_LOST'> = 'AUDIO_CAPTURE_FAILED', context?: Record<string, unknown>) {
        super(message, context);
        this.code = code;
    }
}

export class TranscriptionError extends EchoLearnError {
    readonly code: ErrorCode;

    constructor(message: string, code: Extract<ErrorCode, 'TRANSCRIPTION_FAILED' | 'TRANSCRIPTION_TIMEOUT'> = 'TRANSCRIPTION_FAILED', context?: Record<string, unknown>) {
        super(message, context);
        this.code = code;
    }
}

export class StorageError extends EchoLearnError {
    readonly code: ErrorCode;

    constructor(message: string, code: Extract<ErrorCode, 'STORAGE_READ_FAILED' | 'STORAGE_WRITE_FAILED' | 'STORAGE_CORRUPTED'> = 'STORAGE_READ_FAILED', context?: Record<string, unknown>) {
        super(message, context);
        this.code = code;
    }
}

export class PermissionError extends EchoLearnError {
    readonly code = 'PERMISSION_DENIED' as const;

    constructor(message: string, context?: Record<string, unknown>) {
        super(message, context);
    }
}

export class OffscreenError extends EchoLearnError {
    readonly code = 'OFFSCREEN_INIT_FAILED' as const;

    constructor(message: string, context?: Record<string, unknown>) {
        super(message, context);
    }
}

export function isEchoLearnError(error: unknown): error is EchoLearnError {
    return error instanceof EchoLearnError;
}

export function toEchoLearnError(error: unknown): EchoLearnError {
    if (isEchoLearnError(error)) return error;

    const message = error instanceof Error ? error.message : String(error);
    const unknownError = new TranscriptionError(message, 'TRANSCRIPTION_FAILED');
    unknownError.name = 'UnknownError';
    return unknownError;
}