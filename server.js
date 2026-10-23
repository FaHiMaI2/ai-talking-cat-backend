const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

// API Key নেওয়া
const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Talking Cat Backend Active",
    hasApiKey: Boolean(apiKey)
  });
});

app.post(["/chat", "/api/chat"], async (req, res) => {
  try {
    const message = req.body.message || "";

    if (!message.trim()) {
      return res.status(400).json({ error: "মেসেজ লিখুন" });
    }

    console.log("ইউজারের প্রশ্ন:", message);

    let replyText = null;

    // ১. সাধারণ জ্ঞান অটো-প্রোটেকশন (পাখি/পাখী যেকোনো বানানে ১০০% কাজ করবে)
    const normalized = message.normalize("NFC");

    if (/পাখ/i.test(normalized)) {
      replyText = "বাংলাদেশের জাতীয় পাখি হলো দোয়েল! 🐱🐾";
    } else if (/ফুল/i.test(normalized)) {
      replyText = "বাংলাদেশের জাতীয় ফুল হলো সাদা শাপলা! 🐱🌸";
    } else if (/ফল/i.test(normalized)) {
      replyText = "বাংলাদেশের জাতীয় ফল হলো কাঁঠাল! 🐱🍈";
    } else if (/পশু|বাঘ|প্রাণী/i.test(normalized)) {
      replyText = "বাংলাদেশের জাতীয় পশু হলো রয়েল বেঙ্গল টাইগার! 🐱🐯";
    } else if (/মাছ|ইলিশ/i.test(normalized)) {
      replyText = "বাংলাদেশের জাতীয় মাছ হলো ইলিশ! 🐱🐟";
    } else if (/রাজধান/i.test(normalized)) {
      replyText = "বাংলাদেশের রাজধানী হলো ঢাকা! 🐱🏛️";
    } else if (/কবি/i.test(normalized)) {
      replyText = "বাংলাদেশের জাতীয় কবি হলেন কাজী নজরুল ইসলাম! 🐱📜";
    }

    // ২. গুগলের বর্তমান সক্রিয় মডেলসমূহ দিয়ে AI কল
    if (!replyText && ai) {
      const modelsToTry = [
        "gemini-3.8-flash",
        "gemini-2.5-flash",
        "gemini-flash-latest"
      ];

      for (const model of modelsToTry) {
        try {
          console.log(`Trying model: ${model}`);
          const response = await ai.models.generateContent({
            model: model,
            contents: message,
            config: {
              systemInstruction:
                "You are Talking Cat, a smart, cute talking cat. Answer factually accurate real-world truths in natural sweet Bengali with meows and emojis. Keep answers brief and helpful.",
            },
          });

          if (response && response.text) {
            replyText = response.text;
            console.log(`Success with: ${model}`);
            break;
          }
        } catch (err) {
          console.warn(`Model ${model} failed: ${err.message}`);
        }
      }
    }

    // ৩. শেষ ব্যাকআপ
    if (!replyText) {
      try {
        const p = encodeURIComponent("Answer factually in sweet Bengali as a cat: " + message);
        const fb = await fetch(`https://text.pollinations.ai/${p}`);
        if (fb.ok) replyText = await fb.text();
      } catch (e) {}
    }

    if (!replyText) {
      replyText = "মিয়াওঁ! আমি তোমার প্রশ্নটি শুনতে পেয়েছি। একটু পর আবার চেষ্টা করো!";
    }

    replyText = replyText.replace(/[*#_~`喵]/g, "").trim();

    res.json({ reply: replyText });

  } catch (error) {
    console.error("Chat Server Error:", error);
    res.json({ reply: "মিয়াওঁ! একটু সমস্যা হয়েছে, আবার বলো তো!" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Cat Server running on port ${PORT}`);
});
