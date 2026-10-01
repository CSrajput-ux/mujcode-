import { httpRequest } from './client.js';
import { SAMPLE_SEARCH_TERMS, SAMPLE_CODE_SNIPPETS } from './generator.js';

export async function runUserStep(user, baseUrl = 'http://127.0.0.1:5000') {
  const persona = user.persona;
  const token = user.token;
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'X-Forwarded-For': `10.100.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}`
  };

  switch (persona) {
    case 'NORMAL': {
      // Pick random normal action
      const roll = Math.random();
      if (roll < 0.25) {
        return httpRequest({ baseUrl, path: '/api/student/courses', headers: authHeaders });
      } else if (roll < 0.50) {
        return httpRequest({ baseUrl, path: '/api/problems?limit=15&page=1', headers: authHeaders });
      } else if (roll < 0.70) {
        const pNum = 901 + Math.floor(Math.random() * 40);
        return httpRequest({ baseUrl, path: `/api/problems/number/${pNum}`, headers: authHeaders });
      } else if (roll < 0.85) {
        return httpRequest({ baseUrl, path: '/api/student/profile/stu_ms1ekbqs_o95s87', headers: authHeaders });
      } else {
        return httpRequest({ baseUrl, path: '/api/tests', headers: authHeaders });
      }
    }

    case 'HEAVY':
    case 'SEARCH_HEAVY': {
      const roll = Math.random();
      if (roll < 0.40) {
        const term = SAMPLE_SEARCH_TERMS[Math.floor(Math.random() * SAMPLE_SEARCH_TERMS.length)];
        return httpRequest({
          baseUrl,
          path: `/api/problems?search=${encodeURIComponent(term)}&limit=20&page=1`,
          headers: authHeaders
        });
      } else if (roll < 0.65) {
        return httpRequest({
          baseUrl,
          path: '/api/exam-security/heartbeat',
          method: 'POST',
          headers: authHeaders,
          body: {
            sessionId: `sess_${user.id}`,
            testId: 'test_1',
            studentId: user.id,
            tabSwitches: Math.floor(Math.random() * 2),
            faceCount: 1,
            audioLevel: 12.5,
            timestamp: Date.now()
          }
        });
      } else if (roll < 0.85) {
        return httpRequest({
          baseUrl,
          path: '/api/exam-recovery/snapshot',
          method: 'POST',
          headers: authHeaders,
          body: {
            testId: 'test_1',
            studentId: user.id,
            answers: { q1: 'B', q2: 'C', code: 'print("hello")' },
            timestamp: Date.now()
          }
        });
      } else {
        return httpRequest({ baseUrl, path: `/api/judge/submissions/${user.id}/1`, headers: authHeaders });
      }
    }

    case 'READ_HEAVY': {
      const paths = [
        '/api/student/courses',
        '/api/problems/metadata',
        '/api/problems/stats',
        '/api/university/faculties',
        '/api/university/departments',
        '/api/university/subjects',
        '/api/university/academic-years',
        '/api/tests',
        `/api/student/rankings/${user.id}`,
        `/api/student/heatmap/${user.id}`,
        `/api/student/problem-stats/${user.id}`
      ];
      const p = paths[Math.floor(Math.random() * paths.length)];
      return httpRequest({ baseUrl, path: p, headers: authHeaders });
    }

    case 'WRITE_HEAVY': {
      const roll = Math.random();
      if (roll < 0.40) {
        return httpRequest({
          baseUrl,
          path: '/api/student/profile/stu_ms1ekbqs_o95s87',
          method: 'PUT',
          headers: authHeaders,
          body: {
            branch: user.branch,
            section: user.section,
            semester: user.semester,
            year: user.year,
            department: 'Computer Science & Engineering'
          }
        });
      } else if (roll < 0.70) {
        return httpRequest({
          baseUrl,
          path: '/api/exam-security/session',
          method: 'POST',
          headers: authHeaders,
          body: {
            testId: 'test_1',
            studentId: user.id,
            userAgent: 'Mozilla/5.0 Synthetic Test Agent'
          }
        });
      } else {
        return httpRequest({
          baseUrl,
          path: '/api/placements/apply',
          method: 'POST',
          headers: authHeaders,
          body: {
            jobId: 1,
            studentId: user.id
          }
        });
      }
    }

    case 'ADMIN_HEAVY': {
      const paths = [
        '/api/admin/dashboard/stats',
        '/api/admin/dashboard/students?page=1&limit=20',
        '/api/admin/dashboard/faculty?page=1&limit=20',
        '/api/admin/dashboard/placements?page=1&limit=20',
        '/api/admin/health'
      ];
      const p = paths[Math.floor(Math.random() * paths.length)];
      return httpRequest({ baseUrl, path: p, headers: authHeaders });
    }

    default:
      return httpRequest({ baseUrl, path: '/api/student/courses', headers: authHeaders });
  }
}
