const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

// সকল অরিজিন সাপোর্ট করার জন্য CORS সক্রিয় করা হলো
app.use(cors());
app.use(express.json());

// API Key সেটআপ
const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";
let ai = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey: apiKey });
}

// সার্ভার স্ট্যাটাস চেক রুট
app.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Cat backend running smoothly",
    hasApiKey: !!apiKey 
  });
});

// চ্যাট রুট
app.post(["/chat", "/api/chat"], async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: "মেসেজ লিখুন" });
    }

    if (!apiKey || !ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY পাওয়া যায়নি! অনুগ্রহ করে Render-এর Environment-এ কি যোগ করুন।",
      });
    }

    // গুগলের সবচেয়ে দ্রুত এবং কার্যকর মডেলসমূহ
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];

    let replyText = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Testing Gemini model: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: message,
          config: {
            systemInstruction:
              "You are a cute, intelligent talking cat named Talking Cat. Always reply in clear Bengali with a sweet, friendly tone, cat persona, meows, and relevant emojis. Keep answers concise, factual, and helpful.",
          },
        });

        if (response && response.text) {
          replyText = response.text;
          console.log(`Success with: ${model}`);
          break;
        }
      } catch (err) {
        console.warn(`Model ${model} issue: ${err.message}`);
        lastError = err;
      }
    }

    if (!replyText) {
      throw new Error(lastError ? lastError.message : "কোনো মডেল থেকে উত্তর আসেনি");
    }

    res.json({
      reply: replyText,
    });
  } catch (error) {
    console.error("Chat Server Error:", error.message);
    res.status(500).json({ 
      error: error.message || "সার্ভারে কোনো সমস্যা হয়েছে" 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Cat Server running on port ${PORT}`);
});
