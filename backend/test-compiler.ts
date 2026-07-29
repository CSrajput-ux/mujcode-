import { CompilerFactory } from './compiler/CompilerFactory.js';

async function testPython() {
  const code = `
import sys
# Read two integers and print their sum
try:
    a, b = map(int, sys.stdin.read().split())
    print(a + b)
except ValueError:
    print("No input")
`;

  const testCases = [
    { input: '3 4\n', expectedOutput: '7\n' },
    { input: '10 20\n', expectedOutput: '30\n' }
  ];

  console.log('Running Python test...');
  const result = await CompilerFactory.execute(code, 'python', testCases, 'submit');
  console.log('Python Result:', result);
}

testPython().catch(console.error);
