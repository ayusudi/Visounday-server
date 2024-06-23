const { SECRET_JWT } = process.env

const User = require('./models/User')
const Video = require('./models/Video')
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { v2: cloudinary } = require('cloudinary');
const jwt = require("jsonwebtoken")
const admin = require("firebase-admin");

const path = require('path');
const fs = require('fs');

const serviceAccountKey = require('./serviceAccountKey.json')
const computerVision = require('./helpers/computerVision');
const createCollage = require('./helpers/collagePhoto');
const searchImages = require('./helpers/bingAPI');
const promptVisounday = require('./helpers/promptVisounday')
const chatGPTAzureOpenAI = require('./helpers/chatGPTAzureOpenAI')

const {
  FIREBASE_APIKEY,
  FIREBASE_AUTHDOMAIN,
  FIREBASE_PROJECTID,
  FIREBASE_APPID,
  FIREBASE_MEASUREMENTID
} = process.env

const outputDir = path.join(__dirname, 'frames');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  apiKey: FIREBASE_APIKEY,
  authDomain: FIREBASE_AUTHDOMAIN,
  projectId: FIREBASE_PROJECTID,
  appId: FIREBASE_APPID,
  measurementId: FIREBASE_MEASUREMENTID
})

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class Controller {
  static async verifyIdToken(req, res) {
    try {
      const idToken = req.body.id_token;
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      let payload = decodedToken;
      let user = await User.findOne({ email: decodedToken.email });
      if (!user) {
        user = await User.create({
          name: payload.name,
          email: payload.email,
          provider: payload.firebase.sign_in_provider
        });
      }
      const access_token = jwt.sign({ id: user._id, email: user.email }, SECRET_JWT);
      res.status(200).json({
        message: 'Successfully logged in',
        access_token,
        name: payload.name,
        email: payload.email,
        provider: payload.firebase.sign_in_provider
      });
    } catch (error) {
      console.error('Error verifying token:', error);
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
  static async upload(req, res, next) {
    try {
      let { url, cloudinaryId } = req.body
      await Controller.addIndexer(cloudinaryId)
      const videoFilePath = path.join(__dirname, 'video.mp4');
      await Controller.downloadVideo(url, videoFilePath);
      await Controller.extractFrames(videoFilePath, cloudinaryId);
      const uploadedFrames = await Controller.uploadFramesToCloudinary();
      fs.unlinkSync(videoFilePath)
      let promises = []
      uploadedFrames.forEach((el, i) => promises.push(computerVision({ url: el.url }, { img_url: el.url, id: i + 1 })))
      const frames = await Promise.all(promises)
      let framesUrl = frames.map(el => el.img_url)
      let str = await createCollage(framesUrl, cloudinaryId)
      const result = await cloudinary.uploader.upload(str, { folder: 'covers', public_id: path.basename(str, path.extname(str)) });
      fs.unlinkSync(str);
      let cover = result.secure_url
      let { tags } = await Controller.addIndexer(cloudinaryId)
      let data = await Video.create({ cover, frames, cloudinaryId, url, description: '', gpt: '', tags, JSON: '{}', user: req.user.id })
      res.status(201).json(data)
    } catch (error) {
      console.log(error);
      next(error)
    }
  }
  static async addIndexer(input) {
    try {
      let result = await cloudinary.api.update(
        `videos/${input}`,
        {
          resource_type: "video",
          categorization: "azure_video_indexer",
          auto_tagging: 0.4,
          type: "upload" // Specify the type of resource you are updating
        }
      );
      return result
    } catch (error) {
      console.log(error);
    }
  }
  static async videoIndexImage(req, res, next) {
    const { cloudinaryId } = req.params;
    try {
      const video = await Video.findOne({ cloudinaryId });
      if (video.user.toString() !== req.user.id) throw { status: 403, name: 'Forbidden' }
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      if (!video.tags.length) {
        let { tags } = await Controller.addIndexer(video.cloudinaryId)
        video.tags = tags
        await video.save()
      }
      if (!video.bingStatus || !video.tagImages.length) {
        let tagImages = await searchImages(video.tags)
        video.tagImages = tagImages
        if (tagImages.length > 1) {
          video.bingStatus = true
        }
        await video.save()
      }
      res.status(200).json({ video })
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
  static async listVideo(req, res, next) {
    try {
      let userId = req.user.id
      const videos = await Video.find({ user: userId })
      res.status(200).json(videos)
    } catch (error) {

      next(error)
    }
  }
  static async extractFrames(videoPath, video_id) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', resolve)
        .on('error', reject)
        .output(`${outputDir}/${video_id}-frame-%03d.png`)
        .outputOptions([
          '-vf', 'fps=1/5'
        ])
        .run();
    });
  }
  static async uploadFramesToCloudinary() {
    const frames = fs.readdirSync(outputDir).map(file => path.join(outputDir, file));
    const uploadedResults = [];

    for (const frame of frames) {
      try {
        const result = await cloudinary.uploader.upload(frame, {
          folder: 'extracted_frames', // optional: folder in Cloudinary where frames will be stored
          public_id: path.basename(frame, path.extname(frame)) // optional: use the base filename as public_id
        });
        fs.unlinkSync(frame);
        uploadedResults.push(result);
      } catch (error) {
        console.error('Error uploading frame to Cloudinary:', error);
      }
    }
    return uploadedResults;
  }
  static async downloadVideo(url, outputPath) {
    const writer = fs.createWriteStream(outputPath);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
  static async visoundayGPT(req, res, next) {
    const { cloudinaryId } = req.params;
    const { content } = req.body
    try {
      const video = await Video.findOne({ cloudinaryId });
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      if (video.user.toString() !== req.user.id) throw { status: 403, name: 'Forbidden' }
      if (!video.gpt.length) {
        video.gpt = `OPEN: ${new Date().toISOString()};`
        let gptChats = [
          {
            role: 'assistant',
            content: "Hello! I'm Visounday, an AI designed to help content creators like you analyze video data and provide insights. I can describe your raw data in a way that's easy to understand and visualize, and I can also recommend background music to enhance your content. How can I assist you today?",
            type: "init"
          },
          {
            role: 'user',
            content: "Hi Visounday, let's do your work! Here is the video and generate.json",
            type: "input-text"
          },
          { role: "user", content: "JSON", type: "input-json" },
          { role: "user", content: "URL VIDEO", type: "input-video" },
        ]
        let { content, role } = await promptVisounday(video.url, video.frames)
        gptChats.push({ role, content, type: 'markdown' })
        video.gptChats = gptChats
        await video.save()
        return res.status(200).json(gptChats)
      }

      let array = video.gptChats.map(el => {
        return {
          role: el.role,
          content: el.content
        }
      })
      array = array.slice(4)
      if (array.length == 1) {
        array.push({ role: 'user', content })
      } else {
        array = [array[0], array[array.length - 1]]
        array.push({ role: 'user', content })
      }
      let responseVisouday = await chatGPTAzureOpenAI(array)
      let userInput = { role: 'user', content, type: 'input-text' }
      let gptOuput = { role: 'assistant', content: responseVisouday.content, type: 'markdown' }
      video.gptChats.push(userInput, gptOuput)
      await video.save()
      return res.status(200).json(video.gptChats)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = Controller