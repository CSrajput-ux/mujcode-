import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/admin/dashboard';

export interface DashboardStats {
    totalStudents: number;
    studentGrowthPercent: number;
    totalFaculty: number;
    facultyGrowthPercent: number;
    totalCompanies: number;
    companyGrowthPercent: number;
    activePlacements: number;
    placementGrowthPercent: number;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data.data;
};

export const getStudents = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    branch?: string;
    year?: string;
}) => {
    const response = await axios.get(`${API_URL}/students`, { params });
    return response.data.data;
};

export const getFaculty = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
}) => {
    const response = await axios.get(`${API_URL}/faculty`, { params });
    return response.data.data;
};

export const getCompanies = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
}) => {
    const response = await axios.get(`${API_URL}/companies`, { params });
    return response.data.data;
};

export const getPlacements = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    companyId?: string;
}) => {
    const response = await axios.get(`${API_URL}/placements`, { params });
    return response.data.data;
};
