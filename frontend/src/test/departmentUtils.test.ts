import { describe, it, expect } from 'vitest';
import { formatDepartment, formatDepartmentHeader } from '../app/utils/departmentUtils';

describe('Department Formatting & Role Utilities', () => {
  it('should format computer science departments correctly', () => {
    const res = formatDepartment('Department of Computer Science and Engineering');
    expect(res.short).toBe('CSE');
    expect(res.subtitle).toBe('Comp. Science & Engg.');
  });

  it('should format information technology correctly', () => {
    const res = formatDepartment('Information Technology');
    expect(res.short).toBe('IT');
  });

  it('should format electronics and communication correctly', () => {
    const res = formatDepartment('Electronics & Communication Engineering');
    expect(res.short).toBe('ECE');
  });

  it('should handle empty or null values gracefully', () => {
    expect(formatDepartment(null).short).toBe('—');
    expect(formatDepartment('—').short).toBe('—');
    expect(formatDepartmentHeader(null)).toBe('DEPT. OF CSE');
  });
});
