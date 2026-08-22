import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  collection: 'activity_logs'
});

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
