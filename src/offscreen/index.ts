// Entry point for the offscreen document.
// Receives messages from the background service worker and
// delegates to the AudioCaptureProcessor.

import { createLogger } from '../shared/logger/index.js';
import { OffscreenMessage } from '../shared/types/index.js';
import { onMessage, sendToBackground } from '../shared/utils/message-bus.js';
import { AudioCaptureProcessor } from './audio/audio-capture.processor.js';


const logger = createLogger('Offscreen');
const processor = new AudioCaptureProcessor();

onMessage<OffscreenMessage>(async (message) => {
    switch (message.type) {
        case 'INIT_AUDIO': {
            await processor.start(
                message.streamId,
                message.provider,
                'pt-BR',
                (result) => {
                    void sendToBackground({
                        type: 'TRANSCRIPTION_RESULT',
                        result,
                    });
                },
                (error) => {
                    void sendToBackground({
                        type: 'TRANSCRIPTION_ERROR',
                        error,
                    });
                },
            );
            return { success: true, data: undefined };
        }
        case 'STOP_AUDIO': {
            processor.stop();
            return { success: true, data: undefined };
        }
        case 'TRANSCRIPTION_RESULT':
        case 'TRANSCRIPTION_ERROR': {
            return { success: true, data: undefined };
        }
        default: {
            const exhaustive: never = message;
            logger.warn('Unhandled offscreen message', { message: exhaustive });
            return { success: false, error: 'Unknown message type' };
        }
    }
});

logger.info('Offscreen document initialized');