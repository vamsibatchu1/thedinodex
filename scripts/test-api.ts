import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key length:", apiKey?.length);

const ai = new GoogleGenAI({ apiKey });

async function test() {
    console.log("Starting test...");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents: "Say hello!"
        });
        console.log("Response:", response.text);
    } catch (e: any) {
        console.error("Test failed:", e.message);
    }
}
test();
