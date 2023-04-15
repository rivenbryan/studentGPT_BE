const express = require("express")
const chatGPT_router = express.Router()
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

/*
* Initialise the controller files
*/
const chatGPTController = require("../controller/chatGPTController")

/*
 Second parameter is used as a callback function for multer 
 To processes the incoming request before the main route handler function is execute
*/
chatGPT_router.post("/upload", upload.single('image'), chatGPTController.sendImageToChatGPT)
chatGPT_router.post("/request", chatGPTController.sendChatMessage)
chatGPT_router.post("/generateImage", chatGPTController.sendGenerateImage)

module.exports = chatGPT_router