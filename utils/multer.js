import multer from "multer";

const upload = multer({ dest: "uploads/" }); // in the docs, it is just 1 line

export default upload;
