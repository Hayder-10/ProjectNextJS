import mongoose, { Schema } from 'mongoose';

const replySchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 5000 },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, minlength: 3, maxlength: 120 },
    content: { type: String, required: true, minlength: 1, maxlength: 5000 },
    category: { type: String, enum: ['general', 'match-talk', 'transfers', 'tactics'], required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: [replySchema],
  },
  { timestamps: true },
);

export default mongoose.models.Post || mongoose.model('Post', postSchema);
