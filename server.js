const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// বর্তমান চালু মডেলগুলোর সঠিক তালিকা
const MODELS_TO_TRY = [
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-pro'
];

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: 'Message is required' });
    }

    let reply = null;

    // বিড়ালের মিষ্টি চরিত্র ঠিক রাখার প্রম্পট
    const prompt = `তুমি একটি মিষ্টি ও বুদ্ধিমান পোষা বিড়াল (Talking Cat)। তোমার নাম AI Cat। 
তুমি বাংলায় খুব সুন্দর, প্রফুল্ল ও আদুরে সুরে ছোট বাক্যে উত্তর দাও। 
ব্যবহারকারীর কথা: "${userMessage}"`;

    for (const modelName of MODELS_TO_TRY) {
        try {
            console.log(`[AI Cat] Trying model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            reply = response.text();

            if (reply) {
                console.log(`[AI Cat] ✅ Success with: ${modelName}`);
                break; // সফল হলে লুপ শেষ
            }
        } catch (err) {
            console.warn(`[AI Cat] ⚠️ ${modelName} failed, trying next...`);
        }
    }

    if (reply) {
        return res.json({ reply: reply.trim() });
    } else {
        return res.json({ 
            reply: 'মিয়াওঁ! তোমার কথা আমি বুঝতে পেরেছি, কিন্তু আমার একটু অলসতা লাগছে! আর একবার বলো তো শুনি!' 
        });
    }
});

app.get('/', (req, res) => {
    res.send('AI Talking Cat Backend is Running Live!');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
