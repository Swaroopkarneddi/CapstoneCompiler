//index.js
const express = require("express");
const { generateFile } = require("./GenerateFile");
const { executeCode } = require("./ExecuteCpp");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.post("/run_single", async (req, res) => {
  const { language = "cpp", code, input = "" } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    const filePath = await generateFile(language, code);
    const output = await executeCode(filePath, input, language);
    res.json({ message: "Code executed successfully", language, output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server is running on port 3000");
});
