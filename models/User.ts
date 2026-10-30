import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 50, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false => jamais renvoyé sauf si on le demande explicitement (+passwordHash)
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatarUrl: String,
    city: String,
    favoriteClub: { type: Schema.Types.ObjectId, ref: 'Club' },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model('User', userSchema);
