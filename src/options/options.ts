// Options page logic — loads settings from storage, handles
// form changes, save and reset actions.

import { createLogger } from '../shared/logger/index.js';
import { sendToBackground } from '../shared/utils/message-bus.js';
import { DEFAULT_SETTINGS, UserSettings } from '../shared/validation/settings.schema.js';

const logger = createLogger('Options');

function getElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found`);
    return el as T;
}

const providerSelect = getElement<HTMLSelectElement>('provider');
const deepgramKeyField = getElement<HTMLElement>('deepgram-key-field');
const deepgramKeyInput = getElement<HTMLInputElement>('deepgram-key');
const languageSelect = getElement<HTMLSelectElement>('language');
const fontSizeInput = getElement<HTMLInputElement>('font-size');
const fontSizeValue = getElement<HTMLElement>('font-size-value');
const opacityInput = getElement<HTMLInputElement>('opacity');
const opacityValue = getElement<HTMLElement>('opacity-value');
const positionSelect = getElement<HTMLSelectElement>('position');
const saveBtn = getElement<HTMLButtonElement>('save-btn');
const resetBtn = getElement<HTMLButtonElement>('reset-btn');
const toast = getElement<HTMLElement>('toast');

function showToast(message: string): void {
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => { toast.classList.remove('visible'); }, 2500);
}

function populateForm(settings: UserSettings): void {
    providerSelect.value = settings.provider;
    deepgramKeyInput.value = settings.deepgramApiKey ?? '';
    languageSelect.value = settings.language;
    fontSizeInput.value = String(settings.fontSize);
    fontSizeValue.textContent = `${settings.fontSize}px`;
    opacityInput.value = String(Math.round(settings.opacity * 100));
    opacityValue.textContent = `${Math.round(settings.opacity * 100)}%`;
    positionSelect.value = settings.position;
    deepgramKeyField.style.display = settings.provider === 'deepgram' ? 'flex' : 'none';
}

function readForm(): UserSettings {
    return {
        enabled: true,
        provider: providerSelect.value as UserSettings['provider'],
        deepgramApiKey: deepgramKeyInput.value.trim() || null,
        language: languageSelect.value,
        fontSize: Number(fontSizeInput.value),
        opacity: Number(opacityInput.value) / 100,
        position: positionSelect.value as UserSettings['position'],
    };
}

async function loadSettings(): Promise<void> {
    const result = await chrome.storage.sync.get('echolearn_settings');
    const raw: unknown = result['echolearn_settings'];
    const settings = (raw as UserSettings | undefined) ?? DEFAULT_SETTINGS;
    populateForm(settings);
    logger.debug('Settings loaded');
}

providerSelect.addEventListener('change', () => {
    deepgramKeyField.style.display =
        providerSelect.value === 'deepgram' ? 'flex' : 'none';
});

fontSizeInput.addEventListener('input', () => {
    fontSizeValue.textContent = `${fontSizeInput.value}px`;
});

opacityInput.addEventListener('input', () => {
    opacityValue.textContent = `${opacityInput.value}%`;
});

saveBtn.addEventListener('click', () => {
    void (async () => {
        const settings = readForm();
        await chrome.storage.sync.set({ echolearn_settings: settings });
        await sendToBackground({ type: 'UPDATE_SETTINGS' });
        showToast('Configurações salvas');
        logger.info('Settings saved');
    })();
});

resetBtn.addEventListener('click', () => {
    void (async () => {
        await chrome.storage.sync.set({ echolearn_settings: DEFAULT_SETTINGS });
        populateForm(DEFAULT_SETTINGS);
        showToast('Configurações restauradas');
        logger.info('Settings reset');
    })();
});

void loadSettings();