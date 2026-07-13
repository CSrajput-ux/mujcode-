export class EligibilityEngine {
  /**
   * Evaluates if a student meets the criteria for a recruitment drive.
   * @param {Object} studentProfile - The student's academic profile
   * @param {Object} rules - The drive's eligibility rules
   * @returns {Object} { isEligible: boolean, reason: string }
   */
  static evaluate(studentProfile, rules) {
    if (!rules) return { isEligible: true, reason: 'No rules defined' };

    // 1. CGPA Check
    if (rules.minCgpa !== undefined && rules.minCgpa > 0) {
      const studentCgpa = studentProfile.cgpa || 0;
      if (studentCgpa < rules.minCgpa) {
        return { 
          isEligible: false, 
          reason: `CGPA (${studentCgpa}) does not meet the minimum requirement of ${rules.minCgpa}.`
        };
      }
    }

    // 2. Backlogs Check
    if (rules.maxBacklogs !== undefined) {
      const studentBacklogs = studentProfile.activeBacklogs || 0;
      if (studentBacklogs > rules.maxBacklogs) {
        return {
          isEligible: false,
          reason: `Active backlogs (${studentBacklogs}) exceed the maximum allowed (${rules.maxBacklogs}).`
        };
      }
    }

    // 3. Branch Check
    if (rules.branches && rules.branches.length > 0) {
      const studentBranch = studentProfile.branch;
      if (!studentBranch || !rules.branches.includes(studentBranch)) {
        return {
          isEligible: false,
          reason: `Branch (${studentBranch || 'None'}) is not eligible. Allowed: ${rules.branches.join(', ')}.`
        };
      }
    }

    return { isEligible: true, reason: 'Eligible' };
  }
}
