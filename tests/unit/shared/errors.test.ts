import { describe, it, expect } from 'vitest';
import {
    AudioCaptureError,
    TranscriptionError,
    StorageError,
    PermissionError,
    OffscreenError,
    isEchoLearnError,
    toEchoLearnError,
} from '../../../src/shared/errors/index.js';

describe('Error hierarchy', () => {
    it('AudioCaptureError has correct code and name', () => {
        const error = new AudioCaptureError('stream lost', 'AUDIO_STREAM_LOST');
        expect(error.code).toBe('AUDIO_STREAM_LOST');
        expect(error.name).toBe('AudioCaptureError');
        expect(error.message).toBe('stream lost');
    });

    it('TranscriptionError defaults to TRANSCRIPTION_FAILED', () => {
        const error = new TranscriptionError('timeout');
        expect(error.code).toBe('TRANSCRIPTION_FAILED');
    });

    it('StorageError carries context', () => {
        const error = new StorageError('read failed', 'STORAGE_READ_FAILED', { key: 'settings' });
        expect(error.context).toEqual({ key: 'settings' });
    });

    it('PermissionError has fixed code', () => {
        const error = new PermissionError('denied');
        expect(error.code).toBe('PERMISSION_DENIED');
    });

    it('OffscreenError has fixed code', () => {
        const error = new OffscreenError('init failed');
        expect(error.code).toBe('OFFSCREEN_INIT_FAILED');
    });
});

describe('isEchoLearnError', () => {
    it('returns true for EchoLearn errors', () => {
        expect(isEchoLearnError(new AudioCaptureError('test'))).toBe(true);
        expect(isEchoLearnError(new PermissionError('test'))).toBe(true);
    });

    it('returns false for generic errors', () => {
        expect(isEchoLearnError(new Error('generic'))).toBe(false);
        expect(isEchoLearnError('string')).toBe(false);
        expect(isEchoLearnError(null)).toBe(false);
    });
});

describe('toEchoLearnError', () => {
    it('passes through EchoLearn errors unchanged', () => {
        const original = new PermissionError('denied');
        expect(toEchoLearnError(original)).toBe(original);
    });

    it('wraps generic Error', () => {
        const result = toEchoLearnError(new Error('generic'));
        expect(isEchoLearnError(result)).toBe(true);
        expect(result.message).toBe('generic');
    });

    it('wraps string', () => {
        const result = toEchoLearnError('something went wrong');
        expect(result.message).toBe('something went wrong');
    });
});