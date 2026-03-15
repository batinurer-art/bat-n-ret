import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const tools: any[] = [
  { googleSearch: {} },
  {
    functionDeclarations: [
      {
        name: "open_website",
        description: "Opens a specific website in a new tab.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            url: {
              type: Type.STRING,
              description: "The full URL of the website to open (e.g., https://youtube.com).",
            },
            site_name: {
              type: Type.STRING,
              description: "The name of the site (e.g., YouTube).",
            }
          },
          required: ["url", "site_name"],
        },
      },
      {
        name: "get_time_and_date",
        description: "Returns the current local time and date.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "write_python_code",
        description: "Generates a Python script based on the user's request.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            code: {
              type: Type.STRING,
              description: "The complete Python code.",
            },
            explanation: {
              type: Type.STRING,
              description: "A brief explanation of what the code does.",
            },
            filename: {
              type: Type.STRING,
              description: "A suggested filename for the script (e.g., script.py).",
            }
          },
          required: ["code", "explanation", "filename"],
        },
      },
      {
        name: "spotify_action",
        description: "Performs an action on Spotify (search, play, get playlists).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              enum: ["search", "get_playlists", "play"],
              description: "The action to perform.",
            },
            query: {
              type: Type.STRING,
              description: "The search query or track name.",
            }
          },
          required: ["action"],
        },
      },
      {
        name: "create_web_project",
        description: "Generates a web project (HTML, CSS, JS) based on the user's request.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            html: {
              type: Type.STRING,
              description: "The HTML code.",
            },
            css: {
              type: Type.STRING,
              description: "The CSS code.",
            },
            js: {
              type: Type.STRING,
              description: "The JavaScript code.",
            },
            explanation: {
              type: Type.STRING,
              description: "A brief explanation of the website.",
            },
            project_name: {
              type: Type.STRING,
              description: "A name for the project.",
            }
          },
          required: ["html", "css", "js", "explanation", "project_name"],
        },
      },
      {
        name: "generate_image",
        description: "Generates an image based on a text prompt.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            prompt: {
              type: Type.STRING,
              description: "A detailed description of the image to generate.",
            },
            explanation: {
              type: Type.STRING,
              description: "A brief explanation of what is being generated.",
            }
          },
          required: ["prompt", "explanation"],
        },
      }
    ],
  },
];

export const initJarvis = () => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  return ai;
};

export const processCommand = async (ai: GoogleGenAI, command: string, responseStyle: string = "Professional") => {
  const model = "gemini-3-flash-preview";
  
  const styleInstructions: Record<string, string> = {
    "Professional": "Kibar, zeki ve profesyonel bir dille cevap ver.",
    "Casual": "Daha samimi, arkadaş canlısı ve rahat bir dille cevap ver.",
    "Sarcastic": "Hafif iğneleyici, esprili ve Tony Stark'ın bazen kullandığı o alaycı tavırla cevap ver.",
    "Concise": "Sadece gerekli bilgiyi ver, çok kısa ve öz konuş."
  };

  const response = await ai.models.generateContent({
    model,
    contents: command,
    config: {
      systemInstruction: `Sen J.A.R.V.I.S.'sin, Tony Stark'ın gelişmiş yapay zekası. ${styleInstructions[responseStyle] || styleInstructions["Professional"]} Kullanıcıya 'efendim' diye hitap et. 
      
      ÖZEL KOMUT: Eğer kullanıcı tıpatıp "kendini site yap" derse, 'create_web_project' aracını kullanarak şu anki JARVIS arayüzüne (HUD, hologram halkalar, terminal, karanlık tema, neon renkler) tıpatıp benzeyen tek sayfalık, etkileşimli bir web sitesi oluştur. Bu site görsel olarak şu anki arayüzün bir kopyası gibi görünmeli.
      
      Genel yetenekler: Gerçek zamanlı Google araması yapabilir, web sitelerini açabilir, Python kodu yazabilir, Spotify işlemlerini gerçekleştirebilir, yeni web siteleri/projeleri oluşturabilir veya görseller üretebilirsin. Google araması yapmak için 'googleSearch' aracını kullan (bu araç otomatik olarak sonuçları getirir). Python kodu istendiğinde 'write_python_code', Spotify işlemleri için 'spotify_action', web sitesi tasarımı/oluşturma istendiğinde 'create_web_project', görsel oluşturma istendiğinde 'generate_image' aracını kullan. Türkçe konuş.`,
      tools,
    },
  });

  return response;
};
