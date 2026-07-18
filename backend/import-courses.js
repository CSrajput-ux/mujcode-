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

function normalizeCategory(cat) {
    if (!cat) return 'Interview';
    const c = cat.toLowerCase();
    if (c.includes('c++')) return 'C++';
    if (c.includes('c programming') || c === 'c') return 'C';
    if (c.includes('java') && !c.includes('javascript')) return 'Java';
    if (c.includes('python')) return 'Python';
    if (c.includes('sql') || c.includes('dbms') || c.includes('database')) return 'SQL';
    if (c.includes('javascript') || c.includes('js')) return 'JavaScript';
    if (c.includes('dsa') || c.includes('data structure') || c.includes('algo') || c.includes('competitive')) return 'DSA';
    if (c.includes('interview') || c.includes('preparation') || c.includes('network')) return 'Interview';
    return 'Interview'; // default fallback
}

function getIconForCategory(category) {
    switch (category) {
        case 'SQL':
        case 'Java':
            return 'database';
        case 'JavaScript':
            return 'globe';
        case 'DSA':
        case 'Interview':
            return 'target';
        default:
            return 'code';
    }
}

function main() {
    console.log('Starting Clean Course Import into db.json...');

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

    // 2. Read course directory
    const files = fs.readdirSync(COURSE_DIR).filter(f => f.endsWith('.json'));
    const currentCourseIds = new Set(files.map(f => f.replace('.json', '')));

    console.log(`Found ${files.length} courses in directory:`, Array.from(currentCourseIds));

    // 3. WIPE ALL OLD ENTRIES FOR THESE COURSES TO ENSURE CLEAN IMPORT
    const originalCourseCount = db.courses.length;
    const originalProblemCount = db.problems.length;

    // Filter out any courses and problems that are in currentCourseIds so we recreate them completely fresh
    db.courses = db.courses.filter(course => !currentCourseIds.has(course._id));
    db.problems = db.problems.filter(problem => !currentCourseIds.has(problem.courseId));

    console.log(`Wiped existing database entries for active courses:`);
    console.log(`- Removed ${originalCourseCount - db.courses.length} courses from database`);
    console.log(`- Removed ${originalProblemCount - db.problems.length} problems from database`);

    // Map to quickly look up remaining/new problems/courses
    const courseMap = new Map(db.courses.map(c => [c._id, c]));
    const problemMap = new Map(db.problems.map(p => [p._id, p]));

    let importedCourses = 0;
    let importedProblems = 0;

    for (const file of files) {
        const courseId = file.replace('.json', '');
        const filePath = path.join(COURSE_DIR, file);
        const rawData = fs.readFileSync(filePath, 'utf8');
        
        let courseDataObj = {};
        let modules = [];
        try {
            const parsed = JSON.parse(rawData);
            courseDataObj = parsed;
            if (Array.isArray(parsed)) {
                modules = parsed;
            } else if (parsed && parsed.modules && Array.isArray(parsed.modules)) {
                modules = parsed.modules;
            } else {
                modules = [parsed];
            }
        } catch (e) {
            console.error(`Failed to parse ${file}, skipping.`);
            continue;
        }

        // Determine course metadata from JSON file contents or fallbacks
        const titleFallback = courseId.replace(/_/g, ' ').split(' ').map(capitalize).join(' ');
        const courseTitle = courseDataObj.courseName || courseDataObj.title || titleFallback;
        const rawCategory = courseDataObj.category || 'Interview';
        const category = normalizeCategory(rawCategory);
        const icon = getIconForCategory(category);
        
        // Find difficulty from name or questions
        let difficulty = 'Medium';
        if (courseId.includes('beginner') || courseId.includes('fundamental') || courseId.includes('essential')) {
            difficulty = 'Easy';
        } else if (courseId.includes('advanced') || courseId.includes('competitive') || courseId.includes('interview')) {
            difficulty = 'Hard';
        }

        const courseMeta = {
            _id: courseId,
            title: courseTitle,
            category: category,
            difficulty: difficulty,
            icon: icon,
            totalProblems: 0 // Will calculate based on actual question count
        };

        // Add Course to DB (guaranteed fresh since we filtered them out before)
        db.courses.push(courseMeta);
        courseMap.set(courseMeta._id, courseMeta);
        importedCourses++;

        // Import Problems
        let currentTotalProblems = 0;
        let index = 0;

        for (const mod of modules) {
            if (!mod.questions) continue;
            for (const q of mod.questions) {
                index++;
                // Generate a reliable, unique problem ID
                const problemId = q.id ? String(q.id) : `${courseId}_q${q.number || index}`;
                
                // Format points based on difficulty if not provided
                const qDiff = q.difficulty || courseMeta.difficulty;
                const points = q.points || (qDiff === 'Hard' ? 20 : qDiff === 'Medium' ? 15 : 10);

                // Build problem entry
                const problemData = {
                    ...q,
                    _id: problemId,
                    id: problemId, // Match id and _id
                    number: q.number ? Number(q.number) : index,
                    courseId: courseMeta._id,
                    moduleNumber: q.moduleNumber || mod.module || 1,
                    moduleTopic: q.moduleTopic || mod.topic || courseMeta.title,
                    category: category, // Inherit course category for filters
                    difficulty: qDiff,
                    points: Number(points),
                    topic: q.topic || mod.topic || courseMeta.title || 'General'
                };

                // Add problem
                db.problems.push(problemData);
                problemMap.set(problemData._id, problemData);
                
                importedProblems++;
                currentTotalProblems++;
            }
        }
        
        // Update actual problem count on the course
        courseMeta.totalProblems = currentTotalProblems;
    }

    // 4. Write back to db.json
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    
    console.log(`✅ Clean Import Complete!`);
    console.log(`Imported ${importedCourses} courses.`);
    console.log(`Imported ${importedProblems} problems.`);
}

main();
