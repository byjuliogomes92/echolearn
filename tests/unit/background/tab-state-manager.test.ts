import { describe, it, expect, beforeEach } from 'vitest';
import { TabStateManager } from '../../../src/background/services/tab-state.manager.js';

describe('TabStateManager', () => {
    let manager: TabStateManager;

    beforeEach(() => {
        manager = new TabStateManager();
    });

    it('returns default state for unknown tab', () => {
        const state = manager.get(1);
        expect(state.tabId).toBe(1);
        expect(state.status).toBe('idle');
        expect(state.startedAt).toBeNull();
        expect(state.errorMessage).toBeNull();
    });

    it('sets status correctly', () => {
        manager.setStatus(1, 'capturing');
        const state = manager.get(1);
        expect(state.status).toBe('capturing');
        expect(state.startedAt).not.toBeNull();
    });

    it('clears startedAt when returning to idle', () => {
        manager.setStatus(1, 'capturing');
        manager.setStatus(1, 'idle');
        const state = manager.get(1);
        expect(state.startedAt).toBeNull();
    });

    it('sets error status and message', () => {
        manager.setError(1, 'stream lost');
        const state = manager.get(1);
        expect(state.status).toBe('error');
        expect(state.errorMessage).toBe('stream lost');
    });

    it('isActive returns true for capturing and transcribing', () => {
        manager.setStatus(1, 'capturing');
        expect(manager.isActive(1)).toBe(true);

        manager.setStatus(1, 'transcribing');
        expect(manager.isActive(1)).toBe(true);
    });

    it('isActive returns false for idle and error', () => {
        manager.setStatus(1, 'idle');
        expect(manager.isActive(1)).toBe(false);

        manager.setError(1, 'fail');
        expect(manager.isActive(1)).toBe(false);
    });

    it('removes tab state', () => {
        manager.setStatus(1, 'capturing');
        manager.remove(1);
        expect(manager.get(1).status).toBe('idle');
    });

    it('getAll returns all active states', () => {
        manager.setStatus(1, 'capturing');
        manager.setStatus(2, 'transcribing');
        expect(manager.getAll()).toHaveLength(2);
    });
});