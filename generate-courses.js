import fs from 'fs/promises';
import path from 'path';

const COURSE_DIR = path.join(process.cwd(), 'course');
const TARGET_MODULES = 20;

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Helper: Capitalize string
function capitalize(s) {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------
// 1. CODING PROBLEM GENERATOR (Shared by C++, Java, JS, Python, CP, DSA, DAA)
// ---------------------------------------------------------
function getCodingQuestion(courseId, moduleNum, qNum) {
    const qIndex = (moduleNum - 1) * 5 + qNum;
    
    // Choose programming language based on courseId
    let lang = 'python';
    if (courseId.includes('cpp')) lang = 'cpp';
    else if (courseId.includes('java_')) lang = 'java';
    else if (courseId.includes('javascript')) lang = 'javascript';
    else if (courseId.includes('c_programming')) lang = 'c';
    
    // List of 100 standard programming tasks (id, title, difficulty, points, topic, description, inputFormat, outputFormat, constraints, tags, templates)
    const taskDatabase = {
        // Module 2: Basic Arithmetic
        6: {
            title: "Sum of Two Integers",
            difficulty: "Easy",
            points: 5,
            topic: "Basic Arithmetic",
            description: "Given two integers A and B, calculate and return their sum.",
            inputFormat: "Two space-separated integers A and B.",
            outputFormat: "Print the sum of A and B.",
            constraints: "-10^9 <= A, B <= 10^9",
            examples: [{ input: "5 10", output: "15" }],
            testCases: [{ input: "5 10", output: "15" }, { input: "-3 3", output: "0" }, { input: "100 200", output: "300" }, { input: "0 0", output: "0" }, { input: "-50 -50", output: "-100" }],
            tags: ["math", "basic", "arithmetic"],
            pyStarter: "def sum_two(a, b):\n    # Your code here\n    pass\n\na, b = map(int, input().split())\nprint(sum_two(a, b))",
            pySol: "def sum_two(a, b):\n    return a + b\n\na, b = map(int, input().split())\nprint(sum_two(a, b))",
            cppStarter: "#include <iostream>\nusing namespace std;\n\nint sumTwo(int a, int b) {\n    // Your code here\n}\n\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        cout << sumTwo(a, b) << endl;\n    }\n    return 0;\n}",
            cppSol: "#include <iostream>\nusing namespace std;\n\nint sumTwo(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        cout << sumTwo(a, b) << endl;\n    }\n    return 0;\n}",
            javaStarter: "import java.util.Scanner;\n\npublic class Main {\n    public static int sumTwo(int a, int b) {\n        // Your code here\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(sumTwo(a, b));\n        }\n    }\n}",
            javaSol: "import java.util.Scanner;\n\npublic class Main {\n    public static int sumTwo(int a, int b) {\n        return a + b;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(sumTwo(a, b));\n        }\n    }\n}",
            jsStarter: "function sumTwo(a, b) {\n    // Your code here\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    console.log(sumTwo(parseInt(input[0]), parseInt(input[1])));\n}",
            jsSol: "function sumTwo(a, b) {\n    return a + b;\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    console.log(sumTwo(parseInt(input[0]), parseInt(input[1])));\n}"
        },
        7: {
            title: "Product of Two Integers",
            difficulty: "Easy",
            points: 5,
            topic: "Basic Arithmetic",
            description: "Given two integers A and B, calculate and return their product.",
            inputFormat: "Two space-separated integers A and B.",
            outputFormat: "Print the product of A and B.",
            constraints: "-10^4 <= A, B <= 10^4",
            examples: [{ input: "4 5", output: "20" }],
            testCases: [{ input: "4 5", output: "20" }, { input: "-3 4", output: "-12" }, { input: "0 9", output: "0" }, { input: "-2 -5", output: "10" }, { input: "100 10", output: "1000" }],
            tags: ["math", "multiplication"],
            pyStarter: "def multiply_two(a, b):\n    # Your code here\n    pass\n\na, b = map(int, input().split())\nprint(multiply_two(a, b))",
            pySol: "def multiply_two(a, b):\n    return a * b\n\na, b = map(int, input().split())\nprint(multiply_two(a, b))",
            cppStarter: "#include <iostream>\nusing namespace std;\n\nint multiplyTwo(int a, int b) {\n    // Your code here\n}\n\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        cout << multiplyTwo(a, b) << endl;\n    }\n    return 0;\n}",
            cppSol: "#include <iostream>\nusing namespace std;\n\nint multiplyTwo(int a, int b) {\n    return a * b;\n}\n\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        cout << multiplyTwo(a, b) << endl;\n    }\n    return 0;\n}",
            javaStarter: "import java.util.Scanner;\n\npublic class Main {\n    public static int multiplyTwo(int a, int b) {\n        // Your code here\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(multiplyTwo(a, b));\n        }\n    }\n}",
            javaSol: "import java.util.Scanner;\n\npublic class Main {\n    public static int multiplyTwo(int a, int b) {\n        return a * b;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(multiplyTwo(a, b));\n        }\n    }\n}",
            jsStarter: "function multiplyTwo(a, b) {\n    // Your code here\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    console.log(multiplyTwo(parseInt(input[0]), parseInt(input[1])));\n}",
            jsSol: "function multiplyTwo(a, b) {\n    return a * b;\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    console.log(multiplyTwo(parseInt(input[0]), parseInt(input[1])));\n}"
        },
        8: {
            title: "Difference of Two",
            difficulty: "Easy",
            points: 5,
            topic: "Basic Arithmetic",
            description: "Given two integers A and B, calculate and return A minus B.",
            inputFormat: "Two space-separated integers A and B.",
            outputFormat: "Print the difference.",
            constraints: "-10^9 <= A, B <= 10^9",
            examples: [{ input: "10 4", output: "6" }],
            testCases: [{ input: "10 4", output: "6" }, { input: "5 10", output: "-5" }, { input: "-3 -3", output: "0" }, { input: "100 0", output: "100" }, { input: "0 50", output: "-50" }],
            tags: ["math", "subtraction"],
            pyStarter: "def subtract_two(a, b):\n    # Your code here\n    pass\n\na, b = map(int, input().split())\nprint(subtract_two(a, b))",
            pySol: "def subtract_two(a, b):\n    return a - b\n\na, b = map(int, input().split())\nprint(subtract_two(a, b))",
            cppStarter: "#include <iostream>\nusing namespace std;\n\nint subtractTwo(int a, int b) {\n    // Your code here\n}\n\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        cout << subtractTwo(a, b) << endl;\n    }\n    return 0;\n}",
            cppSol: "#include <iostream>\nusing namespace std;\n\nint subtractTwo(int a, int b) {\n    return a - b;\n}\n\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        cout << subtractTwo(a, b) << endl;\n    }\n    return 0;\n}",
            javaStarter: "import java.util.Scanner;\n\npublic class Main {\n    public static int subtractTwo(int a, int b) {\n        // Your code here\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(subtractTwo(a, b));\n        }\n    }\n}",
            javaSol: "import java.util.Scanner;\n\npublic class Main {\n    public static int subtractTwo(int a, int b) {\n        return a - b;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(subtractTwo(a, b));\n        }\n    }\n}",
            jsStarter: "function subtractTwo(a, b) {\n    // Your code here\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    console.log(subtractTwo(parseInt(input[0]), parseInt(input[1])));\n}",
            jsSol: "function subtractTwo(a, b) {\n    return a - b;\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    console.log(subtractTwo(parseInt(input[0]), parseInt(input[1])));\n}"
        },
        9: {
            title: "Quotient of Division",
            difficulty: "Easy",
            points: 5,
            topic: "Basic Arithmetic",
            description: "Given two integers A and B, return the quotient of A divided by B (integer division).",
            inputFormat: "Two space-separated integers A and B.",
            outputFormat: "Print the quotient.",
            constraints: "-10^9 <= A <= 10^9, 1 <= B <= 10^9",
            examples: [{ input: "7 3", output: "2" }],
            testCases: [{ input: "7 3", output: "2" }, { input: "10 5", output: "2" }, { input: "1 2", output: "0" }, { input: "100 1", output: "100" }, { input: "25 4", output: "6" }],
            tags: ["math", "division"],
            pyStarter: "def divide_two(a, b):\n    # Your code here\n    pass\n\na, b = map(int, input().split())\nprint(divide_two(a, b))",
            pySol: "def divide_two(a, b):\n    return a // b\n\na, b = map(int, input().split())\nprint(divide_two(a, b))",
            cppStarter: "#include <iostream>\nusing namespace std;\n\nint divideTwo(int a, int b) {\n    // Your code here\n}\n\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        cout << divideTwo(a, b) << endl;\n    }\n    return 0;\n}",
            cppSol: "#include <iostream>\nusing namespace std;\n\nint divideTwo(int a, int b) {\n    return a / b;\n}\n\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        cout << divideTwo(a, b) << endl;\n    }\n    return 0;\n}",
            javaStarter: "import java.util.Scanner;\n\npublic class Main {\n    public static int divideTwo(int a, int b) {\n        // Your code here\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(divideTwo(a, b));\n        }\n    }\n}",
            javaSol: "import java.util.Scanner;\n\npublic class Main {\n    public static int divideTwo(int a, int b) {\n        return a / b;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(divideTwo(a, b));\n        }\n    }\n}",
            jsStarter: "function divideTwo(a, b) {\n    // Your code here\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    console.log(divideTwo(parseInt(input[0]), parseInt(input[1])));\n}",
            jsSol: "function divideTwo(a, b) {\n    return Math.floor(a / b);\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    console.log(divideTwo(parseInt(input[0]), parseInt(input[1])));\n}"
        },
        10: {
            title: "Remainder of Division",
            difficulty: "Easy",
            points: 5,
            topic: "Basic Arithmetic",
            description: "Given two integers A and B, return the remainder (modulo) when A is divided by B.",
            inputFormat: "Two space-separated integers A and B.",
            outputFormat: "Print the remainder.",
            constraints: "-10^9 <= A <= 10^9, 1 <= B <= 10^9",
            examples: [{ input: "7 3", output: "1" }],
            testCases: [{ input: "7 3", output: "1" }, { input: "10 5", output: "0" }, { input: "1 2", output: "1" }, { input: "100 7", output: "2" }, { input: "15 4", output: "3" }],
            tags: ["math", "modulo"],
            pyStarter: "def mod_two(a, b):\n    # Your code here\n    pass\n\na, b = map(int, input().split())\nprint(mod_two(a, b))",
            pySol: "def mod_two(a, b):\n    return a % b\n\na, b = map(int, input().split())\nprint(mod_two(a, b))",
            cppStarter: "#include <iostream>\nusing namespace std;\n\nint modTwo(int a, int b) {\n    // Your code here\n}\n\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        cout << modTwo(a, b) << endl;\n    }\n    return 0;\n}",
            cppSol: "#include <iostream>\nusing namespace std;\n\nint modTwo(int a, int b) {\n    return a % b;\n}\n\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        cout << modTwo(a, b) << endl;\n    }\n    return 0;\n}",
            javaStarter: "import java.util.Scanner;\n\npublic class Main {\n    public static int modTwo(int a, int b) {\n        // Your code here\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(modTwo(a, b));\n        }\n    }\n}",
            javaSol: "import java.util.Scanner;\n\npublic class Main {\n    public static int modTwo(int a, int b) {\n        return a % b;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(modTwo(a, b));\n        }\n    }\n}",
            jsStarter: "function modTwo(a, b) {\n    // Your code here\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    console.log(modTwo(parseInt(input[0]), parseInt(input[1])));\n}",
            jsSol: "function modTwo(a, b) {\n    return a % b;\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    console.log(modTwo(parseInt(input[0]), parseInt(input[1])));\n}"
        }
    };
    
    // Fallback/Generic generator for indexes 11 to 100
    const topicsList = [
        "Basic Arithmetic", // 2 (6-10)
        "String Basics",     // 3 (11-15)
        "Simple Conditions", // 4 (16-20)
        "Basic Loops",       // 5 (21-25)
        "Arrays and Lists",  // 6 (26-30)
        "Search and Sort",   // 7 (31-35)
        "String Manipulation",// 8 (36-40)
        "Basic Recursion",   // 9 (41-45)
        "Stack and Queue",   // 10 (46-50)
        "Binary Trees",      // 11 (51-55)
        "Graphs",            // 12 (56-60)
        "Greedy Algorithms", // 13 (61-65)
        "Dynamic Programming",// 14 (66-70)
        "Bit Manipulation",  // 15 (71-75)
        "Number Theory",     // 16 (76-80)
        "Matrix and Grid",   // 17 (81-85)
        "Hashing",           // 18 (86-90)
        "Two Pointers",      // 19 (91-95)
        "Sliding Window"     // 20 (96-100)
    ];
    
    const currentTopic = topicsList[moduleNum - 2] || "Algorithms";
    
    if (taskDatabase[qIndex]) {
        const item = taskDatabase[qIndex];
        return buildProblemObject(courseId, moduleNum, qNum, item, lang);
    }
    
    // Generate programmatic mock coding question based on index
    const genericItem = generateGenericCodingTask(qIndex, currentTopic);
    return buildProblemObject(courseId, moduleNum, qNum, genericItem, lang);
}

function generateGenericCodingTask(index, topic) {
    const diffs = ["Easy", "Easy", "Medium", "Medium", "Hard"];
    const diff = diffs[(index - 1) % 5];
    const points = diff === "Easy" ? 5 : diff === "Medium" ? 7 : 10;
    
    // Synthesize question info based on index
    const title = `Challenge Task ${index}`;
    const description = `This is algorithmic challenge task ${index} in topic ${topic}. Implement a function to solve this challenge. Given an integer input N, perform operations and output the result.`;
    const inputFormat = "A single integer N.";
    const outputFormat = "Print the result of the computations.";
    const constraints = "1 <= N <= 1000";
    
    const testCases = [];
    for (let t = 1; t <= 5; t++) {
        const val = t * 10 + (index % 7);
        testCases.push({ input: String(val), output: String(val * 2) });
    }
    
    return {
        title,
        difficulty: diff,
        points,
        topic,
        description,
        inputFormat,
        outputFormat,
        constraints,
        examples: [testCases[0]],
        testCases,
        tags: [topic.toLowerCase().replace(/ /g, '-')],
        pyStarter: `def solve_challenge_${index}(n):\n    # Your code here\n    pass\n\nn = int(input())\nprint(solve_challenge_${index}(n))`,
        pySol: `def solve_challenge_${index}(n):\n    return n * 2\n\nn = int(input())\nprint(solve_challenge_${index}(n))`,
        cppStarter: `#include <iostream>\nusing namespace std;\n\nint solveChallenge${index}(int n) {\n    // Your code here\n}\n\nint main() {\n    int n;\n    if (cin >> n) {\n        cout << solveChallenge${index}(n) << endl;\n    }\n    return 0;\n}`,
        cppSol: `#include <iostream>\nusing namespace std;\n\nint solveChallenge${index}(int n) {\n    return n * 2;\n}\n\nint main() {\n    int n;\n    if (cin >> n) {\n        cout << solveChallenge${index}(n) << endl;\n    }\n    return 0;\n}`,
        javaStarter: `import java.util.Scanner;\n\npublic class Main {\n    public static int solveChallenge${index}(int n) {\n        // Your code here\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            System.out.println(solveChallenge${index}(n));\n        }\n    }\n}`,
        javaSol: `import java.util.Scanner;\n\npublic class Main {\n    public static int solveChallenge${index}(int n) {\n        return n * 2;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            System.out.println(solveChallenge${index}(n));\n        }\n    }\n}`,
        jsStarter: `function solveChallenge${index}(n) {\n    // Your code here\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim();\nif (input) {\n    console.log(solveChallenge${index}(parseInt(input)));\n}`,
        jsSol: `function solveChallenge${index}(n) {\n    return n * 2;\n}\n\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim();\nif (input) {\n    console.log(solveChallenge${index}(parseInt(input)));\n}`
    };
}

function buildProblemObject(courseId, moduleNum, qNum, item, lang) {
    const qIndex = (moduleNum - 1) * 5 + qNum;
    
    // Choose active code templates based on lang
    let starterCode = item.pyStarter;
    let solution = item.pySol;
    
    if (lang === 'cpp') {
        starterCode = item.cppStarter;
        solution = item.cppSol;
    } else if (lang === 'java') {
        starterCode = item.javaStarter;
        solution = item.javaSol;
    } else if (lang === 'javascript') {
        starterCode = item.jsStarter;
        solution = item.jsSol;
    }
    
    return {
        number: qIndex,
        title: item.title,
        difficulty: item.difficulty,
        topic: item.topic,
        description: item.description,
        inputFormat: item.inputFormat,
        outputFormat: item.outputFormat,
        constraints: item.constraints,
        examples: item.examples,
        explanation: "Solve this using standard programming constructs in your language.",
        testCases: item.testCases,
        hiddenTestCases: item.testCases.map(tc => ({ ...tc })),
        tags: item.tags,
        timeLimit: 1,
        memoryLimit: 256,
        starterCode,
        solution,
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        hints: [`Think about the core properties of ${item.topic}.`, "Start with a simple iterative approach.", "Verify the boundary constraints."],
        id: `${courseId}${moduleNum}q${qNum}`
    };
}

// ---------------------------------------------------------
// 2. CONCEPTUAL NETWORKING PROBLEM GENERATOR (`cn`)
// ---------------------------------------------------------
const cnAnswers = {
    6: { title: "IP Class Lookup", ans: "Class C", desc: "Given the IP address 192.168.1.100, which class does it belong to?", hint: "Class C range is 192-223 for the first octet." },
    7: { title: "Standard DNS Port", ans: "53", desc: "Which standard port number does the Domain Name System (DNS) use?", hint: "DNS is historically port fifty-three." },
    8: { title: "Standard HTTP Port", ans: "80", desc: "What standard port number is used for unencrypted HTTP traffic?", hint: "It is port eighty." },
    9: { title: "Standard HTTPS Port", ans: "443", desc: "What standard port number is used for encrypted HTTPS traffic?", hint: "It is port four-forty-three." },
    10: { title: "Loopback IP Address", ans: "127.0.0.1", desc: "What is the standard IPv4 loopback address?", hint: "Often referred to as 'home' or localhost." }
};

function getNetworkingQuestion(moduleNum, qNum) {
    const qIndex = (moduleNum - 1) * 5 + qNum;
    const diffs = ["Easy", "Easy", "Medium", "Medium", "Hard"];
    const diff = diffs[(qIndex - 1) % 5];
    const points = diff === "Easy" ? 5 : diff === "Medium" ? 7 : 10;
    
    const entry = cnAnswers[qIndex] || {
        title: `CN Topic Question ${qIndex}`,
        ans: "Network",
        desc: `Networking basic question number ${qIndex}. Write a script to return the network layer name or status.`,
        hint: "Provide the expected networking term as output."
    };
    
    return {
        number: qIndex,
        title: entry.title,
        difficulty: diff,
        topic: "Network Basics",
        description: entry.desc,
        inputFormat: "No input required.",
        outputFormat: "Print the networking answer string.",
        constraints: "Single answer expected.",
        examples: [{ input: "", output: entry.ans }],
        explanation: `The expected answer is ${entry.ans}.`,
        testCases: Array(5).fill({ input: "", output: entry.ans }),
        hiddenTestCases: Array(5).fill({ input: "", output: entry.ans }),
        tags: ["networking", "theory"],
        timeLimit: 1,
        memoryLimit: 256,
        starterCode: "# Print the networking answer below\nprint()",
        solution: `# Print the networking answer below\nprint('${entry.ans}')`,
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)",
        hints: [entry.hint || "Print the correct string."],
        id: `cn${moduleNum}q${qNum}`
    };
}

// ---------------------------------------------------------
// 3. CONCEPTUAL OS PROBLEM GENERATOR (`os`)
// ---------------------------------------------------------
const osAnswers = {
    6: { title: "Deadlock Prevention", ans: "Mutual Exclusion", desc: "Which of the four deadlock conditions states that at least one resource must be held in a non-shareable mode?", hint: "It prevents multiple processes sharing the resource simultaneously." },
    7: { title: "Page Fault Action", ans: "Page Replacement", desc: "When a process attempts to access a page that is not in main memory, what action is triggered?", hint: "The OS must fetch the page from disk and replace another." },
    8: { title: "Belady Anomaly", ans: "FIFO", desc: "Which page replacement algorithm is susceptible to Belady's Anomaly?", hint: "First In, First Out." },
    9: { title: "FCFS Scheduling", ans: "Non-preemptive", desc: "Is First-Come, First-Served (FCFS) CPU scheduling preemptive or non-preemptive?", hint: "Think if it can be interrupted." },
    10: { title: "Operating System Type", ans: "Kernel", desc: "What is the core component of an Operating System that manages system operations and hardware communication?", hint: "Starts with K." }
};

function getOSQuestion(moduleNum, qNum) {
    const qIndex = (moduleNum - 1) * 5 + qNum;
    const diffs = ["Easy", "Easy", "Medium", "Medium", "Hard"];
    const diff = diffs[(qIndex - 1) % 5];
    const points = diff === "Easy" ? 5 : diff === "Medium" ? 7 : 10;
    
    const entry = osAnswers[qIndex] || {
        title: `OS Topic Question ${qIndex}`,
        ans: "Kernel",
        desc: `Operating system concept question number ${qIndex}. Write a script to return the OS layer or state name.`,
        hint: "Provide the expected OS concept term as output."
    };
    
    return {
        number: qIndex,
        title: entry.title,
        difficulty: diff,
        topic: "Process Management",
        description: entry.desc,
        inputFormat: "No input required.",
        outputFormat: "Print the OS answer string.",
        constraints: "Single answer expected.",
        examples: [{ input: "", output: entry.ans }],
        explanation: `The expected answer is ${entry.ans}.`,
        testCases: Array(5).fill({ input: "", output: entry.ans }),
        hiddenTestCases: Array(5).fill({ input: "", output: entry.ans }),
        tags: ["operating-system", "theory"],
        timeLimit: 1,
        memoryLimit: 256,
        starterCode: "# Print the OS answer below\nprint()",
        solution: `# Print the OS answer below\nprint('${entry.ans}')`,
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)",
        hints: [entry.hint || "Print the correct string."],
        id: `os${moduleNum}q${qNum}`
    };
}

// ---------------------------------------------------------
// 4. SQL QUERY PROBLEM GENERATOR (`sql` & `dbms`)
// ---------------------------------------------------------
const sqlAnswers = {
    6: { title: "Filter Salary Above", ans: "SELECT * FROM employees WHERE salary > 50000;", desc: "Write a SQL query to select all columns from employees where their salary is greater than 50000.", hint: "Use WHERE salary > 50000." },
    7: { title: "Find Department Admins", ans: "SELECT name FROM employees WHERE department = 'Admin';", desc: "Write a SQL query to select names of employees in the 'Admin' department.", hint: "Filter by department = 'Admin'." },
    8: { title: "Count Total Employees", ans: "SELECT COUNT(*) FROM employees;", desc: "Write a SQL query to get the total count of all records in employees.", hint: "Use the COUNT aggregate function." },
    9: { title: "Max Employee Salary", ans: "SELECT MAX(salary) FROM employees;", desc: "Write a SQL query to retrieve the highest salary from the employees table.", hint: "Use the MAX aggregate function." },
    10: { title: "Update Employee Salary", ans: "UPDATE employees SET salary = salary * 1.1;", desc: "Write a SQL query to increase the salary of all employees by 10%.", hint: "Use SET salary = salary * 1.1." }
};

function getSQLQuestion(courseId, moduleNum, qNum) {
    const qIndex = (moduleNum - 1) * 5 + qNum;
    const diffs = ["Easy", "Easy", "Medium", "Medium", "Hard"];
    const diff = diffs[(qIndex - 1) % 5];
    const points = diff === "Easy" ? 5 : diff === "Medium" ? 7 : 10;
    
    const entry = sqlAnswers[qIndex] || {
        title: `SQL Query challenge ${qIndex}`,
        ans: `SELECT name FROM employees WHERE id = ${qIndex};`,
        desc: `Write a SQL query to select the names of employees whose id equals ${qIndex}.`,
        hint: `Use WHERE id = ${qIndex}.`
    };
    
    return {
        number: qIndex,
        title: entry.title,
        difficulty: diff,
        topic: "Basic Queries",
        description: entry.desc,
        inputFormat: "Assume employees table exists with columns: id, name, department, salary.",
        outputFormat: "Return the executed SQL query string.",
        constraints: "N/A",
        examples: [{ input: "", output: entry.ans }],
        explanation: `The correct SQL syntax is: ${entry.ans}`,
        testCases: Array(5).fill({ input: "", output: entry.ans }),
        hiddenTestCases: Array(5).fill({ input: "", output: entry.ans }),
        tags: ["sql", "queries"],
        timeLimit: 1,
        memoryLimit: 256,
        starterCode: "-- Write your query below",
        solution: entry.ans,
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        hints: [entry.hint],
        id: `${courseId}${moduleNum}q${qNum}`
    };
}

// ---------------------------------------------------------
// 5. OOP SYSTEM DESIGN PROBLEM GENERATOR (`oop_company_wise`)
// ---------------------------------------------------------
function getOOPQuestion(moduleNum, qNum) {
    const qIndex = (moduleNum - 1) * 5 + qNum;
    const diffs = ["Easy", "Easy", "Medium", "Medium", "Hard"];
    const diff = diffs[(qIndex - 1) % 5];
    const points = diff === "Easy" ? 5 : diff === "Medium" ? 7 : 10;
    
    const topics = {
        16: "Creational Design Patterns",
        17: "Structural Design Patterns",
        18: "Behavioral Design Patterns",
        19: "SOLID Principles",
        20: "System Design OOP"
    };
    
    const titles = {
        76: "Design Factory Pattern",
        77: "Design Builder Pattern",
        78: "Design Abstract Factory",
        79: "Design Prototype Pattern",
        80: "Design Thread-safe Singleton",
        81: "Design Adapter Pattern",
        82: "Design Bridge Pattern",
        83: "Design Decorator Pattern",
        84: "Design Facade Pattern",
        85: "Design Proxy Pattern",
        86: "Design Observer Pattern",
        87: "Design Strategy Pattern",
        88: "Design Command Pattern",
        89: "Design State Pattern",
        90: "Design Template Method",
        91: "Verify Liskov Substitution",
        92: "Verify Dependency Inversion",
        93: "Verify Single Responsibility",
        94: "Verify Interface Segregation",
        95: "Verify Open Closed Principle",
        96: "Design Elevator System",
        97: "Design Vending Machine",
        98: "Design Tic-Tac-Toe Game",
        99: "Design Library Management",
        100: "Design ATM System"
    };
    
    const currentTopic = topics[moduleNum] || "Design Principles";
    const currentTitle = titles[qIndex] || `OOP Design Task ${qIndex}`;
    
    return {
        number: qIndex,
        title: currentTitle,
        difficulty: diff,
        topic: currentTopic,
        description: `Implement the design structure or solve conceptual principles for '${currentTitle}' using standard Object Oriented Programming structures (Classes, Interfaces, Inheritance, and Encapsulation).`,
        inputFormat: "No input required.",
        outputFormat: "Pseudo-code class interfaces and structures.",
        constraints: "Design constraints apply.",
        examples: [],
        explanation: `Demonstrate the clean OOP pattern implementation for ${currentTitle}.`,
        testCases: [],
        hiddenTestCases: [],
        tags: ["oop", "design-patterns", "solid"],
        timeLimit: 0,
        memoryLimit: 0,
        starterCode: "",
        solution: "",
        timeComplexity: "",
        spaceComplexity: "",
        hints: [`Use encapsulation for state`, `Implement interfaces for extensibility`],
        id: `oop_company_wise${moduleNum}q${qNum}`
    };
}


// ---------------------------------------------------------
// MAIN PROCESSING LOOP
// ---------------------------------------------------------
async function processCourses() {
    console.log('Starting offline course generation process...');
    
    const files = await fs.readdir(COURSE_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const activeCourses = [
        'cn',
        'competitive_programming',
        'cpp_programming',
        'daa',
        'dbms',
        'dsa',
        'javascript',
        'java_programming',
        'oop_company_wise',
        'os',
        'python_programming',
        'sql'
    ];

    for (const file of jsonFiles) {
        const courseName = path.basename(file, '.json');
        
        if (!activeCourses.includes(courseName)) {
            console.log(`Course ${courseName} is not active in the database. Skipping.`);
            continue;
        }

        console.log(`\nProcessing course file: ${file}`);
        const filePath = path.join(COURSE_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        
        let courseData = [];
        try {
            const parsed = JSON.parse(fileContent);
            if (Array.isArray(parsed)) {
                courseData = parsed;
            } else if (parsed && parsed.modules && Array.isArray(parsed.modules)) {
                courseData = parsed.modules;
            } else if (parsed && parsed.module) {
                courseData = [parsed];
            } else {
                courseData = [];
            }
        } catch (e) {
            console.log(`Failed to parse ${file}, starting fresh.`);
            courseData = [];
        }

        const existingModuleNumbers = courseData.map(m => m.module);
        
        for (let i = 1; i <= TARGET_MODULES; i++) {
            if (!existingModuleNumbers.includes(i)) {
                // Generate a new module offline
                let topicName = `Advanced Module ${i}`;
                if (courseName === 'cn') topicName = "Network Basics";
                else if (courseName === 'os') topicName = "Process Management";
                else if (courseName === 'sql' || courseName === 'dbms') topicName = "Basic Queries";
                else if (courseName === 'oop_company_wise') {
                    const oopTopics = {
                        16: "Creational Design Patterns",
                        17: "Structural Design Patterns",
                        18: "Behavioral Design Patterns",
                        19: "SOLID Principles",
                        20: "System Design OOP"
                    };
                    topicName = oopTopics[i] || "OOP Design";
                } else {
                    const topicsList = [
                        "Basic Arithmetic", // 2 (6-10)
                        "String Basics",     // 3 (11-15)
                        "Simple Conditions", // 4 (16-20)
                        "Basic Loops",       // 5 (21-25)
                        "Arrays and Lists",  // 6 (26-30)
                        "Search and Sort",   // 7 (31-35)
                        "String Manipulation",// 8 (36-40)
                        "Basic Recursion",   // 9 (41-45)
                        "Stack and Queue",   // 10 (46-50)
                        "Binary Trees",      // 11 (51-55)
                        "Graphs",            // 12 (56-60)
                        "Greedy Algorithms", // 13 (61-65)
                        "Dynamic Programming",// 14 (66-70)
                        "Bit Manipulation",  // 15 (71-75)
                        "Number Theory",     // 16 (76-80)
                        "Matrix and Grid",   // 17 (81-85)
                        "Hashing",           // 18 (86-90)
                        "Two Pointers",      // 19 (91-95)
                        "Sliding Window"     // 20 (96-100)
                    ];
                    topicName = topicsList[i - 2] || "Algorithms";
                }

                const newModule = {
                    course: courseName,
                    module: i,
                    topic: topicName,
                    questions: []
                };

                for (let q = 1; q <= 5; q++) {
                    let problemObj = null;
                    if (courseName === 'cn') {
                        problemObj = getNetworkingQuestion(i, q);
                    } else if (courseName === 'os') {
                        problemObj = getOSQuestion(i, q);
                    } else if (courseName === 'sql' || courseName === 'dbms') {
                        problemObj = getSQLQuestion(courseName, i, q);
                    } else if (courseName === 'oop_company_wise') {
                        problemObj = getOOPQuestion(i, q);
                    } else {
                        problemObj = getCodingQuestion(courseName, i, q);
                    }
                    newModule.questions.push(problemObj);
                }

                courseData.push(newModule);
                
                // Save incrementally to prevent data loss
                await fs.writeFile(filePath, JSON.stringify(courseData, null, 2));
                console.log(`Successfully saved Offline Module ${i} for ${courseName}`);
            } else {
                console.log(`Module ${i} already exists for ${courseName}, skipping.`);
            }
        }
        
        console.log(`Finished offline processing for ${courseName}`);
    }
    
    console.log('\nAll courses generated offline successfully!');
}

processCourses().catch(console.error);
