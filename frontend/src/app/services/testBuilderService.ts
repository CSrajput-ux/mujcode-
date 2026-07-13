import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

export interface MCQQuestion {
    _id?: string;
    questionText: string;
    options: string[];
    correctAnswers: number[];
    multipleCorrect: boolean;
    marks: number;
    explanation?: string;
    order?: number;
}

export interface CodingQuestion {
    _id?: string;
    title: string;
    problemStatement: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    allowedLanguages: string[];
    starterCode: { language: string; code: string }[];
    testCases: {
        input: string;
        expectedOutput: string;
        marks: number;
        isHidden: boolean;
        explanation?: string;
    }[];
    totalMarks: number;
    timeLimit: number;
    memoryLimit: number;
}

export interface TheoryQuestion {
    _id?: string;
    questionText: string;
    modelAnswer: string;
    keywords: string[];
    maxMarks: number;
}

// MCQ Question APIs
export const createMCQQuestion = async (testId: string, question: MCQQuestion) => {
    const response = await axios.post(`${API_URL}/tests/${testId}/questions/mcq`, question);
    return response.data;
};

export const getMCQQuestions = async (testId: string) => {
    const response = await axios.get(`${API_URL}/tests/${testId}/questions/mcq`);
    return response.data;
};

export const updateMCQQuestion = async (questionId: string, question: Partial<MCQQuestion>) => {
    const response = await axios.put(`${API_URL}/questions/mcq/${questionId}`, question);
    return response.data;
};

export const deleteMCQQuestion = async (questionId: string) => {
    const response = await axios.delete(`${API_URL}/questions/mcq/${questionId}`);
    return response.data;
};

// Coding Question APIs
export const createCodingQuestion = async (testId: string, question: CodingQuestion) => {
    const response = await axios.post(`${API_URL}/tests/${testId}/questions/coding`, question);
    return response.data;
};

export const getCodingQuestions = async (testId: string) => {
    const response = await axios.get(`${API_URL}/tests/${testId}/questions/coding`);
    return response.data;
};

export const updateCodingQuestion = async (questionId: string, question: Partial<CodingQuestion>) => {
    const response = await axios.put(`${API_URL}/questions/coding/${questionId}`, question);
    return response.data;
};

export const deleteCodingQuestion = async (questionId: string) => {
    const response = await axios.delete(`${API_URL}/questions/coding/${questionId}`);
    return response.data;
};

// Theory Question APIs
export const createTheoryQuestion = async (testId: string, question: TheoryQuestion) => {
    const response = await axios.post(`${API_URL}/tests/${testId}/questions/theory`, question);
    return response.data;
};

export const getTheoryQuestions = async (testId: string) => {
    const response = await axios.get(`${API_URL}/tests/${testId}/questions/theory`);
    return response.data;
};

export const updateTheoryQuestion = async (questionId: string, question: Partial<TheoryQuestion>) => {
    const response = await axios.put(`${API_URL}/questions/theory/${questionId}`, question);
    return response.data;
};

export const deleteTheoryQuestion = async (questionId: string) => {
    const response = await axios.delete(`${API_URL}/questions/theory/${questionId}`);
    return response.data;
};
