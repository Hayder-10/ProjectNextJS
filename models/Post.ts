import mongoose, { Schema } from 'mongoose';

const replySchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 5000 },
  createdAt: { type: Date, default: Date.now },
});

// Formation publiée : copie du XI, pour que la discussion garde son sens si le XI change ensuite
const lineupSchema = new Schema(
  {
    name: String,
    formation: String,
    players: [{ _id: false, name: String, position: String, imageUrl: String, clubName: String }],
  },
  { _id: false },
);

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, minlength: 3, maxlength: 120 },
    content: { type: String, required: true, minlength: 1, maxlength: 5000 },
    category: { type: String, enum: ['general', 'match-talk', 'transfers', 'tactics'], required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: [replySchema],
    lineup: lineupSchema,
  },
  { timestamps: true },
);

export default mongoose.models.Post || mongoose.model('Post', postSchema);
