import { z } from 'zod';

import { CaptionPosition, TranscriptionProvider } from '../types/index.js';

export const TranscriptionProviderSchema = z.enum(['webSpeech', 'deepgram'] as const satisfies readonly [TranscriptionProvider, ...TranscriptionProvider[]]);

export const CaptionPositionSchema = z.enum(['bottom', 'top', 'middle'] as const satisfies readonly [CaptionPosition, ...CaptionPosition[]]);

export const UserSettingsSchema = z.object({
    enabled: z.boolean(),
    provider: TranscriptionProviderSchema,
    fontSize: z.number().min(10).max(48),
    position: CaptionPositionSchema,
    opacity: z.number().min(0.1).max(1.0),
    deepgramApiKey: z.string().nullable(),
    language: z.string().min(2).max(10),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const DEFAULT_SETTINGS: UserSettings = {
    enabled: false,
    provider: 'webSpeech',
    fontSize: 18,
    position: 'bottom',
    opacity: 0.9,
    deepgramApiKey: null,
    language: 'pt-BR',
};

export type SettingsValidationResult =
    | { success: true; data: UserSettings }
    | { success: false; errors: string[] };

export function validateSettings(input: unknown): SettingsValidationResult {
    const result = UserSettingsSchema.safeParse(input);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );

    return { success: false, errors };
}

export function mergeWithDefaults(partial: Partial<UserSettings>): UserSettings {
    return UserSettingsSchema.parse({ ...DEFAULT_SETTINGS, ...partial });
}