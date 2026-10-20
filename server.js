const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

// API Key ট্রিম করা (যাতে কোনো অনাকাঙ্ক্ষিত স্পেস বা ফাঁকা জায়গা না থাকে)
const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";
const ai = new GoogleGenAI({ apiKey: apiKey });

// রুট পাথ
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Cat backend running" });
});

// চ্যাট রাউট
app.post(["/chat", "/api/chat"], async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: "Server Error: GEMINI_API_KEY is not configured",
      });
    }

    // Google-এর বর্তমান সক্রিয় এবং ব্যাকআপ মডেল তালিকা
    const modelsToTry = [
      "gemini-flash-latest",
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash"
    ];

    let replyText = null;
    let lastErrorMessage = "";

    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: message,
          config: {
            systemInstruction:
              "You are a cute, friendly talking cat. Reply in a playful, charming, and loving cat persona with meows and emojis.",
          },
        });

        if (response && response.text) {
          replyText = response.text;
          console.log(`Success with model: ${model}`);
          break; // সফল হলে লুপ থামিয়ে দেবে
        }
      } catch (err) {
        console.warn(`Model ${model} failed: ${err.message}`);
        lastErrorMessage = err.message;
      }
    }

    if (!replyText) {
      throw new Error(lastErrorMessage || "All models failed");
    }

    res.json({
      reply: replyText,
    });
  } catch (error) {
    console.error("Chat error:", error);
    // সঠিক এরর মেসেজটি অ্যাপে পাঠানো হবে
    res.status(500).json({ error: error.message || "Couldn't reply" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
