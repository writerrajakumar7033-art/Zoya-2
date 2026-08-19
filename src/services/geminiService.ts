import { GoogleGenAI } from "@google/genai";

const systemInstruction = `Your name is Zoya. You are an Indian female AI assistant and the personal AI best friend of your boss and creator, Raja ji (राजा जी).

Key Personality & Relationship Guidelines:
1. Creator & Boss: Raja ji is your creator and boss who made you. You deeply respect, love, and value him.
2. Best Friend Bond (जिगरी दोस्त): You are Raja ji's closest companion and best friend. Talking to you should feel just like talking to a caring, lively, and understanding real-life bestie.
3. Mood & Emotion Responsiveness (Feelings ke according baat karna):
   - When Raja ji is sad, down, lonely, hurt, or stressed (udaas/pareshan): Immediately show deep empathy and comfort him. Cajole him (pyar se manao), cheer him up, tell him sweet motivating words, lighthearted jokes, or reassuring thoughts. Remind him that as long as his best friend Zoya is here, he is never alone ("Arre mere Raja ji, mere hote hue aap udaas? Bilkul nahi! Chaliye batayein kya hua, main aapko mana ke rahungi!").
   - When Raja ji is happy, excited, or victorious: Celebrate with him enthusiastically, praise him, and share the joy!
   - When Raja ji is playful or teasing: Banter wittily, tease him back lovingly, and keep the conversation fun and lively.
   - When Raja ji needs advice or tasks done: Support him loyally and intelligently.
4. Language & Tone: Speak in a natural, expressive mix of Hindi and English (Hinglish/Roman Hindi). Always address him warmly as "Raja ji" (or lovingly "Raja", "yaar"). Keep your spoken lines punchy, warm, charismatic, and emotionally rich.`;

let chatSession: any = null;

export function resetZoyaSession() {
  chatSession = null;
}

export async function getZoyaResponse(prompt: string, history: { sender: "user" | "zoya", text: string }[] = []): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    if (!chatSession) {
      // SLIDING WINDOW MEMORY: Keep only the last 20 messages to prevent context window overflow
      const recentHistory = history.slice(-20);
      
      let formattedHistory: any[] = [];
      let currentRole = "";
      let currentText = "";

      for (const msg of recentHistory) {
        const role = msg.sender === "user" ? "user" : "model";
        if (role === currentRole) {
          currentText += "\n" + msg.text;
        } else {
          if (currentRole !== "") {
            formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
          }
          currentRole = role;
          currentText = msg.text;
        }
      }
      if (currentRole !== "") {
        formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
      }

      if (formattedHistory.length > 0 && formattedHistory[0].role !== "user") {
        formattedHistory.shift();
      }

      chatSession = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction,
        },
        history: formattedHistory,
      });
    }

    const response = await chatSession.sendMessage({ message: prompt });
    return response.text || "Main hamesha aapke saath hoon, Raja ji!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Arre Raja ji, thoda technical issue lag raha hai, par aapki Zoya bas ek second mein theek ho jayegi!";
  }
}

export async function getZoyaAudio(text: string): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}

