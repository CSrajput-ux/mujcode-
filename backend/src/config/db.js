import mongoose from 'mongoose';
import { logger } from '../lib/logger.js';

const seedDrivesIfEmpty = async () => {
  try {
    const { Company } = await import('../modules/ats/models/Company.js');
    const { Drive } = await import('../modules/ats/models/Drive.js');

    const hasGoogle = await Company.findOne({ name: 'Google' });
    if (hasGoogle) return;

    logger.info('[MongoDB] Seeding default placement drives...');
    await Company.deleteMany({});
    await Drive.deleteMany({});

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);

    const companies = await Company.insertMany([
      { name: 'Google', industry: 'Technology', logo: 'https://cdn-icons-png.flaticon.com/512/300/300221.png', settings: { themeColor: '#4285F4' } },
      { name: 'Microsoft', industry: 'Technology', logo: 'https://cdn-icons-png.flaticon.com/512/732/732221.png', settings: { themeColor: '#F25022' } },
      { name: 'Amazon', industry: 'Cloud & E-Commerce', logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968269.png', settings: { themeColor: '#FF9900' } },
      { name: 'Adobe', industry: 'Creative Software', logo: 'https://cdn-icons-png.flaticon.com/512/732/732177.png', settings: { themeColor: '#FF0000' } },
    ]);

    await Drive.insertMany([
      {
        companyId: companies[0]._id,
        title: 'Software Engineer Intern (STEP)',
        status: 'Active',
        eligibility: { minCgpa: 8.0, maxBacklogs: 0, branches: ['CSE', 'CCE', 'IT'] },
        salary: { ctc: '18', stipend: '100000', isPPO: true },
        locationType: 'On-Site',
        location: 'Bangalore',
        deadline: nextMonth,
        applicantsCount: 45,
      },
      {
        companyId: companies[1]._id,
        title: 'Software Engineering Career Loop',
        status: 'Active',
        eligibility: { minCgpa: 7.5, maxBacklogs: 0, branches: ['CSE', 'CCE', 'IT', 'ECE'] },
        salary: { ctc: '44', stipend: '125000', isPPO: true },
        locationType: 'Hybrid',
        location: 'Hyderabad',
        deadline: nextMonth,
        applicantsCount: 120,
      },
      {
        companyId: companies[2]._id,
        title: 'AWS Cloud Support Associate',
        status: 'Active',
        eligibility: { minCgpa: 7.0, maxBacklogs: 1, branches: ['CSE', 'CCE', 'IT', 'ECE', 'EE'] },
        salary: { ctc: '22', stipend: '80000', isPPO: false },
        locationType: 'On-Site',
        location: 'Pune',
        deadline: nextMonth,
        applicantsCount: 89,
      },
      {
        companyId: companies[3]._id,
        title: 'Product Engineer - Creative Cloud',
        status: 'Active',
        eligibility: { minCgpa: 8.5, maxBacklogs: 0, branches: ['CSE', 'IT'] },
        salary: { ctc: '40', stipend: '110000', isPPO: true },
        locationType: 'Hybrid',
        location: 'Noida',
        deadline: nextMonth,
        applicantsCount: 32,
      },
    ]);
    logger.info('[MongoDB] Placement drives seeded successfully.');
  } catch (err) {
    logger.error('[MongoDB] Seeding failed:', err.message);
  }
};

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    logger.warn('[MongoDB] MONGODB_URI not set — ATS placement features will be unavailable.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`[MongoDB] Connected: ${conn.connection.host}`);
    await seedDrivesIfEmpty();
  } catch (err) {
    logger.error(`[MongoDB] Connection failed: ${err.message} — ATS features disabled.`);
    // Non-fatal: rest of app continues with JSON-based storage
  }
};
