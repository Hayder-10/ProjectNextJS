import mongoose, { Schema } from 'mongoose';

// Équipe amateur d'un utilisateur, réutilisable d'un tournoi à l'autre
const teamSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, maxlength: 40 },
    players: [{ type: String, required: true, maxlength: 60 }],
  },
  { timestamps: true },
);

export default mongoose.models.Team || mongoose.model('Team', teamSchema);
