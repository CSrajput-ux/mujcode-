import { registerAuthRoutes } from './auth.js';
import { registerUniversityRoutes } from './university.js';
import { registerAcademicRoutes } from './academic.js';
import { registerStudentRoutes } from './student.js';
import { registerProblemsRoutes } from './problems.js';
import { registerJudgeRoutes } from './judge.js';
import { registerTestsRoutes } from './tests.js';
import { registerAssignmentsRoutes } from './assignments.js';
import { registerAdminRoutes } from './admin.js';
import { registerFacultyRoutes } from './faculty.js';
import { registerPermissionsRoutes } from './permissions.js';
import { registerPlacementsRoutes } from './placements.js';
import { registerContentRoutes } from './content.js';
import { registerMockTestRoutes } from './mockTests.js';
import { registerCommunityRoutes } from './communities.js';
import { registerLiveClassRoutes } from './liveClasses.js';

export function registerRoutes(router, ctx) {
  registerAuthRoutes(router, ctx);
  registerUniversityRoutes(router, ctx);
  registerAcademicRoutes(router, ctx);
  registerStudentRoutes(router, ctx);
  registerProblemsRoutes(router, ctx);
  registerJudgeRoutes(router, ctx);
  registerTestsRoutes(router, ctx);
  registerAssignmentsRoutes(router, ctx);
  registerAdminRoutes(router, ctx);
  registerFacultyRoutes(router, ctx);
  registerPermissionsRoutes(router, ctx);
  registerPlacementsRoutes(router, ctx);
  registerContentRoutes(router, ctx);
  registerMockTestRoutes(router, ctx);
  registerCommunityRoutes(router, ctx);
  registerLiveClassRoutes(router, ctx);
}
