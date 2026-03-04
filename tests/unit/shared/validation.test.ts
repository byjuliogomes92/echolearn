import { describe, it, expect } from 'vitest';
import {
    validateSettings,
    mergeWithDefaults,
    DEFAULT_SETTINGS,
    UserSettings,
} from '../../../src/shared/validation/settings.schema.js';

describe('validateSettings', () => {
    it('returns success for valid settings', () => {
        const result = validateSettings(DEFAULT_SETTINGS);
        expect(result.success).toBe(true);
    });

    it('returns errors for invalid font size', () => {
        const result = validateSettings({ ...DEFAULT_SETTINGS, fontSize: 999 });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.errors.some((e) => e.includes('fontSize'))).toBe(true);
        }
    });

    it('returns errors for invalid provider', () => {
        const result = validateSettings({ ...DEFAULT_SETTINGS, provider: 'invalid' });
        expect(result.success).toBe(false);
    });

    it('returns errors for opacity out of range', () => {
        const result = validateSettings({ ...DEFAULT_SETTINGS, opacity: 2.0 });
        expect(result.success).toBe(false);
    });

    it('accepts null deepgramApiKey', () => {
        const result = validateSettings({ ...DEFAULT_SETTINGS, deepgramApiKey: null });
        expect(result.success).toBe(true);
    });

    it('returns errors for unknown input', () => {
        const result = validateSettings(null);
        expect(result.success).toBe(false);
    });
});

describe('mergeWithDefaults', () => {
    it('merges partial settings with defaults', () => {
        const partial: Partial<UserSettings> = { fontSize: 24 };
        const result = mergeWithDefaults(partial);
        expect(result.fontSize).toBe(24);
        expect(result.provider).toBe(DEFAULT_SETTINGS.provider);
    });

    it('returns defaults for empty object', () => {
        const result = mergeWithDefaults({});
        expect(result).toEqual(DEFAULT_SETTINGS);
    });
});