// src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  uid: string;          // Firebase UID
  phone: string;
  name: string;
  aadhaarLast4: string;
  district: string;
  state: string;
  role: 'beneficiary' | 'officer' | 'admin';
  complianceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    aadhaarLast4: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    role: { type: String, enum: ['beneficiary', 'officer', 'admin'], default: 'beneficiary' },
    complianceScore: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
