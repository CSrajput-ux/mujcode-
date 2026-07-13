import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  industry: { type: String },
  logo: { type: String },
  adminIds: [{ type: String }], // Array of user IDs (currently string in JSON mock DB)
  settings: {
    themeColor: { type: String, default: '#FF7A00' }
  }
}, { timestamps: true });

export const Company = mongoose.model('Company', companySchema);
