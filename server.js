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
  res.json({ status: "ok", message: "Cat backend running" });
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
        error: "Server Error: GEMINI_API_KEY is not configured",
      });
    }

    // ব্যাকআপ সহ মডেল তালিকা (একটি ব্যস্ত থাকলে স্বয়ংক্রিয়ভাবে পরেরটি ব্যবহার হবে)
    const modelsToTry = [
      "gemini-3.8-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];

    let replyText = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
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
          break; // সফল হলে লুপ শেষ করে উত্তর পাঠিয়ে দেবে
        }
      } catch (err) {
        console.warn(`Model ${model} failed, trying next fallback model... Error:`, err.message);
        lastError = err;
      }
    }

    if (!replyText) {
      throw lastError || new Error("All AI models failed to generate response");
    }

    res.json({
      reply: replyText,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Couldn't reply" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
