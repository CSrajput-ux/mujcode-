import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'x-auth-token': token,
        },
    };
};

const facultyActivityService = {
    // --- Questions ---
    createQuestion: async (questionData: any) => {
        const response = await axios.post(`${API_URL}/api/faculty/questions/create`, questionData, getAuthHeaders());
        return response.data;
    },

    getQuestions: async () => {
        const response = await axios.get(`${API_URL}/api/faculty/questions`, getAuthHeaders());
        return response.data;
    },

    getQuestionById: async (id: string) => {
        const response = await axios.get(`${API_URL}/api/faculty/questions/${id}`, getAuthHeaders());
        return response.data;
    },

    runCode: async (runData: { code: string; language: string; testCases: any[] }) => {
        const response = await axios.post(`${API_URL}/api/faculty/questions/run`, runData, getAuthHeaders());
        return response.data;
    },

    getSubmissionResult: async (submissionId: string) => {
        const response = await axios.get(`${API_URL}/api/faculty/questions/submission/${submissionId}`, getAuthHeaders());
        return response.data;
    },

    // --- Communities ---
    createCommunity: async (communityData: any) => {
        const response = await axios.post(`${API_URL}/api/communities`, communityData, getAuthHeaders());
        return response.data;
    },

    getCommunities: async () => {
        const response = await axios.get(`${API_URL}/api/communities`, getAuthHeaders());
        return response.data;
    },

    // --- Posts ---
    createPost: async (communityId: string, postData: any) => {
        const response = await axios.post(`${API_URL}/api/communities/${communityId}/posts`, postData, getAuthHeaders());
        return response.data;
    },

    getPosts: async (communityId: string) => {
        const response = await axios.get(`${API_URL}/api/communities/${communityId}/posts`, getAuthHeaders());
        return response.data;
    }
};

export default facultyActivityService;
