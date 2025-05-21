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
  console.log(data);

  if (!data) {
    return res.status(400).json({ error: "Prompt is required" });
  }
  // Return the output in a single line with no line breaks.
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

function normaliseSkillLevels(raw) {
  // 1️⃣ Strip ```json … ``` or ``` … ``` fences if present
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "") // opening fence
    .replace(/\s*```$/i, ""); // closing fence

  // 2️⃣ Parse to JS
  const parsed = JSON.parse(cleaned); // will be an array of 3 objects

  // 3️⃣ Colour map
  const colours = {
    Advanced: "#ff5252", // red
    Intermediate: "#f5c842", // amber
    Fundamental: "#44d88d", // green
  };

  // 4️⃣ Transform
  return parsed.map((obj) => {
    // each obj has exactly one key (the level)
    const level = Object.keys(obj)[0];
    return {
      level,
      color: colours[level],
      groups: obj[level], // already sorted by count desc
    };
  });
}

app.post("/ask_gemini/ClasifySkills", async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const prompt = String.raw`
You are a JSON‑only formatter.

############  INPUT  ############
A single JSON object whose keys are skill names and whose values are
positive integers (frequencies), e.g.:

${JSON.stringify(data, null, 2)}

############  TASK  ############
1. Put every skill into exactly one of three levels:
   • Advanced
   • Intermediate
   • Fundamental
2. Build an **array (length = 3)** of level objects **in this exact order**:
   a) Advanced   b) Intermediate   c) Fundamental  
   Each level object MUST have **one key only** – the level name – whose
   value is an **array of { name (string), count (number) }** items.
3. Within each level array, sort items by **count descending**.
4. **Return valid JSON ONLY.** No markdown, no explanation, no extra keys.

############  OUTPUT SCHEMA ############
[
  {
    "Advanced": [
      { "name": "","count":  },
      .....
    ]
  },
  {
    "Intermediate": [
      { "name": "","count":  },....
    ]
  },
  {
    "Fundamental": [
      { "name": "","count":   }
    ]
  }
]

############  CRITICAL RULE ############
You MUST output **exactly** one JSON value that validates against the
schema above — no surrounding text, comments, code fences or whitespace before/after.
`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const payload = normaliseSkillLevels(raw);
    res.json({ levels: payload });
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: "Failed to get response from Gemini" });
  }
});

app.post("/ask_gemini/whatToDoNext", async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: "Prompt (code) is required" });
  }

  const prompt = `
You are a senior software engineer. A developer has submitted the following code (either finished or unfinished):

\`\`\`
${data}
\`\`\`

Your task is to carefully analyze this code and suggest what the developer should do next to improve, complete, or test the code.

Return the response **strictly** as a **JSON array of strings**, where each string is a suggestion or next step.

Examples:
[
  "Add input validation",
  "Write unit tests for edge cases"
]

Do not include any explanation or markdown around the JSON. If you must use markdown, wrap it in \`\`\`json\`\`\` only.
`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    let suggestions;
    try {
      // Remove Markdown code block if present
      const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
      suggestions = JSON.parse(cleaned);
    } catch (e) {
      return res
        .status(500)
        .json({ error: "Invalid response format from Gemini", raw });
    }

    res.json({ suggestions });
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: "Failed to get response from Gemini" });
  }
});

// Route to execute code

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
