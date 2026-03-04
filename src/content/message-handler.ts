// Handles messages sent from the background service worker
// to the content script. Each message mutates the overlay state.

import { createLogger } from '../shared/logger/index.js';
import { ContentMessage } from '../shared/types/index.js';
import { onMessage } from '../shared/utils/message-bus.js';
import { CaptionOverlay } from './components/caption-overlay.js';

const logger = createLogger('ContentMessageHandler');

export function registerMessageHandler(overlay: CaptionOverlay): void {
    onMessage<ContentMessage>((message) => {
        switch (message.type) {
            case 'SHOW_CAPTION': {
                overlay.setCaption(message.text, message.isFinal);
                return { success: true, data: undefined };
            }
            case 'HIDE_CAPTION': {
                overlay.hide();
                return { success: true, data: undefined };
            }
            case 'SET_STATUS': {
                overlay.setStatus(message.status);
                logger.debug('Status updated', { status: message.status });
                return { success: true, data: undefined };
            }
            default: {
                const exhaustive: never = message;
                logger.warn('Unhandled content message', { message: exhaustive });
                return { success: false, error: 'Unknown message type' };
            }
        }
    });
}