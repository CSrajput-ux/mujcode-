import axios from 'axios';

const API_BASE_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:5000")
    .replace(/\/$/, "") + "/api";
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export interface LiveClass {
  _id: string;
  facultyId: string;
  facultyName: string;
  subject: string;
  courseName?: string;
  department?: string;
  branch?: string;
  semester?: number;
  section?: string;
  topic: string;
  date: string;
  time: string;
  duration: number;
  status: 'Upcoming' | 'Live' | 'Completed';
  meetingLink: string;
  recordingUrl?: string | null;
  createdAt?: string;
}

export interface AttendanceRecord {
  _id: string;
  classId: string;
  studentId: string;
  studentName: string;
  status: 'Pending' | 'Present' | 'Late' | 'Partial' | 'Absent';
  joinTime?: string | null;
  leaveTime?: string | null;
  totalDurationMinutes: number;
}

export const getLiveClasses = async () => {
  const response = await axios.get<{ success: boolean; data: LiveClass[] }>(`${API_BASE_URL}/live-classes`, getAuthHeaders());
  return response.data.data;
};

export const scheduleLiveClass = async (data: Partial<LiveClass>) => {
  const response = await axios.post<{ success: boolean; data: LiveClass }>(`${API_BASE_URL}/live-classes`, data, getAuthHeaders());
  return response.data.data;
};

export const updateLiveClassStatus = async (id: string, status: 'Upcoming' | 'Live' | 'Completed') => {
  const response = await axios.put<{ success: boolean; data: LiveClass }>(`${API_BASE_URL}/live-classes/${id}/status`, { status }, getAuthHeaders());
  return response.data.data;
};

export const joinLiveClass = async (id: string) => {
  const response = await axios.post<{ success: boolean; data: AttendanceRecord; meetingLink: string }>(`${API_BASE_URL}/live-classes/${id}/join`, {}, getAuthHeaders());
  return response.data;
};

export const leaveLiveClass = async (id: string) => {
  const response = await axios.post<{ success: boolean; data: AttendanceRecord }>(`${API_BASE_URL}/live-classes/${id}/leave`, {}, getAuthHeaders());
  return response.data;
};
