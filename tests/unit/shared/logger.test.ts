import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from '../../../src/shared/logger/index.js';

describe('createLogger', () => {
    beforeEach(() => {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined);
        vi.spyOn(console, 'info').mockImplementation(() => undefined);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('creates a logger with all four methods', () => {
        const logger = createLogger('Test');
        expect(typeof logger.debug).toBe('function');
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.error).toBe('function');
    });

    it('includes module name in output', () => {
        const logger = createLogger('MyModule');
        logger.warn('test message');
        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('MyModule'),
            expect.anything(),
        );
    });

    it('includes message in output', () => {
        const logger = createLogger('Test');
        logger.error('something broke');
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('something broke'),
            expect.anything(),
        );
    });

    it('passes data to console output', () => {
        const logger = createLogger('Test');
        const data = { tabId: 42 };
        logger.warn('with data', data);
        expect(console.warn).toHaveBeenCalledWith(
            expect.any(String),
            data,
        );
    });
});