import mongoose, { Schema } from 'mongoose';

const statFields = {
  appearances: { type: Number, default: 0 },
  goals: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  minutes: { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards: { type: Number, default: 0 },
};

// Importé par scripts/import-football.ts, lecture seule dans l'application
const playerSchema = new Schema({
  tmId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  position: { type: String, enum: ['GK', 'DEF', 'MID', 'FWD'], required: true },
  subPosition: String,
  nationality: String,
  birthDate: Date,
  clubTmId: Number,
  clubName: String,
  marketValueEur: Number,
  imageUrl: String,
  totals: statFields,
  seasons: [{ _id: false, season: Number, competitionTmId: String, ...statFields }],
});

// default_language 'none' : pas de règles de l'anglais sur des noms propres (« Mbappe » trouve « Mbappé »)
playerSchema.index({ name: 'text' }, { default_language: 'none' });
playerSchema.index({ position: 1 });
playerSchema.index({ clubTmId: 1 });

export default mongoose.models.Player || mongoose.model('Player', playerSchema);
