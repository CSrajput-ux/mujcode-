/**
 * Centralized Language Registry for MUJCODE Compiler Engine
 * Exposes strictly the seven approved language families.
 */

export const LANGUAGES = [
  {
    id: 50,
    key: 'c',
    name: 'C (GCC)',
    aliases: ['c', 'c_gcc', '50'],
    extension: '.c',
    compiler: 'gcc',
    version: 'GCC 12.2+',
    isCompiled: true,
    supportsStdin: true,
    defaultTimeLimit: 2.0,
    maxTimeLimit: 10.0,
    defaultMemoryLimit: 256,
    maxMemoryLimit: 512,
    compileCmd: ['gcc', '-O2', '{sourceFile}', '-o', '{binaryFile}', '-lm'],
    runCmd: ['{binaryFile}']
  },
  {
    id: 54,
    key: 'cpp',
    name: 'C++ (G++)',
    aliases: ['cpp', 'c++', 'cplusplus', '54'],
    extension: '.cpp',
    compiler: 'g++',
    version: 'G++ 12.2+',
    isCompiled: true,
    supportsStdin: true,
    defaultTimeLimit: 2.0,
    maxTimeLimit: 10.0,
    defaultMemoryLimit: 256,
    maxMemoryLimit: 512,
    compileCmd: ['g++', '-O2', '{sourceFile}', '-o', '{binaryFile}'],
    runCmd: ['{binaryFile}']
  },
  {
    id: 62,
    key: 'java',
    name: 'Java (OpenJDK)',
    aliases: ['java', 'java17', 'java13', '62'],
    extension: '.java',
    compiler: 'javac / java',
    version: 'OpenJDK 17+',
    isCompiled: true,
    supportsStdin: true,
    defaultTimeLimit: 3.0,
    maxTimeLimit: 10.0,
    defaultMemoryLimit: 512,
    maxMemoryLimit: 1024,
    compileCmd: ['javac', '-encoding', 'UTF-8', '{sourceFile}'],
    runCmd: ['java', '-Xms32m', '-Xmx256m', '-Dfile.encoding=UTF-8', '{className}']
  },
  {
    id: 71,
    key: 'python',
    name: 'Python (Python 3)',
    aliases: ['python', 'python3', 'py', 'py3', '71'],
    extension: '.py',
    compiler: 'python3',
    version: 'Python 3.11+',
    isCompiled: false,
    supportsStdin: true,
    defaultTimeLimit: 3.0,
    maxTimeLimit: 10.0,
    defaultMemoryLimit: 256,
    maxMemoryLimit: 512,
    compileCmd: null,
    runCmd: ['python3', '-u', '{sourceFile}']
  },
  {
    id: 63,
    key: 'javascript',
    name: 'JavaScript (Node.js)',
    aliases: ['javascript', 'js', 'node', 'nodejs', '63'],
    extension: '.js',
    compiler: 'node',
    version: 'Node.js 20+ LTS',
    isCompiled: false,
    supportsStdin: true,
    defaultTimeLimit: 2.0,
    maxTimeLimit: 10.0,
    defaultMemoryLimit: 256,
    maxMemoryLimit: 512,
    compileCmd: null,
    runCmd: ['node', '--max-old-space-size=128', '{sourceFile}']
  },
  {
    id: 60,
    key: 'go',
    name: 'Go (Golang)',
    aliases: ['go', 'golang', '60'],
    extension: '.go',
    compiler: 'go',
    version: 'Go 1.20+',
    isCompiled: true,
    supportsStdin: true,
    defaultTimeLimit: 3.0,
    maxTimeLimit: 10.0,
    defaultMemoryLimit: 256,
    maxMemoryLimit: 512,
    compileCmd: ['go', 'build', '-o', '{binaryFile}', '{sourceFile}'],
    runCmd: ['{binaryFile}']
  },
  {
    id: 82,
    key: 'sql',
    name: 'SQL (Isolated Engine)',
    aliases: ['sql', 'sqlite', 'sqlite3', 'mysql', '82'],
    extension: '.sql',
    compiler: 'sqlite3 engine',
    version: 'SQLite 3.40+ (Isolated)',
    isCompiled: false,
    supportsStdin: true,
    defaultTimeLimit: 2.0,
    maxTimeLimit: 5.0,
    defaultMemoryLimit: 128,
    maxMemoryLimit: 256,
    compileCmd: null,
    runCmd: ['sqlite3']
  }
];

export function resolveLanguage(langInput) {
  if (langInput === null || langInput === undefined) {
    throw new Error('Language identifier is required');
  }

  const clean = String(langInput).toLowerCase().trim();

  // 1. Direct ID match
  const byId = LANGUAGES.find(l => String(l.id) === clean);
  if (byId) return byId;

  // 2. Direct key match
  const byKey = LANGUAGES.find(l => l.key === clean);
  if (byKey) return byKey;

  // 3. Alias match
  const byAlias = LANGUAGES.find(l => l.aliases.includes(clean));
  if (byAlias) return byAlias;

  const supported = LANGUAGES.map(l => `${l.name} (${l.key})`).join(', ');
  const err = new Error(`Unsupported language identifier: '${langInput}'. Only the 7 approved language families are supported: ${supported}`);
  err.statusCode = 400;
  throw err;
}
