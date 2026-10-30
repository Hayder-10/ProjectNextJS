import mongoose, { Schema } from 'mongoose';

// Importé par scripts/import-football.ts, lecture seule dans l'application
const clubSchema = new Schema({
  tmId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  competitionTmId: { type: String, required: true, index: true },
  stadium: String,
  logoUrl: String,
});

export default mongoose.models.Club || mongoose.model('Club', clubSchema);
