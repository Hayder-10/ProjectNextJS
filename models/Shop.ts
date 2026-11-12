import mongoose, { Schema } from 'mongoose';

// Boutique d'un vendeur : un utilisateur en a une seule, validée par un admin avant d'ouvrir
const shopSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, maxlength: 60 },
    description: { type: String, required: true, maxlength: 1000 },
    city: { type: String, required: true, maxlength: 60 },
    logoUrl: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending', index: true },
    rejectionReason: String,
  },
  { timestamps: true },
);

export default mongoose.models.Shop || mongoose.model('Shop', shopSchema);
