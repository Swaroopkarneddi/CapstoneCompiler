//index.js
const express = require("express");
const { generateFile } = require("./GenerateFile");
const { executeCode } = require("./ExecuteCpp");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyAA47F-3svJu926E8kca4a4R7jKwvqfjOg";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

//  Route to talk to Gemini
// app.post("/ask_gemini/segrigate", async (req, res) => {
//   const { data } = req.body;

//   if (!data) {
//     return res.status(400).json({ error: "Prompt is required" });
//   }

//   const prompt = `**important return only the lists like this format list1=[.....]; list2=[.......] **dont return explanation ,**dont keep other signs only give in the desired format ,segrigate the given topics into two lists  compitativve coding related topics and other  ${data} and return only the list1 , list2`;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = result.response.text();
//     res.json({ response });
//   } catch (error) {
//     console.error("Gemini API Error:", error);
//     res.status(500).json({ error: "Failed to get response from Gemini" });
//   }
// });

app.post("/ask_gemini/segrigate", async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // const prompt = `**important return only the lists like this format list1=[.....]; list2=[.......] **dont return explanation ,**dont keep other signs only give in the desired format ,segrigate the given topics into two lists  compitativve coding related topics and other  ${data} and return only the list1 , list2`;
  const prompt = `
  You are required to return only two lists in the **exact** format:
  
  list1=[item1, item2, ...]; list2=[item1, item2, ...]
  
  **Do not include any explanation, newlines, extra symbols, markdown formatting, or quotation marks.**
  
  Now, from the following input, separate the items into two categories:
  - list1 = competitive coding related topics
  - list2 = all other topics
  
  Return ONLY the lists in the format mentioned above.
  
  INPUT: ${data}
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract lists from response
    const match = responseText.match(/list1=\[(.*?)\];\s*list2=\[(.*?)\]/s);
    if (!match) {
      return res.status(500).json({ error: "Invalid format from Gemini" });
    }

    const list1Raw = match[1];
    const list2Raw = match[2];

    // Convert string to array
    const parseList = (raw) => {
      return raw
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""));
    };

    const codingTopicsList = parseList(list1Raw);
    const otherTopicsList = parseList(list2Raw);

    res.json({ codingTopicsList, otherTopicsList });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to get response from Gemini" });
  }
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
