// Deepgram implementation of the transcription engine.
// Deepgram provides higher accuracy than Web Speech API, especially
// for Portuguese and technical vocabulary. Requires an API key.

import { TRANSCRIPTION } from '../../shared/constants/index.js';
import { TranscriptionError } from '../../shared/errors/index.js';
import { createLogger } from '../../shared/logger/index.js';
import { ITranscriptionResult } from '../../shared/types/index.js';
import { ErrorCallback, TranscriptCallback } from './web-speech.engine.js';

const logger = createLogger('DeepgramEngine');

const DEEPGRAM_URL = 'wss://api.deepgram.com/v1/listen';

export class DeepgramEngine {
    private socket: WebSocket | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private isRunning = false;
    private reconnectCount = 0;

    constructor(
        private readonly apiKey: string,
        private readonly language: string,
        private readonly onTranscript: TranscriptCallback,
        private readonly onError: ErrorCallback,
    ) { }

    start(stream: MediaStream): void {
        if (this.isRunning) {
            logger.debug('Deepgram engine already running');
            return;
        }

        this.isRunning = true;
        this.reconnectCount = 0;
        this.connect(stream);
        logger.info('Deepgram engine started', { language: this.language });
    }

    stop(): void {
        this.isRunning = false;
        this.mediaRecorder?.stop();
        this.mediaRecorder = null;

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        logger.info('Deepgram engine stopped');
    }

    private connect(stream: MediaStream): void {
        const url = `${DEEPGRAM_URL}?language=${this.language}&interim_results=true&punctuate=true`;

        this.socket = new WebSocket(url, ['token', this.apiKey]);

        this.socket.onopen = () => {
            logger.debug('Deepgram WebSocket connected');
            this.startRecording(stream);
        };

        this.socket.onmessage = (event: MessageEvent) => {
            this.handleMessage(event);
        };

        this.socket.onerror = () => {
            logger.error('Deepgram WebSocket error');
            this.onError('Deepgram connection error');
        };

        this.socket.onclose = (event: CloseEvent) => {
            logger.debug('Deepgram WebSocket closed', { code: event.code });

            if (this.isRunning && this.reconnectCount < TRANSCRIPTION.MAX_RESTART_ATTEMPTS) {
                this.reconnectCount++;
                logger.debug('Reconnecting to Deepgram', { attempt: this.reconnectCount });
                setTimeout(() => { this.connect(stream); }, 1000);
            }
        };
    }

    private startRecording(stream: MediaStream): void {
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus',
        });

        this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
            if (event.data.size > 0 && this.socket?.readyState === WebSocket.OPEN) {
                this.socket.send(event.data);
            }
        };

        this.mediaRecorder.start(TRANSCRIPTION.RESTART_INTERVAL_MS);
        logger.debug('MediaRecorder started');
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const data = JSON.parse(event.data as string) as {
                channel?: {
                    alternatives?: Array<{
                        transcript?: string;
                        confidence?: number;
                    }>;
                };
                is_final?: boolean;
            };

            const alternative = data.channel?.alternatives?.[0];
            if (!alternative?.transcript) return;

            const result: ITranscriptionResult = {
                transcript: alternative.transcript,
                isFinal: data.is_final ?? false,
                confidence: alternative.confidence ?? 0,
                timestamp: Date.now(),
            };

            this.onTranscript(result);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            throw new TranscriptionError(`Failed to parse Deepgram response: ${msg}`);
        }
    }
}