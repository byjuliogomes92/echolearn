// The caption overlay is injected directly into the page DOM.
// It uses a Shadow DOM to isolate styles from the host page —
// preventing the EAD platform's CSS from leaking into the overlay.

import { DOM } from '../../shared/constants/index.js';
import { createLogger } from '../../shared/logger/index.js';
import { ExtensionStatus } from '../../shared/types/index.js';

const logger = createLogger('CaptionOverlay');

const OVERLAY_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

  :host {
    all: initial;
    position: fixed;
    z-index: 2147483647;
    font-family: 'Poppins', sans-serif;
    user-select: none;
  }

  .overlay {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: rgba(37, 43, 55, 0.88);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 10px;
    border: 1px solid rgba(38, 132, 255, 0.18);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.32);
    min-width: 200px;
    max-width: 680px;
    cursor: grab;
    transition: opacity 0.2s ease;
  }

  .overlay:active {
    cursor: grabbing;
  }

  .overlay.hidden {
    opacity: 0;
    pointer-events: none;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #2684FF;
    flex-shrink: 0;
  }

  .status-dot.error {
    background: #FF4D4F;
  }

  .status-dot.idle {
    background: #8C8C8C;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(245, 249, 255, 0.5);
    border-radius: 4px;
    transition: color 0.15s ease, background 0.15s ease;
    line-height: 1;
    font-size: 14px;
  }

  .close-btn:hover {
    color: #F5F9FF;
    background: rgba(245, 249, 255, 0.08);
  }

  .caption-text {
    font-size: 16px;
    font-weight: 400;
    color: #F5F9FF;
    line-height: 1.5;
    text-align: center;
    width: 100%;
    min-height: 24px;
    transition: opacity 0.15s ease;
  }

  .caption-text.interim {
    opacity: 0.6;
  }
`;

export class CaptionOverlay {
    private host: HTMLElement;
    private shadow: ShadowRoot;
    private overlayEl!: HTMLElement;
    private captionEl!: HTMLElement;
    private statusDot!: HTMLElement;
    private isVisible = false;

    constructor(private readonly onClose: () => void) {
        this.host = document.createElement('div');
        this.host.id = DOM.OVERLAY_ID;
        this.shadow = this.host.attachShadow({ mode: 'closed' });
        this.render();
        document.body.appendChild(this.host);
        logger.debug('Caption overlay mounted');
    }

    show(): void {
        this.overlayEl.classList.remove('hidden');
        this.isVisible = true;
    }

    hide(): void {
        this.overlayEl.classList.add('hidden');
        this.isVisible = false;
    }

    setCaption(text: string, isFinal: boolean): void {
        this.captionEl.textContent = text;
        this.captionEl.classList.toggle('interim', !isFinal);

        if (!this.isVisible && text) {
            this.show();
        }
    }

    setStatus(status: ExtensionStatus): void {
        this.statusDot.className = 'status-dot';

        switch (status) {
            case 'capturing':
            case 'transcribing':
                this.statusDot.classList.add('active');
                break;
            case 'error':
                this.statusDot.classList.add('error');
                break;
            case 'idle':
            case 'disabled':
                this.statusDot.classList.add('idle');
                break;
        }
    }

    destroy(): void {
        this.host.remove();
        logger.debug('Caption overlay destroyed');
    }

    private render(): void {
        const style = document.createElement('style');
        style.textContent = OVERLAY_STYLES;

        this.overlayEl = document.createElement('div');
        this.overlayEl.className = 'overlay hidden';

        const header = document.createElement('div');
        header.className = 'header';

        this.statusDot = document.createElement('div');
        this.statusDot.className = 'status-dot idle';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.textContent = '✕';
        closeBtn.setAttribute('aria-label', 'Fechar legendas');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.onClose();
        });

        header.appendChild(this.statusDot);
        header.appendChild(closeBtn);

        this.captionEl = document.createElement('div');
        this.captionEl.className = 'caption-text';
        this.captionEl.id = DOM.CAPTION_TEXT_ID;

        this.overlayEl.appendChild(header);
        this.overlayEl.appendChild(this.captionEl);
        this.shadow.appendChild(style);
        this.shadow.appendChild(this.overlayEl);
    }
}