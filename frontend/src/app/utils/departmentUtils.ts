/**
 * Department formatting utilities for shortening and cleaning department names
 * across the faculty & student portals.
 */

export interface DepartmentFormat {
  short: string;
  subtitle?: string;
  full: string;
}

export function formatDepartment(dept?: string | null): DepartmentFormat {
  if (!dept || dept === '—' || dept === '-') {
    return { short: dept || '—', full: dept || '' };
  }

  const raw = dept.trim();
  const lower = raw.toLowerCase();

  // Known engineering & science departments
  if (lower.includes('computer science') && (lower.includes('eng') || lower.includes('cse') || lower.includes('&'))) {
    return {
      short: 'CSE',
      subtitle: 'Comp. Science & Engg.',
      full: raw
    };
  }
  if (lower.includes('computer science')) {
    return {
      short: 'CS',
      subtitle: 'Computer Science',
      full: raw
    };
  }
  if (lower.includes('information technology') || lower === 'it') {
    return {
      short: 'IT',
      subtitle: 'Information Technology',
      full: raw
    };
  }
  if (lower.includes('electronics') && (lower.includes('comm') || lower.includes('ece'))) {
    return {
      short: 'ECE',
      subtitle: 'Electronics & Comm.',
      full: raw
    };
  }
  if (lower.includes('electrical') && (lower.includes('electron') || lower.includes('eee'))) {
    return {
      short: 'EEE',
      subtitle: 'Electrical & Electronics',
      full: raw
    };
  }
  if (lower.includes('mechanical')) {
    return {
      short: 'ME',
      subtitle: 'Mechanical Engg.',
      full: raw
    };
  }
  if (lower.includes('civil')) {
    return {
      short: 'CE',
      subtitle: 'Civil Engg.',
      full: raw
    };
  }
  if (
    lower.includes('data science') ||
    lower.includes('artificial intelligence') ||
    lower.includes('ai & ds') ||
    lower.includes('ai/ds')
  ) {
    return {
      short: 'AI & DS',
      subtitle: 'AI & Data Science',
      full: raw
    };
  }
  if (lower.includes('chemical')) {
    return {
      short: 'CHE',
      subtitle: 'Chemical Engg.',
      full: raw
    };
  }
  if (lower.includes('biotechnology') || lower.includes('biotech')) {
    return {
      short: 'BT',
      subtitle: 'Biotechnology',
      full: raw
    };
  }
  if (lower.includes('mechatronics')) {
    return {
      short: 'MTE',
      subtitle: 'Mechatronics Engg.',
      full: raw
    };
  }

  // Already a clean short abbreviation (e.g., "CSE", "IT", "ECE")
  if (raw.length <= 6) {
    return {
      short: raw.toUpperCase(),
      full: raw
    };
  }

  // Strip prefix "Department of" / "Dept. of"
  const stripped = raw
    .replace(/^department\s+of\s+/i, '')
    .replace(/^dept\.?\s+of\s+/i, '')
    .trim();

  // If still long, create acronym from major words
  if (stripped.length > 18) {
    const acronym = stripped
      .split(/\s+/)
      .filter(w => !['of', 'and', '&', 'the', 'in', 'for'].includes(w.toLowerCase()))
      .map(w => w[0].toUpperCase())
      .join('');
    if (acronym.length >= 2 && acronym.length <= 5) {
      return {
        short: acronym,
        subtitle: stripped.length > 22 ? `${stripped.slice(0, 20)}...` : stripped,
        full: raw
      };
    }
  }

  return {
    short: stripped,
    full: raw
  };
}

export function formatDepartmentHeader(dept?: string | null): string {
  if (!dept || dept === '—' || dept === '-') return 'DEPT. OF CSE';
  const { short } = formatDepartment(dept);
  return `DEPT. OF ${short}`;
}
