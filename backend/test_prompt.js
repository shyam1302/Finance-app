import fs from 'fs';
const apiKey = process.env.GEMINI_API_KEY;

const systemPrompt = "You are a specialized AI financial coach for the 'Personal Wealth OS' app. Keep answers under 100 words. Be highly pragmatic, encouraging, and expert in personal finance. STRICT INSTRUCTION: You must ONLY answer questions related to finance, wealth management, investing, taxes, and economics. If the user asks about anything else, politely decline and steer the conversation back to finance.";

async function run() {
  const userPrompt = `SYSTEM INSTRUCTION: ${systemPrompt}\n\nUSER MESSAGE: What is the 50/30/20 rule?`;
  console.log("sending prompt...");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 300 }
      })
    });
    const data = await response.json();
    fs.writeFileSync('myoutput8.json', JSON.stringify(data, null, 2), 'utf-8');
  } catch(e) {
    console.error(e);
  }
}
run();
