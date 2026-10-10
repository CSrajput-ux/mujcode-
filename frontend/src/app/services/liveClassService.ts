import apiClient from './apiClient';

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
  studentRollNumber?: string;
  rollNumber?: string;
  branch?: string;
  section?: string;
  semester?: number | string;
  status: 'Pending' | 'Present' | 'Late' | 'Partial' | 'Absent';
  joinTime?: string | null;
  leaveTime?: string | null;
  totalDurationMinutes: number;
}

export interface ClassAttendanceResponse {
  success: boolean;
  classId: string;
  topic: string;
  totalAttendees: number;
  presentCount: number;
  partialCount: number;
  attendance: AttendanceRecord[];
}

export const getLiveClasses = async () => {
  const response = await apiClient.get<{ success: boolean; data: LiveClass[] }>('/api/live-classes');
  return response.data.data;
};

export const scheduleLiveClass = async (data: Partial<LiveClass>) => {
  const response = await apiClient.post<{ success: boolean; data: LiveClass }>('/api/live-classes', data);
  return response.data.data;
};

export const updateLiveClassStatus = async (id: string, status: 'Upcoming' | 'Live' | 'Completed') => {
  const response = await apiClient.put<{ success: boolean; data: LiveClass }>(`/api/live-classes/${id}/status`, { status });
  return response.data.data;
};

export const deleteLiveClass = async (id: string) => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/live-classes/${id}`);
  return response.data;
};

export const getClassAttendance = async (id: string) => {
  const response = await apiClient.get<ClassAttendanceResponse>(`/api/live-classes/${id}/attendance`);
  return response.data;
};

export const joinLiveClass = async (id: string) => {
  const response = await apiClient.post<{ success: boolean; data: AttendanceRecord; meetingLink: string; status: string }>(`/api/live-classes/${id}/join`, {});
  return response.data;
};

export const leaveLiveClass = async (id: string) => {
  const response = await apiClient.post<{ success: boolean; data: AttendanceRecord }>(`/api/live-classes/${id}/leave`, {});
  return response.data;
};
