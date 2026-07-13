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
    isPublished: boolean; // Publish status for visibility control
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

export const toggleTestPublishStatus = async (testId: string) => {
    const response = await axios.patch(`${API_URL}/${testId}/publish`);
    return response.data;
};

export const deleteTestById = async (testId: string) => {
    const response = await axios.delete(`${API_URL}/${testId}`);
    return response.data;
};
