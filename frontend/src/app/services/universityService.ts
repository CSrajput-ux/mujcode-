import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
};

export const getFaculties = async () => {
    const response = await axios.get(`${API_BASE_URL}/university/faculties`, { headers: getHeaders() });
    return response.data;
};

export const getDepartments = async (faculty?: string) => {
    const params = faculty ? { faculty } : {};
    const response = await axios.get(`${API_BASE_URL}/university/departments`, { params, headers: getHeaders() });
    return response.data;
};

export const getPrograms = async (deptId: number) => {
    const response = await axios.get(`${API_BASE_URL}/university/programs`, { params: { deptId }, headers: getHeaders() });
    return response.data;
};

export const getBranches = async (progId: number) => {
    const response = await axios.get(`${API_BASE_URL}/university/branches`, { params: { progId }, headers: getHeaders() });
    return response.data;
};

export const getSections = async (branchId: number) => {
    const response = await axios.get(`${API_BASE_URL}/university/sections`, { params: { branchId }, headers: getHeaders() });
    return response.data;
};

export const getSubjects = async (branchId: number, semester: number) => {
    const response = await axios.get(`${API_BASE_URL}/university/subjects`, { params: { branchId, semester }, headers: getHeaders() });
    return response.data;
};

export const getAcademicYears = async () => {
    const response = await axios.get(`${API_BASE_URL}/university/academic-years`, { headers: getHeaders() });
    return response.data;
};

export default {
    getFaculties,
    getDepartments,
    getPrograms,
    getBranches,
    getSections,
    getSubjects,
    getAcademicYears
};


