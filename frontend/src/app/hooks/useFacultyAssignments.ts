import { useState, useEffect } from 'react';

export interface TeachingAssignment {
  subject: string;
  branch: string;
  section: string;
  year: string;
  semester?: string | number;
}

interface FacultyProfile {
  teachingAssignments: TeachingAssignment[];
  name: string;
  department: string;
}

export function useFacultyAssignments() {
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(
      (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/faculty/my-assignments',
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    )
      .then(r => r.json())
      .then((data: FacultyProfile) => {
        setAssignments(data.teachingAssignments || []);
      })
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  // Unique derived values
  const branches = [...new Set(assignments.map(a => a.branch).filter(Boolean))];
  const sections = [...new Set(assignments.map(a => a.section).filter(Boolean))].sort();
  const subjects = [...new Set(assignments.map(a => a.subject).filter(Boolean))];
  const years = [...new Set(assignments.map(a => a.year).filter(Boolean))];

  // Sections filtered by branch
  const sectionsByBranch = (branch: string) =>
    [...new Set(
      assignments
        .filter(a => !branch || a.branch === branch)
        .map(a => a.section)
        .filter(Boolean)
    )].sort();

  // ✅ Subjects by section ONLY — section choose karo, subjects aa jayenge
  const subjectsBySection = (section: string) =>
    [...new Set(
      assignments
        .filter(a => !section || a.section === section)
        .map(a => a.subject)
        .filter(Boolean)
    )];

  // Auto-detect branch from section
  const branchBySection = (section: string) =>
    assignments.find(a => a.section === section)?.branch || '';

  // Auto-detect year from section
  const yearBySection = (section: string) =>
    assignments.find(a => a.section === section)?.year || '';

  // Subjects filtered by branch + section (for backward compat)
  const subjectsByBranchSection = (branch: string, section: string) =>
    [...new Set(
      assignments
        .filter(a => (!branch || a.branch === branch) && (!section || a.section === section))
        .map(a => a.subject)
        .filter(Boolean)
    )];

  return {
    assignments, loading,
    branches, sections, subjects, years,
    sectionsByBranch, subjectsBySection, subjectsByBranchSection,
    branchBySection, yearBySection
  };
}
