import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  testId: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  branch: { type: String, required: true },
  section: { type: String, required: true },
  answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  snapshots: [{ type: String }],
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  status: { type: String, enum: ['Submitted', 'Evaluating', 'Evaluated', 'Disqualified'], default: 'Submitted' },
  submittedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'submissions'
});

export const Submission = mongoose.model('Submission', submissionSchema);
