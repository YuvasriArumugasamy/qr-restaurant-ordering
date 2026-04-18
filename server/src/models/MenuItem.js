import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'Main' },
    imageUrl: { type: String, default: '' },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('MenuItem', menuItemSchema);
