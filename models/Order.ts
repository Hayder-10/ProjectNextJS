import mongoose, { Schema } from 'mongoose';

const orderSchema = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Copiés au moment de la commande
    items: [
      {
        _id: false,
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'cancelled'], default: 'pending' },
    shippingAddress: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
