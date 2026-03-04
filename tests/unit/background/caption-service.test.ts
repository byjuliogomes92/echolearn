import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CaptionService } from '../../../src/background/services/caption.service.js';
import { TabStateManager } from '../../../src/background/services/tab-state.manager.js';
import { OffscreenManager } from '../../../src/background/services/offscreen.manager.js';
import { TranscriptionEngineFactory } from '../../../src/background/factories/transcription-engine.factory.js';
import { SettingsRepository } from '../../../src/background/repositories/settings.repository.js';

vi.stubGlobal('chrome', {
    runtime: {
        sendMessage: vi.fn().mockResolvedValue({ success: true }),
        lastError: null,
    },
    tabs: {
        sendMessage: vi.fn().mockResolvedValue({ success: true }),
    },
    tabCapture: {
        getMediaStreamId: vi.fn((_options, callback: (id: string) => void) => {
            callback('mock-stream-id');
        }),
    },
});

describe('CaptionService', () => {
    let captionService: CaptionService;
    let tabState: TabStateManager;
    let offscreen: OffscreenManager;
    let engineFactory: TranscriptionEngineFactory;
    let settingsRepo: SettingsRepository;

    beforeEach(() => {
        tabState = new TabStateManager();
        offscreen = {
            ensure: vi.fn().mockResolvedValue(undefined),
            close: vi.fn().mockResolvedValue(undefined),
        } as unknown as OffscreenManager;
        engineFactory = {
            create: vi.fn().mockResolvedValue('webSpeech'),
            getLanguage: vi.fn().mockResolvedValue('pt-BR'),
            getDeepgramKey: vi.fn().mockResolvedValue(null),
        } as unknown as TranscriptionEngineFactory;
        settingsRepo = {} as unknown as SettingsRepository;

        captionService = new CaptionService(tabState, offscreen, engineFactory, settingsRepo);
        vi.clearAllMocks();
    });

    it('starts a caption session', async () => {
        await captionService.start(1);
        expect(tabState.get(1).status).toBe('transcribing');
        expect(offscreen.ensure).toHaveBeenCalled();
    });

    it('does not double-start an active session', async () => {
        await captionService.start(1);
        await captionService.start(1);
        expect(offscreen.ensure).toHaveBeenCalledTimes(1);
    });

    it('stops a caption session', async () => {
        await captionService.start(1);
        await captionService.stop(1);
        expect(tabState.get(1).status).toBe('idle');
        expect(offscreen.close).toHaveBeenCalled();
    });

    it('does not stop an inactive session', async () => {
        await captionService.stop(1);
        expect(offscreen.close).not.toHaveBeenCalled();
    });

    it('toggle starts when idle', async () => {
        await captionService.toggle(1);
        expect(tabState.get(1).status).toBe('transcribing');
    });

    it('toggle stops when active', async () => {
        await captionService.start(1);
        await captionService.toggle(1);
        expect(tabState.get(1).status).toBe('idle');
    });

    it('sets error state when start fails', async () => {
        vi.mocked(offscreen.ensure).mockRejectedValue(new Error('offscreen failed'));
        await expect(captionService.start(1)).rejects.toThrow();
        expect(tabState.get(1).status).toBe('error');
    });
});