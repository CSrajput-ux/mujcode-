import mongoose from 'mongoose';
import { nextId } from '../lib/ids.js';

const securityLogSchema = new mongoose.Schema({
  _id: { type: String, default: () => nextId('sec_log') },
  testId: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  snapshot: { type: String },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'security_logs'
});

export const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);
