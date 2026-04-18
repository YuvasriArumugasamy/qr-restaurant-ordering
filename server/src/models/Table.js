import mongoose from 'mongoose';
import crypto from 'crypto';

const tableSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true },
    label: { type: String, default: '' },
    code: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(8).toString('hex'),
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Table', tableSchema);
