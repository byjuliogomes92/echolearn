// Entry point for the background service worker.
// All dependencies are composed here using manual dependency injection.
// No service instantiates its own dependencies — they are all provided
// from this single composition root.

import { createLogger } from '../shared/logger/index.js';
import { BackgroundMessage } from '../shared/types/index.js';
import { onMessage } from '../shared/utils/message-bus.js';
import { TranscriptionEngineFactory } from './factories/transcription-engine.factory.js';
import { SettingsRepository } from './repositories/settings.repository.js';
import { CaptionService } from './services/caption.service.js';
import { OffscreenManager } from './services/offscreen.manager.js';
import { TabStateManager } from './services/tab-state.manager.js';

const logger = createLogger('ServiceWorker');

// --- Composition Root ---

const settingsRepo = new SettingsRepository();
const tabState = new TabStateManager();
const offscreen = new OffscreenManager();
const engineFactory = new TranscriptionEngineFactory(settingsRepo);
const captionService = new CaptionService(tabState, offscreen, engineFactory, settingsRepo);

// --- Message Handlers ---

onMessage<BackgroundMessage>(async (message) => {

    switch (message.type) {
        case 'START_CAPTION': {
            await captionService.start(message.tabId);
            return { success: true, data: undefined };
        }
        case 'STOP_CAPTION': {
            await captionService.stop(message.tabId);
            return { success: true, data: undefined };
        }
        case 'GET_STATUS': {
            const state = tabState.get(message.tabId);
            return { success: true, data: state };
        }
        case 'UPDATE_SETTINGS': {
            logger.info('Settings updated, reloading');
            return { success: true, data: undefined };
        }
        default: {
            const exhaustive: never = message;
            logger.warn('Unhandled message type', { message: exhaustive });
            return { success: false, error: 'Unknown message type' };
        }
    }
});

// --- Lifecycle Events ---

chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabState.isActive(tabId)) {
        captionService.stop(tabId).catch((error: unknown) => {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error('Failed to stop caption on tab close', { tabId, error: msg });
        });
    }
    tabState.remove(tabId);
});

chrome.runtime.onInstalled.addListener((details) => {
    logger.info('Extension installed', { reason: details.reason });
});

logger.info('Service worker initialized');