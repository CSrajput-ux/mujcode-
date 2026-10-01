import { httpRequest } from '../lib/client.js';
import { signToken } from '../lib/generator.js';

export async function runConcurrencyRaceTest(baseUrl = 'http://127.0.0.1:5000') {
  console.log(`\n===============================================================`);
  console.log(`[TEST 14 & 15] CONCURRENCY, RACE CONDITIONS & DATA INTEGRITY`);
  console.log(`===============================================================`);

  const results = {};

  // 1. Same user duplicate simultaneous requests (Double-submit race)
  console.log(`\n--- Test A: Same User Double-Submit Race (Idempotency) ---`);
  const raceUserId = `usr_race_${Date.now()}`;
  const raceToken = signToken({ id: raceUserId, email: `${raceUserId}@muj.edu`, role: 'student' });
  const authHeaders = {
    'Authorization': `Bearer ${raceToken}`,
    'X-Forwarded-For': '10.50.1.1'
  };

  // Fire 5 identical requests simultaneously
  const burstJobId = 9999;
  const duplicateRequests = Array.from({ length: 5 }, (_, i) =>
    httpRequest({
      baseUrl,
      path: '/api/placements/apply',
      method: 'POST',
      headers: authHeaders,
      body: { jobId: burstJobId }
    })
  );

  const responses = await Promise.all(duplicateRequests);
  const statusCounts = {};
  responses.forEach(r => {
    statusCounts[r.statusCode] = (statusCounts[r.statusCode] || 0) + 1;
  });

  console.log(`Duplicate Request Status Distribution:`, statusCounts);
  results.doubleSubmitRace = {
    statusCounts,
    hasDuplicates: (statusCounts[201] || 0) > 1,
    detectedRaceCondition: (statusCounts[201] || 0) > 1
  };
  if ((statusCounts[201] || 0) > 1) {
    console.log(`⚠️ RACE CONDITION CONFIRMED: Created ${statusCounts[201]} duplicate application records for a single user!`);
  } else {
    console.log(`✅ Idempotency passed: Exactly 1 record created (409 returned for concurrent calls).`);
  }

  // 2. 100 Different Users Performing the Same Operation Concurrently
  console.log(`\n--- Test B: 100 Different Users Concurrent Applications ---`);
  const user100Tokens = Array.from({ length: 100 }, (_, i) => {
    const uid = `usr_c100_${i}_${Date.now()}`;
    return {
      id: uid,
      token: signToken({ id: uid, email: `${uid}@muj.edu`, role: 'student' }),
      ip: `10.60.${Math.floor(i / 250)}.${i % 250}`
    };
  });

  const c100Requests = user100Tokens.map(u =>
    httpRequest({
      baseUrl,
      path: '/api/placements/apply',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${u.token}`,
        'X-Forwarded-For': u.ip
      },
      body: { jobId: 1 }
    })
  );

  const c100Responses = await Promise.all(c100Requests);
  const c100Status = {};
  c100Responses.forEach(r => {
    c100Status[r.statusCode] = (c100Status[r.statusCode] || 0) + 1;
  });
  console.log(`100 Concurrent Users Status Distribution:`, c100Status);
  results.concurrent100Users = { statusCounts: c100Status };

  // 3. Concurrent Profile Updates (Write-Write Race on Same User Record)
  console.log(`\n--- Test C: Concurrent Updates to Same User Record (Lost Update Test) ---`);
  const profileUserId = `usr_profile_race_${Date.now()}`;
  const profileToken = signToken({ id: profileUserId, email: `${profileUserId}@muj.edu`, role: 'student' });
  const profileHeaders = {
    'Authorization': `Bearer ${profileToken}`,
    'X-Forwarded-For': '10.70.1.1'
  };

  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const updatePromises = sections.map((sec, i) =>
    httpRequest({
      baseUrl,
      path: `/api/student/profile/${profileUserId}`,
      method: 'PUT',
      headers: profileHeaders,
      body: {
        branch: 'CSE',
        section: sec,
        semester: 6,
        year: '3'
      }
    })
  );

  const updateResponses = await Promise.all(updatePromises);
  const updateStatuses = {};
  updateResponses.forEach(r => {
    updateStatuses[r.statusCode] = (updateStatuses[r.statusCode] || 0) + 1;
  });

  // Verify final state
  const verifyRes = await httpRequest({
    baseUrl,
    path: `/api/student/profile/${profileUserId}`,
    headers: profileHeaders
  });

  console.log(`Concurrent Update Statuses:`, updateStatuses);
  console.log(`Final State Section:`, verifyRes.data?.section || verifyRes.data?.student?.section || 'unknown');
  results.lostUpdateTest = {
    updateStatuses,
    finalState: verifyRes.data
  };

  return results;
}
