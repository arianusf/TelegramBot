const express = require("express");
const axios = require("axios"); // For making HTTP requests
const cors = require("cors");
const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

// Route to return the Base64 of an image from a URL
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
