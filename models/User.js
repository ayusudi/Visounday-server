const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    validate: {
      validator: function (value) {
        return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(value);
      },
      message: 'Email must include @ and .'
    },
  },
  provider: {
    type: String,
    required: [true, 'Provider is required'],
  },
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Videos'
  }],
}, {
  timestamps: true,
  versionKey: false
});

const User = mongoose.model('User', userSchema);

module.exports = User;
