import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/admin/system';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'x-auth-token': token,
        },
    };
};

/**
 * Admin System Services
 * APIs for activity logs, system health, uptime, and platform stats
 */

export async function getActivityLogs(limit = 10, type = '') {
    try {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (type) params.append('type', type);

        const response = await axios.get(`${API_URL}/activity-logs?${params}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
    }
}

export async function getSystemHealth() {
    try {
        const response = await axios.get(`${API_URL}/health`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error('Error fetching system health:', error);
        throw error;
    }
}

export async function getUptime() {
    try {
        const response = await axios.get(`${API_URL}/uptime`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error('Error fetching uptime:', error);
        throw error;
    }
}

export async function getPlatformStats() {
    try {
        const response = await axios.get(`${API_URL}/stats`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error('Error fetching platform stats:', error);
        throw error;
    }
}

export async function getDashboardData() {
    try {
        const response = await axios.get(`${API_URL}/dashboard-data`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
}
