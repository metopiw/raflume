interface LogTransport {
  level: string;
  format?: string;
}

interface AppLogger {
  initialize: () => void;
  transports: {
    file: LogTransport;
    console: LogTransport;
  };
  debug: (...data: unknown[]) => void;
  info: (...data: unknown[]) => void;
  warn: (...data: unknown[]) => void;
  error: (...data: unknown[]) => void;
}

const fallbackLogger: AppLogger = {
  initialize: () => undefined,
  transports: {
    file: { level: 'info' },
    console: { level: 'debug' },
  },
  debug: (...data) => console.debug(...data),
  info: (...data) => console.info(...data),
  warn: (...data) => console.warn(...data),
  error: (...data) => console.error(...data),
};

function loadLogger(): AppLogger {
  if (!process.versions.electron) return fallbackLogger;

  try {
    const loaded = require('electron-log/main') as AppLogger | { default: AppLogger };
    const logger = 'default' in loaded ? loaded.default : loaded;
    logger.initialize();
    logger.transports.file.level = 'info';
    logger.transports.console.level = 'debug';
    logger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
    return logger;
  } catch (error) {
    fallbackLogger.error('electron-log could not be initialized; console fallback is active.', error);
    return fallbackLogger;
  }
}

const log = loadLogger();

export default log;
