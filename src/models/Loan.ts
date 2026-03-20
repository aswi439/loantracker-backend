// src/models/Loan.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ILoan extends Document {
  loanId: string;
  beneficiaryUid: string;
  type: string;
  sanctionedAmount: number;
  disbursedAmount: number;
  nextTrancheAmount: number;
  progress: number;
  status: 'active' | 'pending_review' | 'completed' | 'rejected';
  dueDate: Date;
  registeredAddress: {
    latitude: number;
    longitude: number;
    address: string;
  };
  uploads: number;
  complianceScore: number;
  assignedOfficer?: string;
  bankName?: string;
  sanctionDate?: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    loanId: { type: String, required: true, unique: true },
    beneficiaryUid: { type: String, required: true, index: true },
    type: { type: String, required: true },
    sanctionedAmount: { type: Number, required: true },
    disbursedAmount: { type: Number, default: 0 },
    nextTrancheAmount: { type: Number, default: 0 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['active', 'pending_review', 'completed', 'rejected'],
      default: 'active',
    },
    dueDate: { type: Date },
    registeredAddress: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: true },
    },
    uploads: { type: Number, default: 0 },
    complianceScore: { type: Number, default: 0 },
    assignedOfficer: String,
    bankName: String,
    sanctionDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model<ILoan>('Loan', LoanSchema);
