// Makes any HTML element draggable within the viewport.
// Position is preserved in memory for the session duration —
// intentionally not persisted to storage to keep the overlay
// feeling lightweight and non-intrusive.

import { createLogger } from '../../shared/logger/index.js';

const logger = createLogger('DragBehavior');

interface IPosition {
    x: number;
    y: number;
}

export class DragBehavior {
    private isDragging = false;
    private startPos: IPosition = { x: 0, y: 0 };
    private elementPos: IPosition = { x: 0, y: 0 };

    constructor(private readonly element: HTMLElement) {
        this.setInitialPosition();
        this.bindEvents();
    }

    destroy(): void {
        this.element.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    private setInitialPosition(): void {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        this.elementPos = {
            x: (viewportWidth - 400) / 2,
            y: viewportHeight - 120,
        };

        this.applyPosition();
    }

    private bindEvents(): void {
        this.element.addEventListener('mousedown', this.onMouseDown);
    }

    private onMouseDown = (e: MouseEvent): void => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('close-btn')) return;

        this.isDragging = true;
        this.startPos = { x: e.clientX - this.elementPos.x, y: e.clientY - this.elementPos.y };

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
        e.preventDefault();
    };

    private onMouseMove = (e: MouseEvent): void => {
        if (!this.isDragging) return;

        const newX = e.clientX - this.startPos.x;
        const newY = e.clientY - this.startPos.y;

        this.elementPos = this.clampToViewport(newX, newY);
        this.applyPosition();
    };

    private onMouseUp = (): void => {
        this.isDragging = false;
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        logger.debug('Overlay repositioned', this.elementPos);
    };

    private clampToViewport(x: number, y: number): IPosition {
        const rect = this.element.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        return {
            x: Math.max(0, Math.min(x, maxX)),
            y: Math.max(0, Math.min(y, maxY)),
        };
    }

    private applyPosition(): void {
        this.element.style.left = `${this.elementPos.x}px`;
        this.element.style.top = `${this.elementPos.y}px`;
    }
}