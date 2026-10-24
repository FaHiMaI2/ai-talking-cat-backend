require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS সেটআপ (যাতে ব্রাউজার/অ্যাপ থেকে রিকোয়েস্ট আটকে না যায়)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Render Environment Variable থেকে API Key সংগ্রহ
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ CRITICAL: GEMINI_API_KEY পাওয়া যায়নি! Render-এর Environment সেকশনে API Key সেট করুন।");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// আপনার ছবির মডেলগুলো সহ সম্পূর্ণ Fallback লিস্ট
const modelsToTry = [
    "gemini-3.8-flash",      // ১. আপনার স্ক্রিনশটের ১ম মডেল
    "gemini-2.5-flash",      // ২. আপনার স্ক্রিনশটের ২য় মডেল
    "gemini-flash-latest",   // ৩. আপনার স্ক্রিনশটের ৩য় মডেল
    "gemini-1.5-flash",      // ৪. নির্ভরযোগ্য ব্যাকআপ
    "gemini-1.5-pro",        // ৫. ব্যাকআপ প্রো
    "gemini-2.5-pro"         // ৬. সর্বশেষ শক্তিশালী ব্যাকআপ
];

// বিড়ালের জন্য স্পষ্ট ও সুন্দর বাংলা নির্দেশাবলী
const SYSTEM_INSTRUCTION = "তুমি একটি মিষ্টি, বুদ্ধিমান ও বন্ধুসুলভ কথা বলা পোষা বিড়াল। ব্যবহারকারী যে প্রশ্নই করুক না কেন, খাঁটি ও সহজ বাংলায় সংক্ষেপে ও আকর্ষণীয়ভাবে উত্তর দেবে। উত্তরের ভাব প্রকাশ করতে মিষ্টি করে দু-একটি 'মিয়াওঁ' শব্দ জুড়ে দিতে পারো। কোনো ফরম্যাটিং মার্কডাউন (যেমন: *, #, _) ব্যবহার করবে না।";

// টেস্ট রাউট (সার্ভার চেক করার জন্য)
app.get('/', (req, res) => {
    res.send("🐱 Talking Cat Server is Running smoothly!");
});

// মূল চ্যাট এন্ডপয়েন্ট
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: "কোনো মেসেজ পাঠানো হয়নি!" });
    }

    let replyText = null;
    let lastError = null;

    // মডেল চেইনিং লুপ (একটি জ্যামে থাকলে অন্যটি কাজ করবে)
    for (const modelName of modelsToTry) {
        try {
            console.log(`[AI Cat] Trying with model: ${modelName}...`);

            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: SYSTEM_INSTRUCTION
            });

            const result = await model.generateContent(userMessage);
            const response = await result.response;
            const text = response.text();

            if (text && text.trim().length > 0) {
                replyText = text.trim();
                console.log(`[AI Cat] ✅ Success with model: ${modelName}`);
                break; // সফলভাবে উত্তর পাওয়া গেলে লুপ সাথে সাথে বন্ধ হবে
            }
        } catch (err) {
            console.warn(`[AI Cat] ⚠️ Model ${modelName} failed. Error:`, err.message || err);
            lastError = err;
            // পরবর্তী মডেলে চলে যাবে
        }
    }

    // যেকোনো একটি মডেল সফল হলে
    if (replyText) {
        return res.json({ reply: replyText });
    }

    // সব মডেলই যদি ব্যর্থ হয়
    console.error("[AI Cat] ❌ All models failed. Last Error:", lastError);
    return res.status(500).json({
        reply: "মিয়াওঁ! আমার সব ভাবনা এলোমেলো হয়ে গেছে। একটু পর আবার প্রশ্ন করো!"
    });
});

app.listen(PORT, () => {
    console.log(`🐱 Cat Server running on port ${PORT}`);
});
