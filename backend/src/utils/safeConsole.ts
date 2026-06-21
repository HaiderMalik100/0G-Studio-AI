/**
 * Safe console patcher for production
 * Fixes: BigInt serialization, circular refs, Error objects
 * Only runs in non-production by default
 */

const isProd = process.env.NODE_ENV === 'production';

const safeStringify = (arg: any): string => {
  const seen = new WeakSet();

  try {
    return JSON.stringify(arg, (key, value) => {
      // 1. Handle BigInt - this fixes your 0G error
      if (typeof value === 'bigint') {
        return value.toString() + 'n'; // 12345n so you know it was BigInt
      }

      // 2. Handle Error objects
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      }

      // 3. Handle circular references
      if (typeof value === 'object' && value!== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }

      return value;
    });
  } catch {
    // Fallback for anything else weird
    return String(arg);
  }
};

const formatArg = (arg: any): string => {
  if (typeof arg === 'string') return arg;
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  return safeStringify(arg);
};

const addTimestamp = (args: any[]) => {
  const ts = new Date().toISOString();
  const formatted = args.map(formatArg);
  return [`[${ts}]`,...formatted];
};

export const patchConsoleSafely = (force = false) => {
  // Don't patch in production unless forced
  if (isProd &&!force) {
    console.log('[LOGGER] Skipping console patch in production');
    return;
  }

  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  console.log = (...args: any[]) => {
    original.log.apply(console, addTimestamp(args));
  };

  console.warn = (...args: any[]) => {
    original.warn.apply(console, addTimestamp(args));
  };

  console.error = (...args: any[]) => {
    original.error.apply(console, addTimestamp(args));
  };

  console.info = (...args: any[]) => {
    original.info.apply(console, addTimestamp(args));
  };

  console.log('[LOGGER] Console patched safely. BigInt + circular refs handled.');
};

// Optional: restore original console
export const unpatchConsole = () => {
  // If you ever need to remove it
  console.log('[LOGGER] Cannot unpatch - restart required');
};
