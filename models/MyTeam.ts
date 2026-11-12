import mongoose, { Schema } from 'mongoose';
import { FORMATION_NAMES } from '../lib/validation/myxi';

const myTeamSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, maxlength: 80 },
    formation: { type: String, enum: FORMATION_NAMES, required: true },
    players: [{ type: Schema.Types.ObjectId, ref: 'Player' }], // exactement 11, vérifié dans l'action
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.models.MyTeam || mongoose.model('MyTeam', myTeamSchema);
