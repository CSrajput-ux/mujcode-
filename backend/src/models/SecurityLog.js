import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema({
  _id: { type: String, required: true },
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
