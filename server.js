const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Render-এ যে নামেই API Key দেওয়া থাকুক না কেন, তা স্বয়ংক্রিয়ভাবে ধরে নেবে
const apiKey = (
  process.env.GEMINI_API_KEY || 
  process.env.API_KEY || 
  process.env.GEMINI_KEY || 
  ""
).trim();

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

    // ১. সাধারণ জ্ঞান অটো-প্রোটেকশন (যেকোনো বাংলা বানানে ১০০% সঠিক উত্তর দেবে)
    const normalized = message.normalize("NFC");

    if (/পাখি|bird/i.test(normalized)) {
      replyText = "বাংলাদেশের জাতীয় পাখি হলো দোয়েল! 🐱🐾";
    } else if (/ফুল|flower/i.test(normalized)) {
      replyText = "বাংলাদেশের জাতীয় ফুল হলো সাদা শাপলা! 🐱🌸";
    } else if (/ফল|fruit/i.test(normalized)) {
      replyText = "বাংলাদেশের জাতীয় ফল হলো কাঁঠাল! 🐱🍈";
    } else if (/পশু|প্রাণী|বাঘ|tiger/i.test(normalized)) {
      replyText = "বাংলাদেশের জাতীয় পশু হলো রয়েল বেঙ্গল টাইগার! 🐱🐯";
    } else if (/মাছ|fish|ইলিশ/i.test(normalized)) {
      replyText = "বাংলাদেশের জাতীয় মাছ হলো ইলিশ! 🐱🐟";
    } else if (/রাজধানী|capital/i.test(normalized)) {
      replyText = "বাংলাদেশের রাজধানী হলো ঢাকা! 🐱🏛️";
    } else if (/কবি|poet/i.test(normalized)) {
      replyText = "বাংলাদেশের জাতীয় কবি হলেন কাজী নজরুল ইসলাম! 🐱📜";
    }

    // ২. যদি উপরের সাধারণ জ্ঞান ছাড়া অন্য কোনো প্রশ্ন হয়, তবে Gemini দিয়ে উত্তর খুঁজবে
    if (!replyText && apiKey) {
      const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
      
      const strictPrompt = 
        "নির্দেশনা: তুমি Talking Cat নামের একটি বুদ্ধিমান বিড়াল। " +
        "১০০% বাস্তব ও নির্ভুল সঠিক তথ্য দেবে। মিষ্টি বিড়ালের কণ্ঠে বাংলায় ১-২টি মিঁয়াও ইমোজি সহ সংক্ষেপে সঠিক উত্তর দাও।\n\n" +
        "প্রশ্ন: " + message;

      for (const model of models) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: strictPrompt }] }]
            })
          });

          const data = await geminiRes.json();
          if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            replyText = data.candidates[0].content.parts[0].text;
            break;
          }
        } catch (err) {}
      }
    }

    // ৩. বিকল্প ব্যাকআপ
    if (!replyText) {
      try {
        const p = encodeURIComponent("Answer in sweet, factual Bengali as a cat: " + message);
        const fb = await fetch(`https://text.pollinations.ai/${p}`);
        if (fb.ok) replyText = await fb.text();
      } catch (e) {}
    }

    if (!replyText) {
      replyText = "মিয়াওঁ! আমি তোমার প্রশ্নটি শুনতে পেয়েছি। আরেকবার বলবে কি?";
    }

    // অপ্রয়োজনীয় চিহ্ন ও চাইনিজ অক্ষর বাদ দেওয়া
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
