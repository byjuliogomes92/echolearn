// Factory Pattern for transcription provider selection.
// The CaptionService never instantiates engines directly — it asks
// the factory, which reads settings and returns the right implementation.
// Adding a new provider means adding a case here, nothing else changes.

import { createLogger } from '../../shared/logger/index.js';
import { TranscriptionProvider } from '../../shared/types/index.js';
import { SettingsRepository } from '../repositories/settings.repository.js';

const logger = createLogger('TranscriptionEngineFactory');

export interface ITranscriptionEngine {
    readonly provider: TranscriptionProvider;
    start(streamId: string): Promise<void>;
    stop(): Promise<void>;
}

export type EngineType = 'webSpeech' | 'deepgram';

export class TranscriptionEngineFactory {
    constructor(private readonly settingsRepo: SettingsRepository) { }

    async create(): Promise<EngineType> {
        const settings = await this.settingsRepo.get();
        const provider = settings.provider;

        logger.debug('Creating transcription engine', { provider });

        switch (provider) {
            case 'webSpeech':
                return 'webSpeech';
            case 'deepgram':
                if (!settings.deepgramApiKey) {
                    logger.warn('Deepgram selected but no API key set, falling back to webSpeech');
                    return 'webSpeech';
                }
                return 'deepgram';
            default: {
                const exhaustive: never = provider;
                logger.warn('Unknown provider, falling back to webSpeech', { provider: exhaustive });
                return 'webSpeech';
            }
        }
    }

    async getLanguage(): Promise<string> {
        const settings = await this.settingsRepo.get();
        return settings.language;
    }

    async getDeepgramKey(): Promise<string | null> {
        const settings = await this.settingsRepo.get();
        return settings.deepgramApiKey;
    }
}