import mongoose, { Schema } from 'mongoose';

const bookingSchema = new Schema(
  {
    pitch: { type: Schema.Types.ObjectId, ref: 'Pitch', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    startHour: { type: Number, required: true }, // créneau startHour → startHour + 1
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
    price: { type: Number, required: true }, // copié de pitch.pricePerHour
  },
  { timestamps: true },
);

// Dernière protection contre la double réservation d'un créneau
bookingSchema.index(
  { pitch: 1, date: 1, startHour: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } },
);

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
