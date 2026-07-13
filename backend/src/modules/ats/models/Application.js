import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drive', required: true },
  studentId: { type: String, required: true }, // Referencing the JSON DB user.id for now since Students aren't fully migrated to Mongo yet
  studentDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    branch: { type: String },
    cgpa: { type: Number },
    score: { type: Number, default: 0 }
  },
  status: { 
    type: String, 
    enum: ['Applied', 'Screening', 'Testing', 'Interview', 'Offered', 'Hired', 'Rejected'], 
    default: 'Applied' 
  },
  notes: { type: String }
}, { timestamps: true });

export const Application = mongoose.model('Application', applicationSchema);
