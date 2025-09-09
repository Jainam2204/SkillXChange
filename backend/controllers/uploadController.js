exports.uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.json({
    fileUrl: `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
  });
};