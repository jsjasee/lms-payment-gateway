import { v2 as cloudinary } from "cloudinary";
import { configDotenv } from "dotenv";

configDotenv({ path: "../.env" });

// check and load env variables

cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.CLOUD_NAME,
});

// upload the media methods
export const uploadMedia = async function (file) {
  try {
    const uploadResponse = await cloudinary.uploader.upload(file, {
      resource_type: "auto", // will auto determine what type of file you are uploading
    });
    return uploadResponse;
  } catch (error) {
    console.log("Error in uploading media to cloudinary");
    console.log(error);
  }
};

export const deleteMediaFromCloudinary = async function (publicId) {
  try {
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.log("Failed to delete MEDIA (images) from cloudinary");
    console.log(error);
  }
};

export const deleteVideoFromCloudinary = async function (publicId) {
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });
    return response;
  } catch (error) {
    console.log("Failed to delete VIDEO from cloudinary");
    console.log(error);
  }
};
