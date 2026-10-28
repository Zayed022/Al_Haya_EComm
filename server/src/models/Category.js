import mongoose from 'mongoose';
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: '', maxlength: 1200 },
  imageUrl: { type: String, default: '' },
  cloudinaryPublicId: { type: String, default: '' },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });
export default mongoose.model('Category', categorySchema);
