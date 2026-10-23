const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Talking Cat Backend Active",
    hasApiKey: Boolean(apiKey)
  });
});

app.post(["/chat", "/api/chat"], async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: "মেসেজ লিখুন" });
    }

    console.log("ইউজারের প্রশ্ন:", message);

    let replyText = null;

    // ১. Gemini API কল (সরাসরি প্রম্পট ইনজেকশন যাতে গুগলের কোনো ফরম্যাট এরর না হয়)
    if (apiKey) {
      const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
      
      const strictPrompt = 
        "নির্দেশনা: তুমি Talking Cat নামের একটি বুদ্ধিমান, মিষ্টি কথা বলা বিড়াল। " +
        "১০০% বাস্তব ও নির্ভুল সঠিক তথ্য দেবে। কোনো কাল্পনিক বা ভুল তথ্য দেবে না (যেমন: বাংলাদেশের জাতীয় পাখি দোয়েল, জাতীয় ফুল শাপলা, জাতীয় ফল কাঁঠাল, জাতীয় পশু বাঘ, রাজধানী ঢাকা ইত্যাদি)। " +
        "মিষ্টি বিড়ালের কণ্ঠে বাংলায় ১-২টি মিঁয়াও ইমোজি সহ সংক্ষেপে সঠিক উত্তর দাও।\n\n" +
        "ব্যবহারকারীর প্রশ্ন: " + message;

      for (const model of models) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: strictPrompt }]
                }
              ]
            })
          });

          const data = await geminiRes.json();
          if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            replyText = data.candidates[0].content.parts[0].text;
            console.log(`Gemini (${model}) সফলভাবে উত্তর দিয়েছে!`);
            break;
          } else {
            console.warn(`Gemini (${model}) Error:`, JSON.stringify(data.error || data));
          }
        } catch (err) {
          console.warn(`Gemini (${model}) Failed:`, err.message);
        }
      }
    }

    // ২. সাধারণ জ্ঞান অটো-প্রোটেকশন (যাতে কোনো অবস্থাতেই মৌলিক সাধারণ জ্ঞান ভুল না হয়)
    if (!replyText) {
      const q = message.toLowerCase();
      if (q.includes("জাতীয় পাখি") || q.includes("জাতীয় পাখি")) {
        replyText = "বাংলাদেশের জাতীয় পাখি হলো দোয়েল! 🐱🐾";
      } else if (q.includes("জাতীয় ফুল") || q.includes("জাতীয় ফুল")) {
        replyText = "বাংলাদেশের জাতীয় ফুল হলো সাদা শাপলা! 🐱🌸";
      } else if (q.includes("জাতীয় পশু") || q.includes("জাতীয় পশু")) {
        replyText = "বাংলাদেশের জাতীয় পশু হলো রয়েল বেঙ্গল টাইগার! 🐱🐯";
      } else if (q.includes("জাতীয় ফল") || q.includes("জাতীয় ফল")) {
        replyText = "বাংলাদেশের জাতীয় ফল হলো কাঁঠাল! 🐱🍈";
      } else if (q.includes("রাজধানী")) {
        replyText = "বাংলাদেশের রাজধানী হলো ঢাকা! 🐱🏛️";
      } else {
        // সাধারণ প্রশ্নের জন্য ব্যাকআপ
        try {
          const p = encodeURIComponent("Answer factually in brief Bengali as a cute cat: " + message);
          const fb = await fetch(`https://text.pollinations.ai/${p}`);
          if (fb.ok) replyText = await fb.text();
        } catch (e) {}
      }
    }

    if (!replyText) {
      replyText = "মিয়াওঁ! আমি তোমার প্রশ্নটি শুনতে পেয়েছি। একটু পর আবার চেষ্টা করো!";
    }

    // অপ্রয়োজনীয় চিহ্ন পরিষ্কার করা
    replyText = replyText.replace(/[*#_~`喵]/g, "").trim();

    res.json({ reply: replyText });

  } catch (error) {
    console.error("Chat Error:", error);
    res.json({ reply: "মিয়াওঁ! একটু সমস্যা হয়েছে, আবার বলো তো!" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Cat Server running on port ${PORT}`);
});
