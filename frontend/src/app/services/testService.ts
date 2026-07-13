import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/tests';

export interface Question {
    _id: string;
    text: string;
    type: 'MCQ' | 'TrueFalse';
    options?: string[];
    marks: number;
    explanation?: string;
}

export interface Test {
    _id: string;
    title: string;
    description?: string;
    type: 'Quiz' | 'Assessment' | 'Lab' | 'Company';
    status: 'Draft' | 'Upcoming' | 'Live' | 'Completed';
    startTime?: string;
    endTime?: string;
    duration: number;
    questions: Question[]; // Assuming we get full question objects
    proctored: boolean;
    totalMarks: number;
    branch?: string;
    section?: string;
    semester?: number;
}

export interface TestSubmission {
    testId: string;
    studentId: string;
    answers: { questionId: string; selectedOption: number }[];
    warningsIssued: number;
}

export const getTests = async (params?: { type?: string; status?: string; branch?: string; section?: string; semester?: string }) => {
    const response = await axios.get(API_URL, { params });
    return response.data;
};

export const getTestById = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const submitTest = async (submission: TestSubmission) => {
    const response = await axios.post(`${API_URL}/submit`, submission);
    return response.data;
};

export const getStudentSubmissions = async (studentId: string) => {
    const response = await axios.get(`${API_URL}/submissions/${studentId}`);
    return response.data;
};
