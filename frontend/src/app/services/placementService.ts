import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
};

export const getPlacementDrives = async () => {
    const response = await axios.get(`${API_BASE_URL}/placements/drives`, { headers: getHeaders() });
    return response.data;
};

export const applyForJob = async (jobId: number) => {
    const response = await axios.post(`${API_BASE_URL}/placements/apply`, { jobId }, { headers: getHeaders() });
    return response.data;
};

export const getMyApplications = async () => {
    const response = await axios.get(`${API_BASE_URL}/placements/my-applications`, { headers: getHeaders() });
    return response.data;
};

// TPO/Admin Routes
export const createPlacementDrive = async (driveData: any) => {
    const response = await axios.post(`${API_BASE_URL}/placements/drives`, driveData, { headers: getHeaders() });
    return response.data;
};

export const getCompanies = async () => {
    const response = await axios.get(`${API_BASE_URL}/placements/companies`, { headers: getHeaders() });
    return response.data;
};

export default {
    getPlacementDrives,
    applyForJob,
    getMyApplications,
    createPlacementDrive,
    getCompanies
};

