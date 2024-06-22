const mongoose = require('mongoose');

const videosSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference to another mongoose model 'User'
  },
  cloudinaryId: {
    type: String
  },
  url: {
    type: String,
    required: [true, 'Url is required']
  },
  description: {
    type: String,
  },
  gpt: {
    type: String
  },
  tags: [{
    type: String
  }],
  gptChats: [
    {
      role: {
        type: String
      },
      content: {
        type: String
      },
      type: {
        type: String
      }
    }
  ],
  cover: {
    type: String
  },
  chats: [
    {
      from: {
        type: String
      },
      message: {
        type: String
      },
      type: {
        type: String
      }
    }
  ],
  tagImages: [
    {
      keyword: {
        type: String
      },
      urls: [
        { type: String }
      ]
    }
  ],
  frames: [
    {
      img_url: {
        type: String
      },
      id: {
        type: String
      },
      text: {
        type: String
      }
    }
  ],
  bingStatus: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false
});

const Video = mongoose.model('Video', videosSchema);

module.exports = Video;
