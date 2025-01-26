const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
const PORT = 3000;

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
