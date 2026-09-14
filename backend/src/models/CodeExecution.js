import mongoose from 'mongoose';

const codeExecutionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  problemId: { type: String },
  problemNumber: { type: mongoose.Schema.Types.Mixed },
  code: { type: String, default: '' },
  language: { type: String, default: 'python' },
  status: { type: String, default: 'PENDING' },
  verdict: { type: String, default: 'Pending' },
  output: { type: String, default: '' },
  compileOutput: { type: String, default: '' },
  judge0Token: { type: String },
  executionTime: { type: String },
  memory: { type: String },
  judgedAt: { type: Date }
}, {
  timestamps: true,
  collection: 'code_executions'
});

export const CodeExecution = mongoose.model('CodeExecution', codeExecutionSchema);
