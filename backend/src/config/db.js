import mongoose from 'mongoose';
import { Company } from '../modules/ats/models/Company.js';
import { Drive } from '../modules/ats/models/Drive.js';

const seedDrivesIfEmpty = async () => {
  try {
    const hasGoogle = await Company.findOne({ name: 'Google' });
    if (!hasGoogle) {
      console.log('[MongoDB] Google company not found. Resetting and seeding fresh placement drives...');
      
      // Wipe old collections to start clean
      await Company.deleteMany({});
      await Drive.deleteMany({});

      const companies = await Company.insertMany([
        { name: 'Google', industry: 'Technology', logo: 'https://cdn-icons-png.flaticon.com/512/300/300221.png', settings: { themeColor: '#4285F4' } },
        { name: 'Microsoft', industry: 'Technology', logo: 'https://cdn-icons-png.flaticon.com/512/732/732221.png', settings: { themeColor: '#F25022' } },
        { name: 'Amazon', industry: 'Cloud & E-Commerce', logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968269.png', settings: { themeColor: '#FF9900' } },
        { name: 'Adobe', industry: 'Creative Software', logo: 'https://cdn-icons-png.flaticon.com/512/732/732177.png', settings: { themeColor: '#FF0000' } }
      ]);

      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);

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
          applicantsCount: 45
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
          applicantsCount: 120
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
          applicantsCount: 89
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
          applicantsCount: 32
        }
      ]);
      console.log('[MongoDB] Auto-seeding successful.');
    }
  } catch (error) {
    console.error('[MongoDB] Auto-seeding failed:', error.message);
  }
};

export const connectDB = async () => {
  try {
    // Attempting to connect to the local Docker MongoDB container
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mujcode_ats';
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    
    // Seed default placement drives
    await seedDrivesIfEmpty();
  } catch (error) {
    console.error(`[MongoDB] Connection Error: ${error.message}`);
    // Not exiting process to avoid breaking the existing JSON-based app flow
  }
};
