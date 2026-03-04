// Chrome MV3 allows only one offscreen document per extension.
// This manager handles the full lifecycle: lazy creation, reuse,
// and cleanup. Callers never interact with the offscreen API directly.

import { EXTENSION, OFFSCREEN } from '../../shared/constants/index.js';
import { OffscreenError } from '../../shared/errors/index.js';
import { createLogger } from '../../shared/logger/index.js';

const logger = createLogger('OffscreenManager');

export class OffscreenManager {
    private isCreating = false;

    async ensure(): Promise<void> {
        if (await this.exists()) {
            logger.debug('Offscreen document already exists');
            return;
        }

        if (this.isCreating) {
            logger.debug('Offscreen document already being created, waiting...');
            await this.waitForCreation();
            return;
        }

        await this.create();
    }

    async close(): Promise<void> {
        if (!(await this.exists())) {
            logger.debug('No offscreen document to close');
            return;
        }

        try {
            await chrome.offscreen.closeDocument();
            logger.info('Offscreen document closed');
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.warn('Failed to close offscreen document', { error: msg });
        }
    }

    private async exists(): Promise<boolean> {
        try {
            const contexts = await chrome.runtime.getContexts({
                contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
            });
            return contexts.length > 0;
        } catch {
            return false;
        }
    }

    private async create(): Promise<void> {
        this.isCreating = true;

        try {
            await Promise.race([
                chrome.offscreen.createDocument({
                    url: OFFSCREEN.DOCUMENT_PATH,
                    reasons: [OFFSCREEN.REASON],
                    justification: OFFSCREEN.JUSTIFICATION,
                }),
                this.timeout(),
            ]);
            logger.info('Offscreen document created');
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            throw new OffscreenError(`Failed to create offscreen document: ${msg}`);
        } finally {
            this.isCreating = false;
        }
    }

    private timeout(): Promise<never> {
        return new Promise((_, reject) =>
            setTimeout(
                () => reject(new OffscreenError('Offscreen document creation timed out')),
                EXTENSION.OFFSCREEN_INIT_TIMEOUT_MS,
            ),
        );
    }

    private async waitForCreation(): Promise<void> {
        const start = Date.now();

        while (this.isCreating) {
            if (Date.now() - start > EXTENSION.OFFSCREEN_INIT_TIMEOUT_MS) {
                throw new OffscreenError('Timed out waiting for offscreen document');
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
}