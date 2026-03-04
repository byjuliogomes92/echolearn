// The CaptionService is the main orchestrator of the extension.
// It coordinates tab state, offscreen document, and content script
// communication to start and stop caption sessions.

import { EXTENSION } from '../../shared/constants/index.js';
import { AudioCaptureError } from '../../shared/errors/index.js';
import { createLogger } from '../../shared/logger/index.js';
import { TranscriptionProvider } from '../../shared/types/index.js';
import { sendToContent } from '../../shared/utils/message-bus.js';
import { TranscriptionEngineFactory } from '../factories/transcription-engine.factory.js';
import { SettingsRepository } from '../repositories/settings.repository.js';
import { OffscreenManager } from './offscreen.manager.js';
import { TabStateManager } from './tab-state.manager.js';

const logger = createLogger('CaptionService');

export class CaptionService {
    constructor(
        private readonly tabState: TabStateManager,
        private readonly offscreen: OffscreenManager,
        private readonly engineFactory: TranscriptionEngineFactory,
        private readonly settingsRepo: SettingsRepository,
    ) { }

    async start(tabId: number): Promise<void> {
        if (this.tabState.isActive(tabId)) {
            logger.debug('Caption already active for tab', { tabId });
            return;
        }

        logger.info('Starting caption session', { tabId });
        this.tabState.setStatus(tabId, 'capturing');

        try {
            const streamId = await this.captureTab(tabId);
            const engineType = await this.engineFactory.create();
            const language = await this.engineFactory.getLanguage();

            await this.offscreen.ensure();

            await chrome.runtime.sendMessage({
                type: 'INIT_AUDIO',
                streamId,
                provider: engineType as TranscriptionProvider,
                language,
            });

            this.tabState.setStatus(tabId, 'transcribing');

            await sendToContent(tabId, { type: 'SET_STATUS', status: 'transcribing' });

            logger.info('Caption session started', { tabId, engine: engineType });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error('Failed to start caption session', { tabId, error: msg });
            this.tabState.setError(tabId, msg);
            await sendToContent(tabId, { type: 'SET_STATUS', status: 'error' });
            throw error;
        }
    }

    async stop(tabId: number): Promise<void> {
        if (!this.tabState.isActive(tabId)) {
            logger.debug('No active caption session for tab', { tabId });
            return;
        }

        logger.info('Stopping caption session', { tabId });

        try {
            await chrome.runtime.sendMessage({ type: 'STOP_AUDIO' });
            await this.offscreen.close();
            this.tabState.setStatus(tabId, 'idle');
            await sendToContent(tabId, { type: 'HIDE_CAPTION' });
            await sendToContent(tabId, { type: 'SET_STATUS', status: 'idle' });
            logger.info('Caption session stopped', { tabId });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error('Failed to stop caption session', { tabId, error: msg });
            this.tabState.setError(tabId, msg);
        }
    }

    async toggle(tabId: number): Promise<void> {
        if (this.tabState.isActive(tabId)) {
            await this.stop(tabId);
        } else {
            await this.start(tabId);
        }
    }

    private async captureTab(tabId: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new AudioCaptureError('Tab capture timed out'));
            }, EXTENSION.OFFSCREEN_INIT_TIMEOUT_MS);

            chrome.tabCapture.getMediaStreamId(
                { targetTabId: tabId },
                (streamId) => {
                    clearTimeout(timer);
                    if (chrome.runtime.lastError ?? !streamId) {
                        reject(
                            new AudioCaptureError(
                                chrome.runtime.lastError?.message ?? 'Failed to get stream ID',
                            ),
                        );
                        return;
                    }
                    resolve(streamId);
                },
            );
        });
    }
}