  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');
  const UserSchema = new mongoose.Schema(
    {
      username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
      },
      password: {
        type: String,
        required: true,
        minlength: 6,
        select: false,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      role: {
        type: String,
        enum: ['ADMIN', 'PARTICIPANT'],
        default: 'PARTICIPANT',
      },
      codeforcesUsername: {
        type: String,
        trim: true,
        index: true,
        sparse: true,
        unique : false,
      },
    },
    {
      timestamps: true,
      toJSON: {
        transform: function(doc, ret) {
          delete ret.password;
          delete ret.__v;
          return ret;
        },
      },
    }
  );

  // Index for efficient queries
  UserSchema.index({ username: 1, email: 1 });

  // Pre-save middleware to hash password
  UserSchema.pre('save', async function() {
    if (!this.isModified('password')) {
      return;
    }

    this.password = await bcrypt.hash(this.password, 10);
  });
  // Method to compare passwords
  UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
      const bcrypt = require('bcryptjs');
      return await bcrypt.compare(candidatePassword, this.password);
    } catch {
      return false;
    }
  };

  // Static method to find user by username or email
  UserSchema.statics.findByUsernameOrEmail = async function(username, email) {
    return this.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });
  };

  // Static method to find user by Codeforces username
  UserSchema.statics.findByCodeforcesUsername = async function(codeforcesUsername) {
    return this.findOne({ codeforcesUsername: codeforcesUsername });
  };

  module.exports = mongoose.model('User', UserSchema);