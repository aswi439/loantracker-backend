// src/models/Otp.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
  phone: string;
  otp: string;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  phone: { type: String, required: true, unique: true },
  otp:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // auto-delete after 5 minutes
});

export default mongoose.model<IOtp>('Otp', OtpSchema);
