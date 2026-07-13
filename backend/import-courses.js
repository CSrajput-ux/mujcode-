import fs from 'fs';
import path from 'path';

// Define paths
const BACKEND_DIR = process.cwd();
const DB_PATH = path.join(BACKEND_DIR, 'src', 'data', 'db.json');
const COURSE_DIR = path.join(BACKEND_DIR, '..', 'course');

function capitalize(s) {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function getCourseMetadata(filename) {
    const name = filename.replace('.json', '');
    let title = name.replace(/_/g, ' ');
    title = title.split(' ').map(capitalize).join(' ');
    
    let category = 'All';
    let icon = 'code';
    let difficulty = 'Medium';

    if (name.includes('c_programming')) { category = 'C'; difficulty = 'Easy'; }
    else if (name.includes('cpp')) { category = 'C++'; difficulty = 'Medium'; }
    else if (name.includes('java')) { category = 'Java'; difficulty = 'Medium'; icon = 'database'; }
    else if (name.includes('python')) { category = 'Python'; difficulty = 'Easy'; }
    else if (name.includes('sql') || name.includes('dbms')) { category = 'SQL'; icon = 'database'; difficulty = 'Medium'; }
    else if (name.includes('javascript')) { category = 'JavaScript'; icon = 'globe'; difficulty = 'Medium'; }
    else if (name.includes('dsa') || name.includes('daa')) { category = 'DSA'; difficulty = 'Hard'; icon = 'target'; }
    else if (name.includes('company') || name.includes('competitive')) { category = 'Interview'; difficulty = 'Hard'; icon = 'target'; }

    return {
        _id: name,
        title,
        category,
        difficulty,
        icon,
        totalProblems: 75 // 15 modules * 5 questions
    };
}

function main() {
    console.log('Starting Course Import into db.json...');

    // 1. Read existing DB
    let db = {};
    if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        try {
            db = JSON.parse(raw);
        } catch (e) {
            console.error('Error parsing db.json:', e);
            return;
        }
    }

    if (!db.courses) db.courses = [];
    if (!db.problems) db.problems = [];

    // Map to quickly look up existing problems/courses
    const courseMap = new Map(db.courses.map(c => [c._id, c]));
    const problemMap = new Map(db.problems.map(p => [p._id, p]));

    // 2. Read course directory
    const files = fs.readdirSync(COURSE_DIR).filter(f => f.endsWith('.json'));

    let importedCourses = 0;
    let importedProblems = 0;

    for (const file of files) {
        const filePath = path.join(COURSE_DIR, file);
        const rawData = fs.readFileSync(filePath, 'utf8');
        let modules = [];
        try {
            const parsed = JSON.parse(rawData);
            modules = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            console.error(`Failed to parse ${file}, skipping.`);
            continue;
        }

        const courseMeta = getCourseMetadata(file);
        
        // Add or Update Course
        if (courseMap.has(courseMeta._id)) {
            Object.assign(courseMap.get(courseMeta._id), courseMeta);
        } else {
            db.courses.push(courseMeta);
            courseMap.set(courseMeta._id, courseMeta);
        }
        importedCourses++;

        // Import Problems
        let currentTotalProblems = 0;
        for (const mod of modules) {
            if (!mod.questions) continue;
            for (const q of mod.questions) {
                // Attach courseId and module data
                const problemData = {
                    ...q,
                    _id: q.id, // ensure _id matches id
                    courseId: courseMeta._id,
                    moduleNumber: mod.module,
                    moduleTopic: mod.topic
                };
                delete problemData.id;

                if (problemMap.has(problemData._id)) {
                    Object.assign(problemMap.get(problemData._id), problemData);
                } else {
                    db.problems.push(problemData);
                    problemMap.set(problemData._id, problemData);
                }
                importedProblems++;
                currentTotalProblems++;
            }
        }
        
        // Update actual problem count
        courseMap.get(courseMeta._id).totalProblems = currentTotalProblems;
    }

    // 3. Write back to db.json
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    
    console.log(`✅ Import Complete!`);
    console.log(`Imported/Updated ${importedCourses} courses.`);
    console.log(`Imported/Updated ${importedProblems} problems.`);
}

main();
