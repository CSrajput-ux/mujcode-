export interface LanguageConfig {
  extension: string;
  imageName: string;
  compileCmd?: string;
  runCmd: string;
  timeLimitMs: number;
  memoryLimitMB: number;
}

export const languageConfigs: Record<string, LanguageConfig> = {
  c: {
    extension: 'c',
    imageName: 'mujcode-compiler-cpp',
    compileCmd: 'gcc -O2 -w code.c -o a.out',
    runCmd: './a.out',
    timeLimitMs: 2000,
    memoryLimitMB: 256,
  },
  cpp: {
    extension: 'cpp',
    imageName: 'mujcode-compiler-cpp',
    compileCmd: 'g++ -O2 -w code.cpp -o a.out',
    runCmd: './a.out',
    timeLimitMs: 2000,
    memoryLimitMB: 256,
  },
  java: {
    extension: 'java',
    imageName: 'mujcode-compiler-java',
    compileCmd: 'javac Solution.java',
    runCmd: 'java Solution',
    timeLimitMs: 4000, // Java needs more startup time
    memoryLimitMB: 512,
  },
  python: {
    extension: 'py',
    imageName: 'mujcode-compiler-python',
    runCmd: 'python code.py',
    timeLimitMs: 5000,
    memoryLimitMB: 256,
  },
  javascript: {
    extension: 'js',
    imageName: 'mujcode-compiler-node',
    runCmd: 'node code.js',
    timeLimitMs: 5000,
    memoryLimitMB: 256,
  },
  go: {
    extension: 'go',
    imageName: 'mujcode-compiler-go',
    compileCmd: 'go build -o a.out code.go',
    runCmd: './a.out',
    timeLimitMs: 2000,
    memoryLimitMB: 256,
  },
  rust: {
    extension: 'rs',
    imageName: 'mujcode-compiler-rust',
    compileCmd: 'rustc code.rs -o a.out',
    runCmd: './a.out',
    timeLimitMs: 2000,
    memoryLimitMB: 256,
  },
  csharp: {
    extension: 'cs',
    imageName: 'mujcode-compiler-csharp',
    compileCmd: 'mcs code.cs -out:code.exe',
    runCmd: 'mono code.exe',
    timeLimitMs: 4000,
    memoryLimitMB: 512,
  },
  php: {
    extension: 'php',
    imageName: 'mujcode-compiler-php',
    runCmd: 'php code.php',
    timeLimitMs: 5000,
    memoryLimitMB: 256,
  },
};
