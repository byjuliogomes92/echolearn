// Structured logger that replaces console throughout the codebase.
// Every log entry carries a module name and timestamp, making it
// trivial to trace which context produced a given message.
//
// In production builds (__DEV__ = false), debug and info logs
// are suppressed to keep the browser console clean for users.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ILogEntry {
    level: LogLevel;
    module: string;
    message: string;
    timestamp: number;
    data?: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const MIN_LEVEL: LogLevel = typeof __DEV__ !== 'undefined' && __DEV__ ? 'debug' : 'warn';

function formatMessage(entry: ILogEntry): string {
    const time = new Date(entry.timestamp).toISOString().split('T')[1].slice(0, -1);
    return `[EchoLearn:${entry.module}] ${time} ${entry.message}`;
}

function log(level: LogLevel, module: string, message: string, data?: unknown): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LEVEL]) return;

    const entry: ILogEntry = {
        level,
        module,
        message,
        timestamp: Date.now(),
        data,
    };

    const formatted = formatMessage(entry);

    switch (level) {
        case 'debug':
            // eslint-disable-next-line no-console
            console.debug(formatted, data ?? '');
            break;
        case 'info':
            // eslint-disable-next-line no-console
            console.info(formatted, data ?? '');
            break;
        case 'warn':
            // eslint-disable-next-line no-console
            console.warn(formatted, data ?? '');
            break;
        case 'error':
            // eslint-disable-next-line no-console
            console.error(formatted, data ?? '');
            break;
    }
}

export type Logger = {
    debug: (message: string, data?: unknown) => void;
    info: (message: string, data?: unknown) => void;
    warn: (message: string, data?: unknown) => void;
    error: (message: string, data?: unknown) => void;
};

export function createLogger(module: string): Logger {
    return {
        debug: (message: string, data?: unknown) => log('debug', module, message, data),
        info: (message: string, data?: unknown) => log('info', module, message, data),
        warn: (message: string, data?: unknown) => log('warn', module, message, data),
        error: (message: string, data?: unknown) => log('error', module, message, data),
    };
}