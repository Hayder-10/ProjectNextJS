import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['jerseys', 'boots', 'balls', 'training', 'accessories'], required: true },
    price: { type: Number, required: true, min: 0.001 }, // TND
    stock: { type: Number, required: true, min: 0 },
    imageUrl: String,
    // Boutique du vendeur ; sans boutique, le produit est vendu par FootHub
    shop: { type: Schema.Types.ObjectId, ref: 'Shop', index: true },
  },
  { timestamps: true },
);

export default mongoose.models.Product || mongoose.model('Product', productSchema);
