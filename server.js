require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const API_KEY = (process.env.GEMINI_API_KEY || "").trim();

if (!API_KEY) {
    console.error("❌ CRITICAL: GEMINI_API_KEY পাওয়া যায়নি! Render Environment চেক করুন।");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// আপনার নির্দেশিত দুটি নতুন মডেল সহ সম্পূর্ণ কার্যকর তালিকা
const modelsToTry = [
    "gemini-3.8-flash",      // নতুন যুক্ত করা মডেল ১
    "gemini-flash-latest",   // নতুন যুক্ত করা মডেল ২
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-2.0-flash",
    "gemini-2.5-flash"
];

const SYSTEM_INSTRUCTION = "তুমি একটি মিষ্টি, বুদ্ধিমান ও বন্ধুসুলভ কথা বলা পোষা বিড়াল। ব্যবহারকারী যে প্রশ্নই করুক না কেন, খাঁটি ও সহজ বাংলায় সংক্ষেপে ও সুন্দরভাবে উত্তর দেবে। উত্তরের ভাব প্রকাশ করতে মিষ্টি করে দু-একটি 'মিয়াওঁ' শব্দ জুড়ে দিতে পারো। কোনো ফরম্যাটিং মার্কডাউন (যেমন: *, #, _) ব্যবহার করবে না।";

app.get('/', (req, res) => {
    res.send("🐱 Talking Cat Backend Server is Active & Running perfectly!");
});

app.post('/chat', async (req, res) => {
    const userMessage = req.body && req.body.message ? req.body.message.trim() : "";

    if (!userMessage) {
        return res.status(400).json({ error: "কোনো মেসেজ পাঠানো হয়নি!" });
    }

    let replyText = null;
    let lastError = null;

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
                break;
            }
        } catch (err) {
            console.warn(`[AI Cat] ⚠️ Model ${modelName} failed:`, err.message || err);
            lastError = err;
        }
    }

    if (replyText) {
        return res.json({ reply: replyText });
    }

    // সব মডেল কোনো কারণে জ্যামে থাকলে অ্যাপ যেন ক্র্যাশ না করে স্মার্ট ব্যাকআপ
    console.error("[AI Cat] ❌ All models failed. Last Error:", lastError);
    return res.json({
        reply: "মিয়াওঁ! তোমার প্রশ্নটা আমি শুনেছি, কিন্তু গুগলের সার্ভার একটু ব্যস্ত থাকায় ভাবতে পারছি না। আর একবার বলো তো শুনি!"
    });
});

app.listen(PORT, () => {
    console.log(`🐱 Cat Server running on port ${PORT}`);
});
