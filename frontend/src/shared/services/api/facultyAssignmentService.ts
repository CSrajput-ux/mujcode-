import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/assignments';

export interface Assignment {
    _id: string;
    title: string;
    description?: string;
    type: 'Assignment' | 'CaseStudy' | 'Research' | 'Other';
    subject: string;
    year: string;
    branch: string;
    section: string;
    dueDate: string;
    totalMarks: number;
    completedCount: number;
    pendingCount: number;
    totalStudents: number;
}

export interface Submission {
    _id: string;
    assignmentId: string;
    studentId: string;
    studentName: string;
    rollNumber: string;
    files: string[];
    status: 'Pending' | 'Submitted' | 'Graded' | 'Late';
    marks?: number;
    feedback?: string;
    submittedAt?: string;
}

export const getFacultyAssignments = async (): Promise<Assignment[]> => {
    const response = await axios.get(`${API_URL}/faculty/all`);
    return response.data;
};

export const getAssignmentSubmissions = async (assignmentId: string): Promise<Submission[]> => {
    const response = await axios.get(`${API_URL}/${assignmentId}/submissions`);
    return response.data;
};

export const gradeSubmission = async (submissionId: string, marks: number, feedback: string): Promise<Submission> => {
    const response = await axios.post(`${API_URL}/submission/${submissionId}/grade`, { marks, feedback });
    return response.data;
};

export const seedAssignments = async () => {
    await axios.post(`${API_URL}/seed`);
};
