import fs from 'fs/promises';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================================
// CONFIGURATION
// ============================================================================
// Replace with your actual Gemini API key, or set the GEMINI_API_KEY environment variable.
const API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const COURSE_DIR = path.join(process.cwd(), 'course');
const TARGET_MODULES = 15;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
        responseMimeType: "application/json",
    }
});

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function generateModule(courseName, moduleNumber) {
    const prompt = `
    You are an expert programming instructor creating LeetCode-style coding questions.
    I need exactly 1 module containing exactly 5 questions for the course "${courseName}".
    Module Number: ${moduleNumber}
    
    REQUIREMENTS FOR QUESTIONS:
    - Exactly 5 questions: 2 Easy, 2 Medium, and 1 Hard.
    - Each question must include a "points" field (Easy = 5, Medium = 7, Hard = 10).
    - Use STRICT LeetCode format: clear description, input/output format, constraints, examples with explanations.
    - NO DUMMY CODE. The starterCode must be valid template code, and the solution must be a fully working algorithm in a suitable language (C, C++, Java, Python, or JS depending on course).
    - Include exactly 5 test cases and exactly 10 hidden test cases.
    - Time and Space complexity must be provided.
    - Do NOT output anything other than the JSON structure.

    JSON SCHEMA:
    {
      "course": "${courseName}",
      "module": ${moduleNumber},
      "topic": "Appropriate topic name for this module in ${courseName}",
      "questions": [
        {
          "id": "String (e.g. ${courseName}${moduleNumber}q1)",
          "number": "Integer 1-5",
          "title": "String",
          "difficulty": "Easy|Medium|Hard",
          "points": "Number (5 for Easy, 7 for Medium, 10 for Hard)",
          "topic": "String",
          "description": "String",
          "inputFormat": "String",
          "outputFormat": "String",
          "constraints": "String",
          "examples": [{ "input": "String", "output": "String" }],
          "explanation": "String",
          "testCases": [{ "input": "String", "output": "String" }],
          "hiddenTestCases": [{ "input": "String", "output": "String" }],
          "tags": ["String Array"],
          "timeLimit": 1,
          "memoryLimit": 256,
          "starterCode": "String (Actual code)",
          "solution": "String (Actual working code)",
          "timeComplexity": "String",
          "spaceComplexity": "String",
          "hints": ["String Array"]
        }
      ]
    }
    `;

    console.log(`Generating Module ${moduleNumber} for ${courseName}...`);
    let retries = 3;
    while (retries > 0) {
        try {
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const data = JSON.parse(responseText);
            return data;
        } catch (error) {
            console.error(`Error generating module ${moduleNumber}: ${error.message}. Retrying...`);
            retries--;
            await delay(5000); // wait 5 seconds before retry
        }
    }
    throw new Error(`Failed to generate module ${moduleNumber} after multiple attempts.`);
}

async function processCourses() {
    console.log('Starting course generation process...');
    
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        console.error('ERROR: Please set your GEMINI_API_KEY environment variable or edit the script with your API key.');
        process.exit(1);
    }

    const files = await fs.readdir(COURSE_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
        const filePath = path.join(COURSE_DIR, file);
        const courseName = path.basename(file, '.json');
        console.log(`\nProcessing course file: ${file}`);
        
        const fileContent = await fs.readFile(filePath, 'utf8');
        let courseData = [];
        try {
            const parsed = JSON.parse(fileContent);
            // Handle both Array of modules and Single module object
            courseData = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            console.log(`Failed to parse ${file}, starting fresh.`);
            courseData = [];
        }

        const existingModuleNumbers = courseData.map(m => m.module);
        
        for (let i = 1; i <= TARGET_MODULES; i++) {
            if (!existingModuleNumbers.includes(i)) {
                try {
                    const newModule = await generateModule(courseName, i);
                    courseData.push(newModule);
                    // Save incrementally to prevent data loss
                    await fs.writeFile(filePath, JSON.stringify(courseData, null, 2));
                    console.log(`Successfully saved Module ${i} for ${courseName}`);
                    await delay(3000); // Avoid rate limits
                } catch (err) {
                    console.error(`Skipping module ${i} for ${courseName} due to error.`);
                }
            } else {
                console.log(`Module ${i} already exists for ${courseName}, skipping.`);
            }
        }
        
        console.log(`Finished processing ${courseName}`);
    }
    
    console.log('\nAll courses processed successfully!');
}

processCourses().catch(console.error);
