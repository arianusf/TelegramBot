const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const tts = require("google-tts-api");

const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());

app.get("/convert", async (req, res) => {
  const oggUrl = req.query.url;
  if (!oggUrl) {
    return res.status(400).json({ error: "Missing OGG URL" });
  }

  try {
    // Download OGG file
    const oggPath = path.join(__dirname, "temp.ogg");
    const mp3Path = path.join(__dirname, "temp.mp3");

    const response = await axios({
      url: oggUrl,
      method: "GET",
      responseType: "stream",
    });

    const writer = fs.createWriteStream(oggPath);
    response.data.pipe(writer);

    writer.on("finish", () => {
      // Convert OGG to MP3
      ffmpeg(oggPath)
        .toFormat("mp3")
        .on("end", () => {
          const mp3Buffer = fs.readFileSync(mp3Path);
          res.setHeader("Content-Type", "audio/mpeg");
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="output.mp3"'
          );
          res.send(mp3Buffer);

          // Cleanup temp files
          fs.unlinkSync(oggPath);
          fs.unlinkSync(mp3Path);
        })
        .on("error", (err) => {
          res.status(500).json({ error: err.message });
        })
        .save(mp3Path);
    });

    writer.on("error", (err) => {
      res.status(500).json({ error: "Failed to download OGG file" });
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching OGG file" });
  }
});

app.get("/tts", async (req, res) => {
  try {
    const text = req.query.text || "hello"; // Get text from query param
    const language = req.query.lang || "en"; // Get language from query param

    const url = await tts.getAudioUrl(text, {
      lang: language,
      slow: false,
      host: "https://translate.google.com",
    });

    const response = await axios.get(url, { responseType: "arraybuffer" });

    res.setHeader("Content-Type", "audio/mpeg"); // Set appropriate header
    res.send(Buffer.from(response.data)); // Send audio as response
  } catch (error) {
    console.error("Error converting text to speech:", error);
    res.status(500).json({ error: "Failed to generate audio" });
  }
});

app.get("/image-to-base64", async (req, res) => {
  const imageUrl = req.query.url; // Get the image URL from query parameters

  if (!imageUrl) {
    return res
      .status(400)
      .send('Please provide an image URL using the "url" query parameter.');
  }

  try {
    // Fetch the image as a buffer using Axios
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data, "binary");

    // Convert the buffer to Base64
    const base64Image = imageBuffer.toString("base64");

    // Return the Base64 code
    res.json({ base64: base64Image });
  } catch (error) {
    console.error("Error fetching the image:", error.message);
    res
      .status(500)
      .send("Failed to fetch the image. Please check the URL and try again.");
  }
});

app.get("/news", async (req, res) => {
  const token = req.query.token; // Get the image URL from query parameters

  if (!token) {
    return res.status(400).send("Please provide a Token.");
  }

  try {
    // Fetch the image as a buffer using Axios
    const response = await axios.get(
      "https://newsapi.org/v2/top-headlines?country=us&apiKey=" + token
    );
    // const json = response.json();
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching the image:", error.message);
    res
      .status(500)
      .send(
        "Failed to fetch the image. Please check the URL and try again." +
          error.message
      );
  }
});

// Default route
app.get("/", (req, res) => {
  res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to my bot</title>
        </head>
        <body>
            <h1>Welcome to my bot</h1>
          </body>
        </html>
    `);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
