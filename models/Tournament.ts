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
    champion: String,
    teams: [
      {
        name: { type: String, required: true },
        captain: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        players: [String], // copiés depuis l'équipe au moment de l'inscription
      },
    ],
    matches: [
      {
        homeTeam: String,
        awayTeam: String,
        homeScore: Number,
        awayScore: Number,
        homeYellow: Number,
        awayYellow: Number,
        round: String,
        stage: { type: String, enum: ['group', 'knockout'] },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.models.Tournament || mongoose.model('Tournament', tournamentSchema);
