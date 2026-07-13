import mongoose from 'mongoose';

const driveSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['Draft', 'Active', 'Paused', 'Closed'], 
    default: 'Draft' 
  },
  
  // Eligibility
  eligibility: {
    minCgpa: { type: Number, default: 0 },
    maxBacklogs: { type: Number, default: 0 },
    branches: [{ type: String }],
    semesters: [{ type: Number }],
    years: [{ type: Number }],
    skills: [{ type: String }]
  },

  // Salary
  salary: {
    ctc: { type: String },
    stipend: { type: String },
    isPPO: { type: Boolean, default: false }
  },

  // Location & Logistics
  locationType: { type: String, enum: ['Remote', 'Hybrid', 'On-Site'], default: 'On-Site' },
  location: { type: String },
  
  // Limits & Counts
  registrationLimit: { type: Number },
  applicantsCount: { type: Number, default: 0 },
  shortlistedCount: { type: Number, default: 0 },
  hiredCount: { type: Number, default: 0 },
  deadline: { type: Date },
}, { timestamps: true });

export const Drive = mongoose.model('Drive', driveSchema);
