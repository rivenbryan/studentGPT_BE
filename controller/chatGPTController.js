

const { Configuration, OpenAIApi } = require("openai");
const cloudinary = require('../utils/cloudinary')
const axios = require('axios');
const sharp = require('sharp');
const FormData = require('form-data');

require('dotenv').config({ path: '.env' });

const sendChatMessage = async (req, res) => {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    console.log(req.body)
    const allUserMessage = req.body
    const messageBodyToOpenAI = allUserMessage.map((content) => ({
        role: "user",
        content,
    }))
    console.log(messageBodyToOpenAI)
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messageBodyToOpenAI,
        });
        console.log("test")
        console.log(completion.data.choices[0].message.content)
        // Do checking and extract out the component
        res.send(completion.data.choices[0].message.content)
    } catch (error) {
        console.log(error)
    }
}

const sendGenerateImage = async (req, res) => {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const messageDictionary = req.body
    messageDictionary["n"] = 1
    messageDictionary["size"] = "256x256"

    try {
        const response = await openai.createImage(messageDictionary);

        const image_url = response.data.data[0].url;
        res.send(image_url)
    } catch (error) {
        console.log(error.response.data)
    }
}

const uploadImageToCloudinary = async (buffer, res) => {
    try {
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) {
                        console.error('Error uploading image:', error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            ).end(buffer);
        });
        return result.secure_url;
    } catch (error) {
        console.log("is it here")
        throw error;
    }
};

const getOcrText = async (imageUrl, fileType) => {
    const ocrApiUrl = 'https://api.ocr.space/parse/image';
    
    // Create a FormData object and append the necessary fields
    const formData = new FormData();
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('url', imageUrl);
    formData.append('iscreatesearchablepdf', 'false');
    formData.append('issearchablepdfhidetextlayer', 'false');
    if (fileType) {
      formData.append('filetype', fileType);
    }
  
    try {
      const response = await axios.post(ocrApiUrl, formData, {
        headers: {
          apikey: process.env.OCR_API_KEY,
          ...formData.getHeaders(),
        },
      });
  
      return response.data;
    } catch (error) {
      console.error('Error getting OCR text:', error);
      throw error;
    }
  };

  const compressImage = async (inputBuffer) => {
    try {
        // Read and rotate the image based on its Exif metadata
        const rotatedImageBuffer = await sharp(inputBuffer)
            .rotate() // This line reads the Exif orientation and rotates the image accordingly
            .toBuffer();

        // Compress the image using the rotated buffer
        const compressedImageBuffer = await sharp(rotatedImageBuffer)
            .jpeg({ quality: 50 }) // Adjust the quality parameter for desired compression level (0-100)
            .toBuffer();

        return compressedImageBuffer;
    } catch (error) {
        console.error('Error compressing image:', error);
        throw error;
    }
};

const sendImageToChatGPT = async (req, res) => {
    const fileType = req.file.mimetype
    console.log(fileType)

    try {
        /* Function to compress image */
        const compressedBuffer = await compressImage(req.file.buffer)
        console.log("Finished first function\n");
        /* Function to send image to cloudinary*/
        const urlFromCloudinary = await uploadImageToCloudinary(compressedBuffer, res);
        console.log("Finished second function\n" + urlFromCloudinary);


         /* Function to send the URL to OCR */
        const message = await getOcrText(urlFromCloudinary);
        console.log(message)
        console.log("Finished third function\n" + message.ParsedResults[0].ParsedText);

        /* If everything is successfully send this back to main function */
        res.send(message.ParsedResults[0].ParsedText)
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Error uploading image' });
    }

};


const chatGPTController = {
    sendChatMessage,
    sendGenerateImage,
    sendImageToChatGPT
}

module.exports = chatGPTController