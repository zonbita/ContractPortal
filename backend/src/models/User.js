import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLES = ['admin', 'manager', 'staff', 'client'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, default: 'staff' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function matchPassword(entered) {
  return bcrypt.compare(entered, this.password);
};

export const User = mongoose.model('User', userSchema);
export { ROLES };
