import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
}

export interface IOtpModel extends Model<IOtp> {}

const otpSchema = new Schema<IOtp, IOtpModel>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL: auto-delete when expiresAt passes
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Otp = mongoose.model<IOtp, IOtpModel>('Otp', otpSchema);
export default Otp;
