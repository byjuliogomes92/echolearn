// In-memory store for the state of every active tab.
// Service workers can be terminated at any time by Chrome — this state
// is intentionally ephemeral. If the worker restarts, tabs return to idle.

import { createLogger } from '../../shared/logger/index.js';
import { ITabState, ExtensionStatus, TranscriptionProvider } from '../../shared/types/index.js';

const logger = createLogger('TabStateManager');

export class TabStateManager {
    private readonly states = new Map<number, ITabState>();

    get(tabId: number): ITabState {
        return this.states.get(tabId) ?? this.createDefault(tabId);
    }

    set(tabId: number, partial: Partial<Omit<ITabState, 'tabId'>>): ITabState {
        const current = this.get(tabId);
        const updated: ITabState = { ...current, ...partial };
        this.states.set(tabId, updated);
        logger.debug('Tab state updated', { tabId, status: updated.status });
        return updated;
    }

    setStatus(tabId: number, status: ExtensionStatus): ITabState {
        return this.set(tabId, {
            status,
            errorMessage: status === 'error' ? this.get(tabId).errorMessage : null,
            startedAt: status === 'capturing' ? Date.now() : this.get(tabId).startedAt,
        });
    }

    setError(tabId: number, message: string): ITabState {
        return this.set(tabId, {
            status: 'error',
            errorMessage: message,
        });
    }

    remove(tabId: number): void {
        this.states.delete(tabId);
        logger.debug('Tab state removed', { tabId });
    }

    isActive(tabId: number): boolean {
        const state = this.states.get(tabId);
        return state?.status === 'capturing' || state?.status === 'transcribing';
    }

    getAll(): ITabState[] {
        return Array.from(this.states.values());
    }

    private createDefault(tabId: number): ITabState {
        return {
            tabId,
            status: 'idle',
            provider: 'webSpeech' as TranscriptionProvider,
            startedAt: null,
            errorMessage: null,
        };
    }
}