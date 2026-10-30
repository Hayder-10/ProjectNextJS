import mongoose, { Schema } from 'mongoose';

// Importé par scripts/import-football.ts, lecture seule dans l'application
const competitionSchema = new Schema({
  tmId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  country: String,
});

export default mongoose.models.Competition || mongoose.model('Competition', competitionSchema);
