// Content script entry point.
// Injected into EAD platform pages by the manifest content_scripts rule.
// Mounts the overlay and registers the message handler.

import { createLogger } from '../shared/logger/index.js';
import { sendToBackground } from '../shared/utils/message-bus.js';
import { CaptionOverlay } from './components/caption-overlay.js';
import { DragBehavior } from './components/drag.behavior.js';
import { registerMessageHandler } from './message-handler.js';

const logger = createLogger('ContentScript');

function init(): void {
    if (document.getElementById('echolearn-caption-overlay')) {
        logger.debug('Overlay already mounted, skipping init');
        return;
    }

    const overlay = new CaptionOverlay(() => {
        void sendToBackground({ type: 'STOP_CAPTION', tabId: -1 });
    });

    const hostEl = document.getElementById('echolearn-caption-overlay');

    if (hostEl) {
        new DragBehavior(hostEl);
    }

    registerMessageHandler(overlay);

    logger.info('Content script initialized');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}