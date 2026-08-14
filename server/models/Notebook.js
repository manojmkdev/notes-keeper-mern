const mongoose = require('mongoose');

const notebookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Notebook name is required'],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.userId = ret.user ? ret.user.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        delete ret.user;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Notebook', notebookSchema);
