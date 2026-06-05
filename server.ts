import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies
app.use(express.json());

// Initialize the GoogleGenAI client (using recommended modern SDK structure)
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

console.log("[DStoma Core] Booting Production-Ready Full-Stack Web App...");
if (!apiKey) {
  console.warn("[DStoma Warning] GEMINI_API_KEY environment variable is absent. AI Diagnostic will operate in robust simulation modes.");
}

/**
 * Endpoint for Real-time AI Dental Diagnostics and Telemetry
 * Securely calls Gemini on the server side to protect secrets.
 */
app.post("/api/ai/diagnostic", async (req, res) => {
  try {
    const { toothNumber, symptoms, language } = req.body;

    if (!toothNumber) {
      return res.status(400).json({ error: "Tooth index number is required." });
    }

    const requestedLang = language || 'uz';

    if (!apiKey) {
      // Robust offline-first smart simulated path when credentials are being prepared
      const simulatedData = getSimulatedDiagnosis(Number(toothNumber), symptoms || '', requestedLang);
      return res.json({
        ...simulatedData,
        isSimulation: true,
        toothNumber: Number(toothNumber)
      });
    }

    // Advanced prompt design for dental analytics
    const prompt = `Perform a professional, clinically accurate dental diagnostic evaluation for the specified tooth:
Tooth index number: #${toothNumber} (Mandibular active tooth node)
Patient reported symptoms or diagnostic logs: "${symptoms || 'None - routine scanner telemetry check'}"
Target language for all text strings: ${requestedLang === 'uz' ? 'Uzbek (uz)' : requestedLang === 'ru' ? 'Russian (ru)' : 'English (en)'}

Please analyze the symptoms, tooth location, pathic indicators, and generate a strict, clean clinical assessment.
All content text in the response must be written entirely in the requested language.

Return the JSON response adhering strictly to this schema:
{
  "enamelAbrasion": "Wear/Damage metric (e.g. '15% abrasion', 'Moderate attrition', 'Normal')",
  "healthFactor": "Condition score (e.g., 'Excellent (96%)', 'Fair (72%)', 'Critical (35%)')",
  "recommendedTreatment": "Individially suggested clinic treatment (e.g., 'Composite Plomba', 'Root Canal Therapy', 'Routine professional cleaning')",
  "diagnosticText": "Detailed explanatory diagnostic summary, pathophysiology notes and local dental care guidance",
  "actionPlan": ["Short actionable guidance item 1", "Short actionable guidance item 2", "Short actionable guidance item 3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["enamelAbrasion", "healthFactor", "recommendedTreatment", "diagnosticText", "actionPlan"],
          properties: {
            enamelAbrasion: { type: Type.STRING },
            healthFactor: { type: Type.STRING },
            recommendedTreatment: { type: Type.STRING },
            diagnosticText: { type: Type.STRING },
            actionPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            }
          }
        },
        systemInstruction: "You are an expert, highly precise robotic AI dental system operating in DStoma Digital Hub. You analyze selected human teeth numbers and deliver clear, medical-quality descriptions, estimations, and treatments. Speak as an objective virtual dental clinic scientist. Strictly structure everything in the language requested (Uzbek, Russian, or English)."
      }
    });

    if (response && response.text) {
      const parsedData = JSON.parse(response.text.trim());
      return res.json({
        ...parsedData,
        isSimulation: false,
        toothNumber: Number(toothNumber)
      });
    } else {
      throw new Error("No response text found from the AI model.");
    }

  } catch (error: any) {
    console.error("[DStoma AI API] Error processing AI evaluation:", error);
    // Graceful production fallback with clear diagnostics details back to client
    const fallbackData = getSimulatedDiagnosis(Number(req.body.toothNumber || 24), req.body.symptoms || '', req.body.language || 'uz');
    return res.json({
      ...fallbackData,
      isSimulation: true,
      errorDetails: error.message,
      toothNumber: Number(req.body.toothNumber || 24)
    });
  }
});

// Helper for offline diagnostics & prompt feedback
function getSimulatedDiagnosis(tooth: number, symptoms: string, lang: string) {
  const cleanSym = symptoms.trim().toLowerCase();
  
  if (lang === 'uz') {
    if (cleanSym.includes('og\'riq') || cleanSym.includes('ogriq') || cleanSym.includes('shish') || cleanSym.includes('pain')) {
      return {
        enamelAbrasion: "28% Yuqori yemirilish",
        healthFactor: "Kritik (42%)",
        recommendedTreatment: "Kanal muolajasi (Endodontiya)",
        diagnosticText: `Tish #${tooth} mandibular segmentida asab tolalari yallig'lanishi (pulpit) kuzatilmoqda. Bemor ko'rsatgan alomatlar: "${symptoms}". Zudlik bilan stomatolog ko'rigidan o'tib, chuqur ildiz kanallarini davolash tavsiya etiladi.`,
        actionPlan: [
          "Og'riq qoldiruvchi vositalarni shifokor nazoratida qo'llash",
          "Zudlik bilan DStoma shifokoriga navbat olish",
          "Issiq va sovuq oziq-ovqatlardan saqlanish"
        ]
      };
    }
    return {
      enamelAbrasion: "6% Minimal yemirilish",
      healthFactor: "Sog'lom (94%)",
      recommendedTreatment: "Muntazam profilaktika va Minerallash",
      diagnosticText: `Tish #${tooth} normal anatomik tuzilishga ega. Maxsus patologiyalar aniqlanmadi. Muammali alomatlar qayd etilmadi. Sog'lom emal mudofaasini saqlash uchun feylerli tish pastalardan muntazam foydalaning.`,
      actionPlan: [
        "Tongda va kechqurun tishlarni 2 daqiqa davomida yuvish",
        "Har 6 oyda DStoma klinikalarida ultratovushli tozalash",
        "Dental tish ipidan muntazam foydalanish"
      ]
    };
  } else if (lang === 'ru') {
    if (cleanSym.includes('бол') || cleanSym.includes('опух') || cleanSym.includes('острый') || cleanSym.includes('pain')) {
      return {
        enamelAbrasion: "28% Высокая абразия",
        healthFactor: "Критическое (42%)",
        recommendedTreatment: "Лечение корневых каналов (Эндодонтия)",
        diagnosticText: `В сегменте зуба #${tooth} наблюдаются признаки воспаления пульпы (пульпит). Описанные симптомы: "${symptoms}". Рекомендуется проведение рентген-диагностики зуба и терапевтическое эндодонтическое вмешательство.`,
        actionPlan: [
          "Применение противовоспалительных средств при острой боли",
          "Запись к дежурному стоматологу DStoma",
          "Исключение твердой и экстремально температурной пищи"
        ]
      };
    }
    return {
      enamelAbrasion: "6% Минимальный износ",
      healthFactor: "Отличное (94%)",
      recommendedTreatment: "Регулярная гигиена и реминерализация",
      diagnosticText: `Зуб #${tooth} находится в здоровом анатомическом состоянии. Выраженных клинических патологий не выявлено. Для сохранения эмали рекомендуется стандартная профилактика.`,
      actionPlan: [
        "Правильное очищение зубов щеткой средней жесткости",
        "Прохождение профгигиены каждые 6 месяцев",
        "Использование зубной нити после еды"
      ]
    };
  } else {
    // English default
    if (cleanSym.includes('pain') || cleanSym.includes('ache') || cleanSym.includes('hurt') || cleanSym.includes('swoll')) {
      return {
        enamelAbrasion: "28% High abrasion",
        healthFactor: "Critical (42%)",
        recommendedTreatment: "Root Canal Therapy (Endodontics)",
        diagnosticText: `Active symptoms "${symptoms}" indicate localized pulp inflammation or early deep lesion in Tooth #${tooth}. Timely professional therapy is strongly recommended.`,
        actionPlan: [
          "Temporary anti-inflammatory medicine under professional guide",
          "Schedule an urgent diagnostic check-in on the DStoma Map",
          "Avoid direct biting on hard surfaces and temperature extremes"
        ]
      };
    }
    return {
      enamelAbrasion: "6% Minor wearing",
      healthFactor: "Excellent (94%)",
      recommendedTreatment: "Preventative Fluoridation & Remineralization",
      diagnosticText: `Tooth #${tooth} exhibits standard healthy occlusion and clean enamel layers. Preventative care is recommended to stabilize and preserve surface mineral densities.`,
      actionPlan: [
        "Maintain thorough brushing morning and night",
        "Utilize interdental dental floss daily",
        "Schedule standard check-ups bi-annually"
      ]
    };
  }
}

// Boot Express Server integrated with Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DStoma Express Suite] Listening live at http://0.0.0.0:${PORT}`);
    console.log(`[DStoma Mode] running in ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
