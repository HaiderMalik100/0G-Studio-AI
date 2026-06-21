// bigint-patch.js - MUST be plain .js not .ts
const originalStringify = JSON.stringify;
JSON.stringify = function(value, replacer, space) {
  const safeReplacer = (k, v) => {
    if (typeof v === 'bigint') return v.toString();
    return typeof replacer === 'function' ? replacer(k, v) : v;
  };
  return originalStringify(value, safeReplacer, space);
};
console.log('[PATCH] BigInt JSON.stringify patch loaded');
