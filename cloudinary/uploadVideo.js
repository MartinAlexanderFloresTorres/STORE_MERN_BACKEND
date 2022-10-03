import { v2 as cloudinary } from "cloudinary";

const uploadVideo = async ({ path, folder }) => {
  return await cloudinary.uploader
    .upload(path, {
      folder,
      resource_type: "video",
      chunk_size: 6000000,
      audio_codec: "none",
    })
    .catch((error) => {
      console.log(error);
    });
};

export default uploadVideo;
