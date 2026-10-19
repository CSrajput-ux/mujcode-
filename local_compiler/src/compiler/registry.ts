/**
 * MUJCODE Local Compiler — Centralized Language Registry
 * Authoritative registry supporting strictly the seven approved language families.
 */

import { LanguageDefinition } from '../shared/executionTypes.js';

export const SUPPORTED_LANGUAGES: LanguageDefinition[] = [
  {
    id: 50,
    key: 'c',
    name: 'C (GCC)',
    aliases: ['c', 'c_gcc', '50'],
    extension: '.c',
    isCompiled: true,
    supportsStdin: true,
    defaultTimeLimitMs: 2000,
    maxTimeLimitMs: 10000,
    defaultMemoryLimitMb: 256,
    compilerCommand: 'gcc',
    runtimeExecutable: 'gcc'
  },
  {
    id: 54,
    key: 'cpp',
    name: 'C++ (G++)',
    aliases: ['cpp', 'c++', 'cplusplus', '54'],
    extension: '.cpp',
    isCompiled: true,
    supportsStdin: true,
    defaultTimeLimitMs: 2000,
    maxTimeLimitMs: 10000,
    defaultMemoryLimitMb: 256,
    compilerCommand: 'g++',
    runtimeExecutable: 'g++'
  },
  {
    id: 62,
    key: 'java',
    name: 'Java (OpenJDK)',
    aliases: ['java', 'java17', 'java13', '62'],
    extension: '.java',
    isCompiled: true,
    supportsStdin: true,
    defaultTimeLimitMs: 3000,
    maxTimeLimitMs: 10000,
    defaultMemoryLimitMb: 512,
    compilerCommand: 'javac',
    runtimeExecutable: 'java'
  },
  {
    id: 71,
    key: 'python',
    name: 'Python (Python 3)',
    aliases: ['python', 'python3', 'py', 'py3', '71'],
    extension: '.py',
    isCompiled: false,
    supportsStdin: true,
    defaultTimeLimitMs: 3000,
    maxTimeLimitMs: 10000,
    defaultMemoryLimitMb: 256,
    runtimeExecutable: 'python'
  },
  {
    id: 63,
    key: 'javascript',
    name: 'JavaScript (Node.js)',
    aliases: ['javascript', 'js', 'node', 'nodejs', '63'],
    extension: '.js',
    isCompiled: false,
    supportsStdin: true,
    defaultTimeLimitMs: 2000,
    maxTimeLimitMs: 10000,
    defaultMemoryLimitMb: 256,
    runtimeExecutable: 'node'
  },
  {
    id: 60,
    key: 'go',
    name: 'Go (Golang)',
    aliases: ['go', 'golang', '60'],
    extension: '.go',
    isCompiled: true,
    supportsStdin: true,
    defaultTimeLimitMs: 3000,
    maxTimeLimitMs: 10000,
    defaultMemoryLimitMb: 256,
    compilerCommand: 'go',
    runtimeExecutable: 'go'
  },
  {
    id: 82,
    key: 'sql',
    name: 'SQL (Isolated SQLite Engine)',
    aliases: ['sql', 'sqlite', 'sqlite3', '82'],
    extension: '.sql',
    isCompiled: false,
    supportsStdin: true,
    defaultTimeLimitMs: 2000,
    maxTimeLimitMs: 5000,
    defaultMemoryLimitMb: 128,
    runtimeExecutable: 'sql.js'
  }
];

export function resolveLanguage(input: string | number): LanguageDefinition {
  if (input === null || input === undefined) {
    throw new Error('Language identifier is required');
  }

  const clean = String(input).toLowerCase().trim();

  // 1. Direct ID match
  const byId = SUPPORTED_LANGUAGES.find((l) => String(l.id) === clean);
  if (byId) return byId;

  // 2. Direct key match
  const byKey = SUPPORTED_LANGUAGES.find((l) => l.key === clean);
  if (byKey) return byKey;

  // 3. Alias match
  const byAlias = SUPPORTED_LANGUAGES.find((l) => l.aliases.includes(clean));
  if (byAlias) return byAlias;

  const valid = SUPPORTED_LANGUAGES.map((l) => `${l.name} (id: ${l.id}, key: "${l.key}")`).join('\n  - ');
  throw new Error(`Unsupported language identifier: "${input}". Supported languages:\n  - ${valid}`);
}
