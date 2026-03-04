// The SettingsRepository is the only place in the codebase that
// touches chrome.storage directly. Everything else goes through here.
// This makes it trivial to mock storage in tests and swap backends later.

import { STORAGE_KEYS } from '../../shared/constants/index.js';
import { StorageError } from '../../shared/errors/index.js';
import { createLogger } from '../../shared/logger/index.js';
import {
    UserSettings,
    DEFAULT_SETTINGS,
    validateSettings,
    mergeWithDefaults,
} from '../../shared/validation/settings.schema.js';

const logger = createLogger('SettingsRepository');

export class SettingsRepository {
    async get(): Promise<UserSettings> {
        try {
            const result = await chrome.storage.sync.get(STORAGE_KEYS.USER_SETTINGS);
            const raw: unknown = result[STORAGE_KEYS.USER_SETTINGS];

            if (raw === undefined) {
                logger.debug('No settings found, returning defaults');
                return DEFAULT_SETTINGS;
            }

            const validation = validateSettings(raw);

            if (!validation.success) {
                logger.warn('Settings corrupted, resetting to defaults', {
                    errors: validation.errors,
                });
                await this.set(DEFAULT_SETTINGS);
                return DEFAULT_SETTINGS;
            }

            return validation.data;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            throw new StorageError(`Failed to read settings: ${msg}`, 'STORAGE_READ_FAILED');
        }
    }

    async set(settings: UserSettings): Promise<void> {
        try {
            await chrome.storage.sync.set({
                [STORAGE_KEYS.USER_SETTINGS]: settings,
            });
            logger.debug('Settings saved');
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            throw new StorageError(`Failed to write settings: ${msg}`, 'STORAGE_WRITE_FAILED');
        }
    }

    async update(partial: Partial<UserSettings>): Promise<UserSettings> {
        const current = await this.get();
        const updated = mergeWithDefaults({ ...current, ...partial });
        await this.set(updated);
        logger.debug('Settings updated', { changes: Object.keys(partial) });
        return updated;
    }

    async reset(): Promise<UserSettings> {
        await this.set(DEFAULT_SETTINGS);
        logger.info('Settings reset to defaults');
        return DEFAULT_SETTINGS;
    }
}