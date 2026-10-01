/**
 * MujCode Security Sanitizer
 * Protects against Prototype Pollution and MongoDB/NoSQL Operator Injections
 */

const FORBIDDEN_PROTOTYPE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Strips prototype pollution keys (__proto__, constructor, prototype) recursively.
 */
export function sanitizePrototype(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizePrototype);
  }

  const clean = Object.create(null);
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_PROTOTYPE_KEYS.has(key)) {
      continue;
    }
    clean[key] = sanitizePrototype(obj[key]);
  }
  return { ...clean };
}

/**
 * Strips NoSQL / MongoDB operator injection keys ($where, $ne, $gt, etc.)
 * from untrusted user input before passing to query layers.
 */
export function sanitizeMongoQuery(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeMongoQuery);
  }

  const clean = Object.create(null);
  for (const [key, value] of Object.entries(obj)) {
    // Strip forbidden prototype keys
    if (FORBIDDEN_PROTOTYPE_KEYS.has(key)) {
      continue;
    }
    // If key starts with '$' (e.g. $gt, $ne, $where), strip it
    if (key.startsWith('$')) {
      continue;
    }
    clean[key] = sanitizeMongoQuery(value);
  }
  return { ...clean };
}

/**
 * Universal input sanitizer combining prototype defense and NoSQL query hardening
 */
export function sanitizeInput(input) {
  return sanitizeMongoQuery(sanitizePrototype(input));
}

