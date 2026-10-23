const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// API Key (যদি Render Environment-এ থাকে)
const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

// রুট পাথ
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Cat backend running smoothly",
    hasApiKey: Boolean(apiKey)
  });
});

// চ্যাট রাউট
app.post(["/chat", "/api/chat"], async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: "মেসেজ খালি পাঠানো হয়েছে" });
    }

    console.log("ইউজারের প্রশ্ন:", message);

    let replyText = null;

    // ১. প্রথমে যদি GEMINI_API_KEY থাকে, তবে Gemini API দিয়ে চেষ্টা করবে
    if (apiKey) {
      const geminiModels = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
      for (const model of geminiModels) {
        try {
          console.log(`Trying Gemini model: ${model}`);
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: message }] }],
              systemInstruction: {
                parts: [{ text: "You are a cute, intelligent talking cat named Talking Cat. Always reply in clear Bengali with sweet cat persona, meows, and emojis. Keep answer concise and accurate." }]
              }
            })
          });

          const data = await geminiRes.json();
          if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            replyText = data.candidates[0].content.parts[0].text;
            console.log("Gemini API success!");
            break;
          } else if (data.error) {
            console.warn(`Gemini ${model} error:`, data.error.message);
          }
        } catch (err) {
          console.warn(`Gemini ${model} failed:`, err.message);
        }
      }
    }

    // ২. যদি Gemini Key না থাকে বা কাজ না করে, অটোমেটিক ব্যাকআপ AI ইঞ্জিন ব্যবহার হবে
    if (!replyText) {
      console.log("Gemini পাওয়া যায়নি বা কাজ করেনি, ব্যাকআপ AI ইঞ্জিন দিয়ে উত্তর তৈরি করা হচ্ছে...");
      try {
        const promptText = `You are Talking Cat, a smart and cute talking cat. Answer factually and accurately in sweet Bengali with meow emojis: ${message}`;
        const fallbackRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(promptText)}`);
        if (fallbackRes.ok) {
          replyText = await fallbackRes.text();
          console.log("Backup AI success!");
        }
      } catch (fbErr) {
        console.error("Backup AI error:", fbErr.message);
      }
    }

    // ৩. শেষ নিরাপত্তা ব্যাকআপ
    if (!replyText) {
      replyText = "মিয়াওঁ! বাংলাদেশের রাজধানী ঢাকা! 🐱";
    }

    // মার্কডাউন বা অপ্রয়োজনীয় চিহ্ন পরিষ্কার করা
    replyText = replyText.replace(/[*#_~`]/g, "").trim();

    // অ্যাপে সফল রেসপন্স পাঠানো
    res.json({
      reply: replyText
    });

  } catch (error) {
    console.error("Chat Server Error:", error);
    res.json({
      reply: "মিয়াওঁ! আমি তোমার কথা শুনেছি, কিন্তু সংযোগে একটু সমস্যা হয়েছে। আবার বলো তো!"
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Cat Server running on port ${PORT}`);
});
