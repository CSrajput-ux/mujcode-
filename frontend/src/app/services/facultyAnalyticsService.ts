import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/faculty/analytics';

export const getDashboardStats = async () => {
    const response = await axios.get(`${API_URL}/dashboard-stats`);
    return response.data;
};

export const getSectionPerformance = async () => {
    const response = await axios.get(`${API_URL}/section-performance`);
    return response.data;
};

export const getActivityMetrics = async () => {
    const response = await axios.get(`${API_URL}/activity-metrics`);
    return response.data;
};

export const getSuccessRates = async () => {
    const response = await axios.get(`${API_URL}/success-rates`);
    return response.data;
};

export const getFacultyInsights = async () => {
    const response = await axios.get(`${API_URL}/insights`);
    return response.data;
};
