if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorhandler');
const Controller = require('./Controller');
const authentication = require('./middlewares/authentication');
const app = express();

const {
  COSMOSDB_HOST,
  COSMOSDB_PORT,
  COSMOSDB_DBNAME,
  COSMOSDB_USER,
  COSMOSDB_PASSWORD,
  PORT
} = process.env;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoUri = `mongodb://${COSMOSDB_USER}:${COSMOSDB_PASSWORD}@${COSMOSDB_HOST}:${COSMOSDB_PORT}/${COSMOSDB_DBNAME}?retryWrites=false&ssl=true&replicaSet=globaldb`;

app.post("/verify", Controller.verifyIdToken)
app.get("/videos", authentication, Controller.listVideo)
app.post("/videos", authentication, Controller.upload)
app.get("/videos/:cloudinaryId", authentication, Controller.videoIndexImage)
app.post("/videos/:cloudinaryId/gpt", authentication, Controller.visoundayGPT)

app.use(errorHandler)

mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 })
  .then(() => {
    console.log('Connection to CosmosDB successful')
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    })
  })
  .catch((err) => console.error('Error connecting to CosmosDB:', err));