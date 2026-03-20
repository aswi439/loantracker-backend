// src/models/Upload.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUpload extends Document {
  uploadId: string;
  loanId: string;
  beneficiaryUid: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  note?: string;
  trustScore: number | null;
  aiResult: {
    layers: {
      gpsMatch: { score: number; maxScore: number; passed: boolean; detail: string };
      objectDetection: { score: number; maxScore: number; passed: boolean; detectedObjects: string[]; detail: string };
      tamperDetection: { score: number; maxScore: number; passed: boolean; detail: string };
      progressTimeline: { score: number; maxScore: number; passed: boolean; detail: string };
      quantityEstimate: { score: number; maxScore: number; passed: boolean; detail: string };
    };
    flags: string[];
    recommendation: string;
  } | null;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewComment?: string;
  reviewedAt?: Date;
}

const UploadSchema = new Schema<IUpload>(
  {
    uploadId: { type: String, required: true, unique: true },
    loanId: { type: String, required: true, index: true },
    beneficiaryUid: { type: String, required: true, index: true },
    photoUrl: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    note: String,
    trustScore: { type: Number, default: null },
    aiResult: { type: Schema.Types.Mixed, default: null },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: String,
    reviewComment: String,
    reviewedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model<IUpload>('Upload', UploadSchema);
