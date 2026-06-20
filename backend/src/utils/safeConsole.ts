// utils/safeConsole.ts

const safeStringify = (arg: any) => {
  try {
    return JSON.stringify(arg, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  } catch {
    return String(arg);
  }
};

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

export const patchConsoleSafely = () => {
  console.log = (...args: any[]) => {
    try {
      originalLog(...args.map(a =>
        typeof a === 'object' ? safeStringify(a) : a
      ));
    } catch {
      originalLog(...args);
    }
  };

  console.error = (...args: any[]) => {
    try {
      originalError(...args.map(a =>
        typeof a === 'object' ? safeStringify(a) : a
      ));
    } catch {
      originalError(...args);
    }
  };

  console.warn = (...args: any[]) => {
    try {
      originalWarn(...args.map(a =>
        typeof a === 'object' ? safeStringify(a) : a
      ));
    } catch {
      originalWarn(...args);
    }
  };
};