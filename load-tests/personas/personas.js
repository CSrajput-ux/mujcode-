export const PERSONA_DEFINITIONS = {
  NORMAL: {
    name: 'Normal Student',
    percentage: 60,
    weight: 0.60,
    thinkTimeMinMs: 100,
    thinkTimeMaxMs: 400,
    description: 'Browses courses, views problems, inspects problem details, views test lists.'
  },
  SEARCH_HEAVY: {
    name: 'Search / Heavy Student',
    percentage: 10,
    weight: 0.10,
    thinkTimeMinMs: 50,
    thinkTimeMaxMs: 250,
    description: 'Searches problem topics, sends proctoring heartbeats, snapshots test state.'
  },
  READ_HEAVY: {
    name: 'Read-Heavy Student',
    percentage: 15,
    weight: 0.15,
    thinkTimeMinMs: 50,
    thinkTimeMaxMs: 200,
    description: 'Fetches faculty directories, departments, subjects, rankings, heatmaps, problem stats.'
  },
  WRITE_HEAVY: {
    name: 'Write-Heavy Student / Faculty',
    percentage: 10,
    weight: 0.10,
    thinkTimeMinMs: 150,
    thinkTimeMaxMs: 500,
    description: 'Updates student profiles, applies for placement drives, saves test submissions.'
  },
  ADMIN_HEAVY: {
    name: 'Admin / Faculty / Company User',
    percentage: 5,
    weight: 0.05,
    thinkTimeMinMs: 200,
    thinkTimeMaxMs: 800,
    description: 'Queries admin dashboard stats, student rosters, faculty rosters, company lists.'
  }
};
