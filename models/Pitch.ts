import mongoose, { Schema } from 'mongoose';

const pitchSchema = new Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    type: { type: String, enum: ['5v5', '7v7', '11v11'], required: true },
    pricePerHour: { type: Number, required: true }, // TND
    openHour: { type: Number, required: true, min: 0, max: 23 },
    closeHour: { type: Number, required: true, min: 1, max: 24 },
    imageUrl: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.models.Pitch || mongoose.model('Pitch', pitchSchema);
