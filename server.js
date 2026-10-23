const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Cat backend running smoothly",
    hasApiKey: Boolean(apiKey)
  });
});

app.post(["/chat", "/api/chat"], async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: "মেসেজ খালি পাঠানো হয়েছে" });
    }

    console.log("ইউজারের প্রশ্ন:", message);

    let replyText = null;

    // কঠোর নির্দেশনা: কোনো মিথ্যা বা মনগড়া উত্তর দেওয়া যাবে না
    const strictSystemPrompt = 
      "You are a smart talking cat named Talking Cat. " +
      "CRITICAL RULE: You MUST provide 100% factually accurate, truthful real-world answers in Bengali. " +
      "Do NOT invent, hallucinate, or make up fake facts (e.g., National bird of Bangladesh is Doyel / Oriental Magpie-Robin). " +
      "Explain the exact correct factual answer in sweet Bengali, keeping a cute friendly cat tone with 1-2 meows or cat emojis. Keep it short and helpful.";

    // ১. Gemini API দিয়ে চেষ্টা (Temperature 0.2 রাখা হয়েছে যেন ভুল তথ্য না বানায়)
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
                parts: [{ text: strictSystemPrompt }]
              },
              generationConfig: {
                temperature: 0.2 // কম ক্রিয়েটিভিটি = বেশি নির্ভুল বাস্তব তথ্য
              }
            })
          });

          const data = await geminiRes.json();
          if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            replyText = data.candidates[0].content.parts[0].text;
            console.log("Gemini API success!");
            break;
          }
        } catch (err) {
          console.warn(`Gemini ${model} failed:`, err.message);
        }
      }
    }

    // ২. ব্যাকআপ ইঞ্জিন (OpenAI মডেল সহ নির্ভুল উত্তরের জন্য)
    if (!replyText) {
      console.log("Gemini ছাড়া ব্যাকআপ AI (OpenAI Model) ব্যবহার করা হচ্ছে...");
      try {
        const fullPrompt = `${strictSystemPrompt}\n\nUser Question: ${message}\nAnswer in accurate Bengali:`;
        const fallbackUrl = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai`;
        const fallbackRes = await fetch(fallbackUrl);
        if (fallbackRes.ok) {
          replyText = await fallbackRes.text();
          console.log("Backup AI success!");
        }
      } catch (fbErr) {
        console.error("Backup AI error:", fbErr.message);
      }
    }

    if (!replyText) {
      replyText = "মিয়াওঁ! প্রশ্নটির সঠিক তথ্য খুঁজতে পারছি না, আবার জিজ্ঞাসা করো!";
    }

    replyText = replyText.replace(/[*#_~`]/g, "").trim();

    res.json({ reply: replyText });

  } catch (error) {
    console.error("Chat Server Error:", error);
    res.json({
      reply: "মিয়াওঁ! একটু সমস্যা হয়েছে, আবার প্রশ্নটি করো তো!"
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Cat Server running on port ${PORT}`);
});
