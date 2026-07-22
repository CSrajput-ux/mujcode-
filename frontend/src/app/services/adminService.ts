import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/admin';

// ==================== STUDENTS ====================

export const getStudents = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    branch?: string;
    year?: string;
    section?: string;
}) => {
    const response = await axios.get(`${API_URL}/students`, { params });
    return response.data.data;
};

export const getStudent = async (id: string) => {
    const response = await axios.get(`${API_URL}/students/${id}`);
    return response.data.data;
};

export const createStudent = async (data: any) => {
    const response = await axios.post(`${API_URL}/students`, data);
    return response.data;
};

export const bulkUploadStudents = async (file: File, facultyIds?: string[]) => {
    const formData = new FormData();
    formData.append('file', file);
    if (facultyIds && facultyIds.length > 0) {
        formData.append('facultyIds', JSON.stringify(facultyIds));
    }
    const response = await axios.post(`${API_URL}/students/bulk-upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateStudent = async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/students/${id}`, data);
    return response.data;
};

export const bulkDeleteStudents = async (ids: string[]) => {
    const response = await axios.post(`${API_URL}/students/bulk-delete`, { ids });
    return response.data;
};

export const deleteStudent = async (id: string) => {
    const response = await axios.delete(`${API_URL}/students/${id}`);
    return response.data;
};

// ==================== FACULTY ====================

export const getFaculty = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
}) => {
    const response = await axios.get(`${API_URL}/faculty`, { params });
    return response.data.data;
};

export const getFacultySingle = async (id: string) => {
    const response = await axios.get(`${API_URL}/faculty/${id}`);
    return response.data.data;
};

export const createFaculty = async (data: any) => {
    const response = await axios.post(`${API_URL}/faculty`, data);
    return response.data;
};

export const assignCourses = async (data: { facultyId: string; courseIds: string[] }) => {
    const response = await axios.post(`${API_URL}/faculty/assign-courses`, data);
    return response.data;
};

export const updateFaculty = async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/faculty/${id}`, data);
    return response.data;
};

export const deleteFaculty = async (id: string) => {
    const response = await axios.delete(`${API_URL}/faculty/${id}`);
    return response.data;
};

// ==================== COMPANIES ====================

export const getCompanies = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
}) => {
    const response = await axios.get(`${API_URL}/dashboard/companies`, { params });
    return response.data.data;
};

export const createCompany = async (data: any) => {
    const response = await axios.post(`${API_URL}/dashboard/companies`, data);
    return response.data;
};

export const updateCompany = async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/dashboard/companies/${id}`, data);
    return response.data;
};

// ==================== PLACEMENTS ====================

export const getPlacements = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    companyId?: string;
}) => {
    const response = await axios.get(`${API_URL}/dashboard/placements`, { params });
    return response.data.data;
};

export const createPlacement = async (data: any) => {
    const response = await axios.post(`${API_URL}/dashboard/placements`, data);
    return response.data;
};

export const updatePlacement = async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/dashboard/placements/${id}`, data);
    return response.data;
};

// ==================== COURSES (for faculty assignment) ====================

export const getCourses = async () => {
    const response = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/student/courses');
    return response.data;
};
