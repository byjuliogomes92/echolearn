// Web Speech API implementation of the transcription engine.
// The API is free, works offline, and requires no API key —
// making it the default provider for all users.
//
// Known limitation: Chrome silently stops recognition after ~25s
// of audio. The restart mechanism in this class compensates for that.

import { TRANSCRIPTION } from '../../shared/constants/index.js';
import { createLogger } from '../../shared/logger/index.js';
import { ITranscriptionResult } from '../../shared/types/index.js';

const logger = createLogger('WebSpeechEngine');

export type TranscriptCallback = (result: ITranscriptionResult) => void;
export type ErrorCallback = (error: string) => void;

export class WebSpeechEngine {
    private recognition: SpeechRecognition | null = null;
    private restartCount = 0;
    private restartTimer: ReturnType<typeof setTimeout> | null = null;
    private isRunning = false;

    constructor(
        private readonly language: string,
        private readonly onTranscript: TranscriptCallback,
        private readonly onError: ErrorCallback,
    ) { }

    start(): void {
        if (this.isRunning) {
            logger.debug('Web Speech engine already running');
            return;
        }

        this.isRunning = true;
        this.restartCount = 0;
        this.initRecognition();
        this.recognition?.start();
        logger.info('Web Speech engine started', { language: this.language });
    }

    stop(): void {
        this.isRunning = false;
        this.clearRestartTimer();

        if (this.recognition) {
            this.recognition.onend = null;
            this.recognition.onerror = null;
            this.recognition.onresult = null;
            this.recognition.stop();
            this.recognition = null;
        }

        logger.info('Web Speech engine stopped');
    }

    private initRecognition(): void {
        const SpeechRecognitionAPI =
            (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
            ?? window.SpeechRecognition;

        if (!SpeechRecognitionAPI) {
            this.onError('SpeechRecognition API not available');
            return;
        }

        this.recognition = new SpeechRecognitionAPI();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.language;
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
            const result = event.results[event.results.length - 1];
            if (!result) return;

            const alternative = result[0];
            if (!alternative) return;

            this.onTranscript({
                transcript: alternative.transcript,
                isFinal: result.isFinal,
                confidence: alternative.confidence,
                timestamp: Date.now(),
            });
        };

        this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error === 'no-speech') {
                logger.debug('No speech detected, restarting');
                this.scheduleRestart();
                return;
            }

            logger.error('Speech recognition error', { error: event.error });
            this.onError(event.error);
        };

        this.recognition.onend = () => {
            if (this.isRunning) {
                logger.debug('Recognition ended, scheduling restart');
                this.scheduleRestart();
            }
        };
    }

    private scheduleRestart(): void {
        if (!this.isRunning) return;

        if (this.restartCount >= TRANSCRIPTION.MAX_RESTART_ATTEMPTS) {
            logger.error('Max restart attempts reached');
            this.onError('Max restart attempts reached');
            return;
        }

        this.clearRestartTimer();
        this.restartTimer = setTimeout(() => {
            if (!this.isRunning) return;

            this.restartCount++;
            logger.debug('Restarting recognition', { attempt: this.restartCount });
            this.initRecognition();
            this.recognition?.start();
        }, TRANSCRIPTION.RESTART_INTERVAL_MS);
    }

    private clearRestartTimer(): void {
        if (this.restartTimer !== null) {
            clearTimeout(this.restartTimer);
            this.restartTimer = null;
        }
    }
}