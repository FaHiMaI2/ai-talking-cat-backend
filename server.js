require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS পলিসি সেটআপ (যাতে ফ্রন্টএন্ড বা অ্যাপ থেকে কোনো রিকোয়েস্ট ব্লক না হয়)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Render-এর Environment Variable থেকে Gemini API Key গ্রহণ
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ CRITICAL: GEMINI_API_KEY পাওয়া যায়নি! Render ড্যাশবোর্ডে API Key যুক্ত করুন।");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// আপনার ছবির নিয়ম অনুযায়ী সাজানো মডেলের ফলব্যাক (Fallback) তালিকা
const modelsToTry = [
    "gemini-1.5-flash",        // সবচেয়ে দ্রুত ও ১০০% নির্ভরযোগ্য
    "gemini-2.5-flash",        // আধুনিক ফ্ল্যাশ মডেল
    "gemini-3.8-flash",        // লেটেস্ট ওয়ার্কহর্স মডেল
    "gemini-1.5-pro",          // ডিপ রিজনিং ব্যাকআপ
    "gemini-2.5-pro"           // প্রো ব্যাকআপ
];

// বিড়ালের মিষ্টি আচরণ ও সহজ বাংলা উত্তর দেওয়ার নির্দেশাবলী
const SYSTEM_INSTRUCTION = "তুমি একটি মিষ্টি, বুদ্ধিমান ও বন্ধুসুলভ কথা বলা পোষা বিড়াল। ব্যবহারকারী যে প্রশ্নই করুক না কেন, খাঁটি ও সহজ বাংলায় সংক্ষেপে ও সুন্দরভাবে উত্তর দেবে। উত্তরের ভাব প্রকাশ করতে মিষ্টি করে দু-একটি 'মিয়াওঁ' শব্দ জুড়ে দিতে পারো। কোনো ফরম্যাটিং মার্কডাউন (যেমন: *, #, _) ব্যবহার করবে না।";

// সার্ভার রানিং আছে কি না পরীক্ষা করার রুট
app.get('/', (req, res) => {
    res.send("🐱 Talking Cat Backend Server is Active & Running perfectly!");
});

// মূল চ্যাট এন্ডপয়েন্ট
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: "কোনো মেসেজ পাঠানো হয়নি!" });
    }

    let replyText = null;
    let lastError = null;

    // মডেল লুপ (একটি মডেল জ্যামে থাকলে স্বয়ংক্রিয়ভাবে পরের মডেলে যাবে)
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
                break; // সফলভাবে উত্তর পেলে লুপ সাথে সাথে বন্ধ হবে
            }
        } catch (err) {
            console.warn(`[AI Cat] ⚠️ Model ${modelName} failed. Error:`, err.message || err);
            lastError = err;
            // পরবর্তী মডেলে চলে যাবে
        }
    }

    // যেকোনো একটি মডেল দিয়ে উত্তর সফল হলে
    if (replyText) {
        return res.json({ reply: replyText });
    }

    // সবগুলো মডেলই যদি কোনো কারণে ব্যর্থ হয়
    console.error("[AI Cat] ❌ All Gemini models failed:", lastError);
    return res.status(500).json({
        reply: "মিয়াওঁ! সার্ভারে একটু সমস্যা হয়েছে, আবার প্রশ্নটি করো!"
    });
});

app.listen(PORT, () => {
    console.log(`🐱 Cat Server running on port ${PORT}`);
});
