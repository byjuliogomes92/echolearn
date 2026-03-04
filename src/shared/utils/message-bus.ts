// Typed wrapper over chrome.runtime.sendMessage and chrome.tabs.sendMessage.
// Raw chrome messaging accepts any object — this module enforces that only
// valid message shapes can be sent or received in each context.

import { createLogger } from '../logger/index.js';
import {
    BackgroundMessage,
    ContentMessage,
    OffscreenMessage,
    PopupMessage,
} from '../types/index.js';

const logger = createLogger('MessageBus');

export type AnyMessage =
    | BackgroundMessage
    | ContentMessage
    | OffscreenMessage
    | PopupMessage;

export type MessageResponse<T = void> =
    | { success: true; data: T }
    | { success: false; error: string };

function toMessageResponse(raw: unknown): MessageResponse {
    if (raw === null || raw === undefined) {
        return { success: true, data: undefined };
    }
    if (
        typeof raw === 'object' &&
        'success' in raw &&
        typeof (raw as Record<string, unknown>)['success'] === 'boolean'
    ) {
        return raw as MessageResponse;
    }
    return { success: true, data: undefined };
}

// --- Send to background service worker ---

export async function sendToBackground(
    message: BackgroundMessage,
): Promise<MessageResponse> {
    try {
        const raw: unknown = await chrome.runtime.sendMessage(message);
        logger.debug('Sent to background', { type: message.type });
        return toMessageResponse(raw);
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error('Failed to send to background', { type: message.type, error: msg });
        return { success: false, error: msg };
    }
}

// --- Send to content script in a specific tab ---

export async function sendToContent(
    tabId: number,
    message: ContentMessage,
): Promise<MessageResponse> {
    try {
        const raw: unknown = await chrome.tabs.sendMessage(tabId, message);
        logger.debug('Sent to content', { tabId, type: message.type });
        return toMessageResponse(raw);
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error('Failed to send to content', { tabId, type: message.type, error: msg });
        return { success: false, error: msg };
    }
}

// --- Send to offscreen document ---

export async function sendToOffscreen(
    message: OffscreenMessage,
): Promise<MessageResponse> {
    try {
        const raw: unknown = await chrome.runtime.sendMessage(message);
        logger.debug('Sent to offscreen', { type: message.type });
        return toMessageResponse(raw);
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error('Failed to send to offscreen', { type: message.type, error: msg });
        return { success: false, error: msg };
    }
}

// --- Listener helper ---

export function onMessage<T extends AnyMessage>(
    handler: (
        message: T,
        sender: chrome.runtime.MessageSender,
    ) => Promise<MessageResponse> | MessageResponse | void,
): void {
    chrome.runtime.onMessage.addListener(
        (message: unknown, sender, sendResponse) => {
            const result = handler(message as T, sender);

            if (result instanceof Promise) {
                result
                    .then(sendResponse)
                    .catch((error: unknown) => {
                        const msg = error instanceof Error ? error.message : String(error);
                        sendResponse({ success: false, error: msg });
                    });
                return true;
            }

            if (result !== undefined) {
                sendResponse(result);
            }
        },
    );
}