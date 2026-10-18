const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// রুট পাথ
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Cat backend is running" });
});

// চ্যাট রাউট
app.post(["/chat", "/api/chat"], async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // API Key না থাকলে স্পষ্ট এরর দেবে
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Server Error: GEMINI_API_KEY is not set in Environment Variables!" 
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: "You are a cute, friendly talking cat. Respond in a cute cat persona.",
      },
    });

    res.json({
      reply: response.text,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: error.message || "Failed to get response from AI",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
