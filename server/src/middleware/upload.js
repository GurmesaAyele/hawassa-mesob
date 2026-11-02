import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// Initialize Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Validates the image file buffer magic bytes against JPEG, PNG, and WebP signatures.
 */
export function isValidImageBuffer(buffer) {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // WebP: RIFF .... WEBP
  const riff = buffer.toString("ascii", 0, 4);
  const webp = buffer.toString("ascii", 8, 12);
  if (riff === "RIFF" && webp === "WEBP") {
    return true;
  }

  return false;
}

/**
 * Stream image buffer directly into Cloudinary.
 */
export async function uploadBufferToCloudinary(buffer, folder = "hawassa-mesob/logos") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB maximum limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMime.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
    }
    cb(null, true);
  },
});

/**
 * Express middleware to handle multipart form data with institution logo upload.
 */
export function handleLogoUpload(req, res, next) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    return next();
  }

  upload.single("logo")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "The logo must be 2 MB or smaller." });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (req.file) {
      if (!isValidImageBuffer(req.file.buffer)) {
        return res.status(400).json({
          error: "Invalid image content. File header does not match valid JPEG, PNG, or WebP.",
        });
      }

      try {
        const secureUrl = await uploadBufferToCloudinary(req.file.buffer);
        req.cloudinaryUrl = secureUrl;
        req.body.icon = secureUrl;
        req.body.logoUrl = secureUrl;
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr.message || uploadErr);
        return res.status(502).json({
          error: "Failed to upload image to Cloudinary storage. Please check cloud credentials.",
        });
      }
    }

    next();
  });
}
