import mongoose from 'mongoose';

const codeExecutionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  problemId: { type: String },
  problemNumber: { type: mongoose.Schema.Types.Mixed },
  code: { type: String, default: '' },
  language: { type: String, default: 'python' },
  verdict: { type: String, default: 'Pending' },
  output: { type: String, default: '' },
  judgedAt: { type: Date }
}, {
  timestamps: true,
  collection: 'code_executions'
});

export const CodeExecution = mongoose.model('CodeExecution', codeExecutionSchema);
