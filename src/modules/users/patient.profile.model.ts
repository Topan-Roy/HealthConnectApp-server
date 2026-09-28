import mongoose, { Schema, Document, Model } from 'mongoose';

// ── Sub-document interfaces ──────────────────────────────────────────────────

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IAddress {
  division: string;
  district: string;
  area?: string;
  fullAddress?: string;
}

export interface IHealthInfo {
  bloodGroup?: string;
  height?: number;   // cm
  weight?: number;   // kg
  allergies?: string;
  existingConditions?: string;
}

// ── Main interface ────────────────────────────────────────────────────────────

export interface IPatientProfile extends Document {
  userId: mongoose.Types.ObjectId;  // ref → User

  // Personal info (Step 1 of profile)
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';

  // Profile photo (Step 2)
  profilePhotoUrl?: string;

  // Health info (Step 3)
  healthInfo?: IHealthInfo;

  // Emergency contact (Step 4)
  emergencyContact?: IEmergencyContact;

  // Address (Step 5)
  address?: IAddress;

  // Completion flag
  isProfileComplete: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface IPatientProfileModel extends Model<IPatientProfile> {}

// ── Schema ────────────────────────────────────────────────────────────────────

const patientProfileSchema = new Schema<IPatientProfile, IPatientProfileModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Personal info
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },

    // Profile photo
    profilePhotoUrl: { type: String, trim: true },

    // Health info
    healthInfo: {
      bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      },
      height: { type: Number, min: 0 },
      weight: { type: Number, min: 0 },
      allergies: { type: String, trim: true },
      existingConditions: { type: String, trim: true },
    },

    // Emergency contact
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true },
    },

    // Address
    address: {
      division: { type: String, trim: true },
      district: { type: String, trim: true },
      area: { type: String, trim: true },
      fullAddress: { type: String, trim: true },
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const PatientProfile = mongoose.model<IPatientProfile, IPatientProfileModel>(
  'PatientProfile',
  patientProfileSchema
);

export default PatientProfile;
