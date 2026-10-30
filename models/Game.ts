import mongoose, { Schema } from 'mongoose';

// Importé par scripts/import-football.ts, lecture seule dans l'application
const gameSchema = new Schema({
  tmId: { type: Number, required: true, unique: true },
  competitionTmId: { type: String, required: true },
  season: { type: Number, required: true }, // 2024 = saison 2024/25
  round: String,
  date: { type: Date, required: true },
  homeClubTmId: Number,
  homeClubName: String,
  homeGoals: Number,
  awayClubTmId: Number,
  awayClubName: String,
  awayGoals: Number,
  stadium: String,
});

gameSchema.index({ competitionTmId: 1, season: 1 });
gameSchema.index({ homeClubTmId: 1 });
gameSchema.index({ awayClubTmId: 1 });

export default mongoose.models.Game || mongoose.model('Game', gameSchema);
