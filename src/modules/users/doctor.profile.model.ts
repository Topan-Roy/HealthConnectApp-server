import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDoctorDocuments {
  medicalLicense?: string;
  nidPassport?: string;
  degreeCertificate?: string;
  profilePhoto?: string;
}

export interface IDoctorProfile extends Document {
  userId: mongoose.Types.ObjectId; // ref -> User
  
  // Professional Information
  specialty?: string;
  qualification?: string;
  experienceYears?: number;
  consultationFee?: number;
  hospitalClinic?: string;
  
  // Documents
  documents?: IDoctorDocuments;
  
  // Admin Approval Status
  status: 'pending' | 'approved' | 'rejected';
  
  isProfileComplete: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctorProfileModel extends Model<IDoctorProfile> {}

const doctorProfileSchema = new Schema<IDoctorProfile, IDoctorProfileModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    
    // Professional Information
    specialty: { type: String, trim: true },
    qualification: { type: String, trim: true },
    experienceYears: { type: Number, min: 0 },
    consultationFee: { type: Number, min: 0 },
    hospitalClinic: { type: String, trim: true },
    
    // Documents (Storing URLs/Paths)
    documents: {
      medicalLicense: { type: String, trim: true },
      nidPassport: { type: String, trim: true },
      degreeCertificate: { type: String, trim: true },
      profilePhoto: { type: String, trim: true },
    },
    
    // Admin Approval Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
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

const DoctorProfile = mongoose.model<IDoctorProfile, IDoctorProfileModel>(
  'DoctorProfile',
  doctorProfileSchema
);

export default DoctorProfile;
