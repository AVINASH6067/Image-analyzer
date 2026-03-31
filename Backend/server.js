import express from "express";
import AWS from "aws-sdk";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

// AWS Rekognition
const rekognition = new AWS.Rekognition({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Test route
app.get("/", (req, res) => {
  res.send("API working");
});


// 📂 Get images from S3
app.get("/s3-images", async (req, res) => {
  try {
    const data = await s3.listObjectsV2({
      Bucket: process.env.BUCKET_NAME,
    }).promise();

    const images = data.Contents?.map(obj => obj.Key) || [];
    res.json(images);

  } catch (err) {
    console.error("S3 ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// 🖼️ Get signed URL for preview
app.get("/s3-url/:key", (req, res) => {
  const key = req.params.key;

  const url = s3.getSignedUrl("getObject", {
    Bucket: process.env.BUCKET_NAME,
    Key: key,
    Expires: 60,
  });

  res.json({ url });
});


// 📸 Analyze uploaded image
app.post("/analyze-image", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const imageBytes = req.file.buffer;

  try {
    const data = await rekognition.detectFaces({
      Image: { Bytes: imageBytes },
      Attributes: ["ALL"],
    }).promise();

    res.json({
      faces: data.FaceDetails,
    });

  } catch (err) {
    console.error("Rekognition ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ☁️ Analyze image from S3
app.post("/analyze-s3", async (req, res) => {
  const { key } = req.body;

  try {
    const params = {
      Image: {
        S3Object: {
          Bucket: process.env.BUCKET_NAME,
          Name: key,
        },
      },
      Attributes: ["ALL"],
    };

    const data = await rekognition.detectFaces(params).promise();

    res.json({
      faces: data.FaceDetails,
    });

  } catch (err) {
    console.error("S3 Rekognition ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// 🚀 Start server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});