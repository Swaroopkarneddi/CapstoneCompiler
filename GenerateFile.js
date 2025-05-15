const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const directoryPath = path.join(__dirname, "codes");

if (!fs.existsSync(directoryPath)) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

const generateFile = async (format, code) => {
  const jobId = uuid();
  const extensionMap = {
    cpp: "cpp",
    python: "py",
    java: "java",
  };

  const ext = extensionMap[format.toLowerCase()];
  if (!ext) throw new Error("Unsupported language");

  const fileName = `${jobId}.${ext}`;
  const filePath = path.join(directoryPath, fileName);
  fs.writeFileSync(filePath, code);
  return filePath;
};

module.exports = {
  generateFile,
};
