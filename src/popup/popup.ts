// Popup logic — queries current tab status and handles toggle.

import { createLogger } from '../shared/logger/index.js';
import { ITabState, ExtensionStatus } from '../shared/types/index.js';
import { sendToBackground } from '../shared/utils/message-bus.js';

const logger = createLogger('Popup');

function getElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found`);
    return el as T;
}

const toggleBtn = getElement<HTMLButtonElement>('toggle-btn');
const toggleLabel = getElement<HTMLElement>('toggle-label');
const statusIndicator = getElement<HTMLElement>('status-indicator');
const statusText = getElement<HTMLElement>('status-text');
const hint = getElement<HTMLElement>('hint');
const optionsLink = getElement<HTMLAnchorElement>('options-link');

let currentTabId: number | null = null;
let currentStatus: ExtensionStatus = 'idle';

function updateUI(status: ExtensionStatus): void {
    currentStatus = status;

    statusIndicator.className = 'status-indicator';
    toggleBtn.className = 'toggle-btn';

    switch (status) {
        case 'capturing':
        case 'transcribing': {
            statusIndicator.classList.add('active');
            statusText.textContent = 'Legendas ativas';
            toggleLabel.textContent = 'Desativar Legendas';
            toggleBtn.classList.add('active');
            toggleBtn.disabled = false;
            hint.textContent = 'Arraste o painel para reposicionar';
            break;
        }
        case 'error': {
            statusIndicator.classList.add('error');
            statusText.textContent = 'Erro na captura';
            toggleLabel.textContent = 'Tentar novamente';
            toggleBtn.disabled = false;
            hint.textContent = 'Verifique as permissões do microfone';
            break;
        }
        case 'idle': {
            statusText.textContent = 'Inativo';
            toggleLabel.textContent = 'Ativar Legendas';
            toggleBtn.disabled = false;
            hint.textContent = '';
            break;
        }
        case 'disabled': {
            statusText.textContent = 'Indisponível';
            toggleLabel.textContent = 'Ativar Legendas';
            toggleBtn.disabled = true;
            hint.textContent = 'Abra uma aula para ativar';
            break;
        }
    }
}

async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab ?? null;
}

async function init(): Promise<void> {
    const tab = await getCurrentTab();

    if (!tab?.id) {
        updateUI('disabled');
        return;
    }

    currentTabId = tab.id;

    const response = await sendToBackground({
        type: 'GET_STATUS',
        tabId: currentTabId,
    });

    if (response.success) {
        const state = response.data as ITabState;
        updateUI(state.status);
    } else {
        updateUI('idle');
    }

    toggleBtn.addEventListener('click', () => {
        void (async () => {
            if (!currentTabId) return;

            const isActive = currentStatus === 'capturing' || currentStatus === 'transcribing';

            const response = await sendToBackground({
                type: isActive ? 'STOP_CAPTION' : 'START_CAPTION',
                tabId: currentTabId,
                ...(isActive ? {} : { provider: 'webSpeech' }),
            });

            if (response.success) {
                updateUI(isActive ? 'idle' : 'capturing');
            }
        })();
    });

    logger.debug('Popup initialized', { tabId: currentTabId });
}

optionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    void chrome.runtime.openOptionsPage();
});

void init();