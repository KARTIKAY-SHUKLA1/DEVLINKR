import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'devlinkr_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'docx'],
  },
});

const upload = multer({ storage });

export default upload;
