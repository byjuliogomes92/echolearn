import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsRepository } from '../../../src/background/repositories/settings.repository.js';
import { DEFAULT_SETTINGS } from '../../../src/shared/validation/settings.schema.js';

const mockStorage = {
    get: vi.fn(),
    set: vi.fn(),
};

vi.stubGlobal('chrome', {
    storage: {
        sync: mockStorage,
    },
});

describe('SettingsRepository', () => {
    let repo: SettingsRepository;

    beforeEach(() => {
        repo = new SettingsRepository();
        vi.clearAllMocks();
    });

    it('returns defaults when storage is empty', async () => {
        mockStorage.get.mockResolvedValue({});
        const settings = await repo.get();
        expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('returns stored settings when valid', async () => {
        mockStorage.get.mockResolvedValue({
            echolearn_settings: { ...DEFAULT_SETTINGS, fontSize: 24 },
        });
        const settings = await repo.get();
        expect(settings.fontSize).toBe(24);
    });

    it('resets to defaults when settings are corrupted', async () => {
        mockStorage.get.mockResolvedValue({
            echolearn_settings: { invalid: true },
        });
        mockStorage.set.mockResolvedValue(undefined);
        const settings = await repo.get();
        expect(settings).toEqual(DEFAULT_SETTINGS);
        expect(mockStorage.set).toHaveBeenCalled();
    });

    it('saves settings to storage', async () => {
        mockStorage.set.mockResolvedValue(undefined);
        await repo.set(DEFAULT_SETTINGS);
        expect(mockStorage.set).toHaveBeenCalledWith({
            echolearn_settings: DEFAULT_SETTINGS,
        });
    });

    it('updates partial settings', async () => {
        mockStorage.get.mockResolvedValue({
            echolearn_settings: DEFAULT_SETTINGS,
        });
        mockStorage.set.mockResolvedValue(undefined);
        const updated = await repo.update({ fontSize: 32 });
        expect(updated.fontSize).toBe(32);
        expect(updated.provider).toBe(DEFAULT_SETTINGS.provider);
    });

    it('resets to defaults', async () => {
        mockStorage.set.mockResolvedValue(undefined);
        const settings = await repo.reset();
        expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('throws StorageError when chrome.storage fails', async () => {
        mockStorage.get.mockRejectedValue(new Error('quota exceeded'));
        await expect(repo.get()).rejects.toThrow('Failed to read settings');
    });
});