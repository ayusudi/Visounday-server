# Visounday Server 

[https://visoundayserver.azurewebsites.net/](https://visoundayserver.azurewebsites.net/)

## Topics 
- Tech Stack 
- Schema DB
- API  
- How to Run the Application

## Tech Stack 

1. Use Database Azure Cosmos DB for MongoDB 
2. Node.js + Express 
3. Mongoose ORM
4. Open AI 
5. Firebase Authentication for Microsoft Login
6. Json Web Token
7. Canvas 
8. ffmpeg 
9. Multer 
10. Cloudinary for Video Indexer
11. Axios 

> For more detail check on `package.json`

## Schema DB

### User Schema
- **name**: Stores the user's name.
- **email**: Stores the user's email address, validated to ensure it matches a standard email format.
- **provider**: Indicates how the user is authenticated or registered (e.g., Google, Facebook).
- **videos**: An array of video IDs (`ObjectId`), referencing videos uploaded by the user.

Both schemas include:
- **timestamps**: Automatically adds `createdAt` and `updatedAt` fields to track document creation and updates.
- **versionKey**: Prevents adding a `__v` field to track document versions.

### Videos Schema
- **user**: References a user by their unique ID (`ObjectId`), linked to the 'User' model.
- **cloudinaryId**: Stores the ID associated with the video file on Cloudinary (a cloud-based media management platform).
- **url**: Stores the URL where the video can be accessed.
- **description**: Optional field for a text description of the video.
- **gpt**: Stores a string related to GPT (likely output from a GPT model).
- **tags**: An array of strings representing tags associated with the video.
- **gptChats**: An array of objects containing role, content, and type, likely representing chat data from a GPT model.
- **cover**: Stores a URL for the cover image of the video.
- **tagImages**: An array of objects containing keyword and URLs, likely representing images associated with specific tags.
- **frames**: An array of objects containing img_url, id, and text, likely representing frames or segments within the video.
- **bingStatus**: Boolean field indicating the status of something related to Bing (Microsoft's search engine), defaulting to false.


### Additional Notes:
- These schemas are defined using Mongoose, a library for MongoDB and Node.js, facilitating schema creation and model definition.
- They establish the structure for documents stored in MongoDB collections, with relationships (`ref` fields) defined between `User` and `Video` models for querying and population purposes.

## API   
Short explanation of visounday server API. 

 **Method** | **Routes**      | **Auth** | **Authz** | **Header**   | **Body**                                                       | **Response**  | **Description**                                                                                               
------------|-----------------|----------|-----------|--------------|----------------------------------------------------------------|----------------|---------------------------------------------------------------------------------------------------------------
 POST       | /verify         |          |           |              | Token from the client obtained through Microsoft Social Login. | Acces Token    | To get access token from Visounday Server.                                                                    
 GET        | /videos         | ✅        |           | Access Token |                                                                | List of Videos | Get list videos for logged user.                                                                              
 POST       | /videos         | ✅        |           | Access Token | Url of video and video id (from cloudinary unique name)        | Data Video     | Generate collage cover photo, video indexer tag, framing video and computer vision. Response is schema Video. 
 GET        | /videos/:id     | ✅        | ✅         | Access Token |                                                                | Data Video     | Get data video by id.                                                                                         
 POST       | /videos/:id/gpt | ✅        | ✅         | Access Token | Content : message as input to gpt from user                    | gptChats       | Interact with GPT-4.   



##  How to Run the Application 

> **You need serviceAccountKey.json for Microsoft Social Login from Firebase**

**Use Docker & Create .env` based `.env.template`**

**OR**

**Run code manually with node version 22.2.0**
- Create `.env` based `.env.template`
- Navigate terminal to this folder 
- Install package `npm install`
- Run application `npm run dev`
- Open localhost
