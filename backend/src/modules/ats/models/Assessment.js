import mongoose from 'mongoose';
import { nextId } from '../../lib/ids.js';

const assessmentSchema = new mongoose.Schema({
  _id: { type: String, default: () => nextId('assess') },
  title: { type: String, required: true },
  description: { type: String },
  companyId: { type: String, ref: 'Company', required: true },
  driveId: { type: String, ref: 'Drive', required: true },
  durationMinutes: { type: Number, default: 60 },
  questions: [{
    type: { type: String, enum: ['mcq', 'coding'], required: true },
    title: { type: String, required: true },
    points: { type: Number, default: 10 }
  }],
  status: { type: String, enum: ['Draft', 'Active', 'Closed'], default: 'Draft' },
  createdAt: { type: Date, default: Date.now }
});

export const Assessment = mongoose.model('Assessment', assessmentSchema);
