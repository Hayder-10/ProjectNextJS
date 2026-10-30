import mongoose, { Schema } from 'mongoose';

const tournamentSchema = new Schema(
  {
    organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: String,
    city: { type: String, required: true },
    pitch: { type: Schema.Types.ObjectId, ref: 'Pitch' },
    startDate: { type: String, required: true }, // 'YYYY-MM-DD'
    maxTeams: { type: Number, enum: [4, 8, 16], required: true },
    status: { type: String, enum: ['open', 'ongoing', 'finished'], default: 'open' },
    teams: [
      {
        name: { type: String, required: true },
        captain: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    matches: [
      {
        homeTeam: String,
        awayTeam: String,
        homeScore: Number,
        awayScore: Number,
        round: String,
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.models.Tournament || mongoose.model('Tournament', tournamentSchema);
