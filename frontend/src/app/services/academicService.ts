// Academic API Service - For fetching student courses and academic data
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

export interface Course {
    courseCode: string;
    courseName: string;
    credits: number;
    courseType: 'Theory' | 'Lab' | 'Project';
    isElective: boolean;
    electiveCategory?: string | null;
    prerequisites?: string[];
    syllabusOverview?: string | null;
}

export interface StudentCoursesResponse {
    success: boolean;
    student: {
        name: string;
        email: string;
        branch: string;
        semester: number;
        section: string | null;
    };
    summary: {
        totalCourses: number;
        totalCredits: number;
        breakdown: {
            theory: number;
            lab: number;
            project: number;
        };
    };
    courses: Course[];
}

export interface BranchResponse {
    success: boolean;
    count: number;
    data: Array<{
        code: string;
        name: string;
        fullName: string;
        department: string;
        specializations: string[];
    }>;
}

/**
 * Fetch personalized courses for the authenticated student
 * Based on their profile (branch + semester)
 */
export const getMyCoursesAPI = async (): Promise<StudentCoursesResponse> => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('Authentication required. Please login.');
    }

    const response = await axios.get(`${API_BASE_URL}/academic/my-courses`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return response.data;
};

/**
 * Fetch all active branches
 */
export const getAllBranches = async (): Promise<BranchResponse> => {
    const response = await axios.get(`${API_BASE_URL}/academic/branches`);
    return response.data;
};

/**
 * Fetch courses for a specific branch and semester
 * (Public endpoint - doesn't require authentication)
 */
export const getCoursesByBranchSemester = async (
    branchCode: string,
    semester: number
): Promise<StudentCoursesResponse> => {
    const response = await axios.get(
        `${API_BASE_URL}/academic/courses/${branchCode}/${semester}`
    );
    return response.data;
};

/**
 * Fetch academic roadmap for a branch
 */
export const getAcademicRoadmap = async (branchCode: string) => {
    const response = await axios.get(
        `${API_BASE_URL}/academic/roadmap/${branchCode}`
    );
    return response.data;
};

export default {
    getMyCoursesAPI,
    getAllBranches,
    getCoursesByBranchSemester,
    getAcademicRoadmap
};
