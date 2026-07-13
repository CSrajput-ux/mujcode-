import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/tests';

export interface TestStats {
    _id: string;
    title: string;
    type: string; // Quiz, Assessment, etc.
    startTime: string;
    duration: number;
    totalAppeared: number;
    avgScore: number;
    status: string;
}

export interface StudentSubmission {
    _id: string;
    studentId: string;
    studentName: string; // Mocked for now
    rollNumber: string;
    section: string;
    score: number;
    totalMaxScore: number;
    status: string; // Pass/Fail
    submitTime: string;
}

export const getFacultyTests = async (): Promise<TestStats[]> => {
    const response = await axios.get(`${API_URL}/faculty/all`);
    return response.data;
};

export const getTestSubmissions = async (testId: string): Promise<StudentSubmission[]> => {
    const response = await axios.get(`${API_URL}/${testId}/submissions`);
    return response.data;
};
