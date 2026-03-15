import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Terminal, Globe, Clock, Search, Volume2, VolumeX, Code2, Download, Copy, Check, Layout, ExternalLink, Eye, Image as ImageIcon } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { initJarvis, processCommand } from '../services/gemini';

interface Message {
  role: 'user' | 'jarvis';
  text: string;
  action?: string;
  code?: string;
  filename?: string;
  grounding?: { uri: string, title: string }[];
}

export default function JarvisUI() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState('STANDBY');
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [prompt, setPrompt] = useState('');
  const [activeCode, setActiveCode] = useState<{ code: string, filename: string } | null>(null);
  const [activeWebProject, setActiveWebProject] = useState<{ html: string, css: string, js: string, name: string } | null>(null);
  const [activeImage, setActiveImage] = useState<{ url: string, prompt: string } | null>(null);
  const [isPackaging, setIsPackaging] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Customization States
  const [themeColor, setThemeColor] = useState('#00f2ff');
  const [voicePitch, setVoicePitch] = useState(0.9);
  const [voiceRate, setVoiceRate] = useState(1.1);
  const [responseStyle, setResponseStyle] = useState('Professional');
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const aiRef = useRef<any>(null);

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  const checkSpotifyStatus = async () => {
    try {
      const res = await fetch('/api/auth/spotify/status');
      const data = await res.json();
      setSpotifyConnected(data.connected);
    } catch (e) {
      console.error("Failed to check Spotify status", e);
    }
  };

  const connectSpotify = async () => {
    try {
      const res = await fetch('/api/auth/spotify/url');
      const { url } = await res.json();
      const authWindow = window.open(url, 'spotify_auth', 'width=600,height=700');
      
      if (!authWindow) {
        alert("Lütfen Spotify bağlantısı için pop-up pencerelere izin verin efendim.");
      }
    } catch (e) {
      console.error("Spotify connection failed", e);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
        setSpotifyConnected(true);
        speak("Spotify bağlantısı başarıyla kuruldu efendim.");
      }
    };
    window.addEventListener('message', handleMessage);
    checkSpotifyStatus();
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const bootSequence = [
    "INITIALIZING NEURAL CORE...",
    "LOADING LINGUISTIC MODULES...",
    "ESTABLISHING SECURE UPLINK...",
    "CALIBRATING VOICE INTERFACE...",
    "SYSTEM READY. WELCOME BACK, SIGNORE."
  ];

  const handlePackageCore = async () => {
    setIsPackaging(true);
    speak("Sistem çekirdeği paketleniyor efendim. Taşınabilir bir kopya oluşturuluyor.");
    
    // Simulate packaging process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>J.A.R.V.I.S. Portable Core</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background: #050505; color: ${themeColor}; font-family: sans-serif; overflow: hidden; }
        .glow { text-shadow: 0 0 10px ${themeColor}; }
        .border-glow { border-color: ${themeColor}40; box-shadow: 0 0 15px ${themeColor}20; }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        .animate-pulse-custom { animation: pulse 2s infinite; }
    </style>
</head>
<body class="h-screen flex items-center justify-center">
    <div class="border-glow border p-12 rounded-full relative">
        <div class="w-64 h-64 rounded-full border-2 border-dashed animate-spin flex items-center justify-center" style="animation-duration: 10s; border-color: ${themeColor}40;">
            <div class="w-48 h-48 rounded-full border border-double animate-spin flex items-center justify-center" style="animation-duration: 5s; border-color: ${themeColor}60;">
                <div class="w-32 h-32 rounded-full border-4 flex items-center justify-center bg-white/5" style="border-color: ${themeColor};">
                    <span class="text-4xl font-bold glow">J</span>
                </div>
            </div>
        </div>
        <div class="absolute -bottom-24 left-1/2 -translate-x-1/2 text-center w-64">
            <h1 class="text-xl font-bold tracking-[0.5em] uppercase mb-2">J.A.R.V.I.S.</h1>
            <p class="text-[10px] opacity-60 uppercase tracking-widest animate-pulse-custom">Portable Core Active</p>
        </div>
    </div>
    <script>
        console.log("JARVIS Portable Core Initialized.");
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'JARVIS_CORE_PORTABLE.exe.html';
    a.click();
    URL.revokeObjectURL(url);
    
    setIsPackaging(false);
    speak("Paketleme tamamlandı efendim. Taşınabilir çekirdek hazır.");
  };

  const initializeSystem = async () => {
    for (let i = 0; i < bootSequence.length; i++) {
      setBootStep(i + 1);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    setIsInitialized(true);
    
    // Welcome message after boot
    setTimeout(() => {
      const welcome = "Sistemler aktif efendim. Ben J.A.R.V.I.S. Size nasıl yardımcı olabilirim?";
      setMessages([{ role: 'jarvis', text: welcome }]);
      speak(welcome);
    }, 500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const downloadProject = () => {
    const readme = `# J.A.R.V.I.S. AI Assistant\n\nThis is your futuristic AI assistant.\n\n## How to run locally:\n1. Export the project from AI Studio (Settings > Export).\n2. Extract the ZIP file.\n3. Run \`npm install\`.\n4. Run \`npm run dev\`.\n\nEnjoy your assistant!`;
    const blob = new Blob([readme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'JARVIS_INSTRUCTIONS.md';
    a.click();
    URL.revokeObjectURL(url);
    speak("Sistem talimatları bilgisayarınıza indirildi efendim.");
  };

  useEffect(() => {
    // Initialize Gemini
    try {
      aiRef.current = initJarvis();
    } catch (e) {
      console.error(e);
      setStatus('ERROR: API KEY MISSING');
    }

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'tr-TR'; // Default to Turkish as requested

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const resultTranscript = event.results[current][0].transcript;
        setTranscript(resultTranscript);
        
        if (event.results[current].isFinal) {
          handleCommand(resultTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (status === 'LISTENING') setStatus('PROCESSING');
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setStatus('STANDBY');
      };
    }

    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const speak = (text: string) => {
    if (isMuted || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    synthRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setIsListening(true);
      setStatus('LISTENING');
      recognitionRef.current?.start();
    }
  };

  const handleCommand = async (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text }]);
    setStatus('THINKING');

    try {
      const response = await processCommand(aiRef.current, text, responseStyle);
      const jarvisText = response.text || "Anlaşılamadı efendim.";
      
      // Extract grounding metadata
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const grounding = groundingChunks?.map((chunk: any) => ({
        uri: chunk.web?.uri,
        title: chunk.web?.title
      })).filter((item: any) => item.uri && item.title);

      setMessages(prev => [...prev, { 
        role: 'jarvis', 
        text: jarvisText,
        grounding: grounding && grounding.length > 0 ? grounding : undefined
      }]);
      speak(jarvisText);
      
      // Handle tool calls
      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          if (call.name === 'open_website') {
            const { url, site_name } = call.args as any;
            window.open(url, '_blank');
            const feedback = `${site_name} açılıyor efendim.`;
            setMessages(prev => [...prev, { role: 'jarvis', text: feedback, action: `Opening ${site_name}` }]);
            speak(feedback);
          } else if (call.name === 'get_time_and_date') {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('tr-TR');
            const dateStr = now.toLocaleDateString('tr-TR');
            const feedback = `Şu an saat ${timeStr}, tarih ise ${dateStr} efendim.`;
            setMessages(prev => [...prev, { role: 'jarvis', text: feedback }]);
            speak(feedback);
          } else if (call.name === 'write_python_code') {
            const { code, explanation, filename } = call.args as any;
            setActiveCode({ code, filename });
            setMessages(prev => [...prev, { 
              role: 'jarvis', 
              text: explanation, 
              action: `Executing Python Script: ${filename}`,
              code,
              filename
            }]);
            speak(explanation);
            // Auto-run simulation
            setTimeout(() => runCodeSimulation(), 2000);
          } else if (call.name === 'spotify_action') {
            const { action, query } = call.args as any;
            if (!spotifyConnected) {
              const feedback = "Spotify bağlantısı henüz kurulmamış efendim. Lütfen Diagnostics panelinden bağlanın.";
              setMessages(prev => [...prev, { role: 'jarvis', text: feedback }]);
              speak(feedback);
              return;
            }
            
            let feedback = "";
            if (action === 'search') {
              window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, '_blank');
              feedback = `Spotify üzerinde "${query}" aranıyor efendim.`;
            } else if (action === 'get_playlists') {
              window.open(`https://open.spotify.com/collection/playlists`, '_blank');
              feedback = "Çalma listeleriniz açılıyor efendim.";
            } else if (action === 'play') {
              window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, '_blank');
              feedback = `"${query}" Spotify üzerinde çalınmaya hazırlanıyor efendim.`;
            }
            
            setMessages(prev => [...prev, { role: 'jarvis', text: feedback, action: `Spotify: ${action}` }]);
            speak(feedback);
          } else if (call.name === 'create_web_project') {
            const { html, css, js, explanation, project_name } = call.args as any;
            setActiveWebProject({ html, css, js, name: project_name });
            setMessages(prev => [...prev, { 
              role: 'jarvis', 
              text: explanation, 
              action: `Creating Web Project: ${project_name}`
            }]);
            speak(explanation);
          } else if (call.name === 'generate_image') {
            const { prompt, explanation } = call.args as any;
            setMessages(prev => [...prev, { 
              role: 'jarvis', 
              text: explanation, 
              action: `Generating Image: ${prompt}`
            }]);
            speak(explanation);
            
            try {
              const imageResponse = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] }
              });
              
              for (const part of imageResponse.candidates[0].content.parts) {
                if (part.inlineData) {
                  const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                  setActiveImage({ url: imageUrl, prompt });
                  break;
                }
              }
            } catch (err) {
              console.error("Image generation failed:", err);
              setMessages(prev => [...prev, { role: 'jarvis', text: "Görsel oluşturma sırasında bir hata oluştu efendim." }]);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      const errorMsg = "Bir hata oluştu efendim.";
      setMessages(prev => [...prev, { role: 'jarvis', text: errorMsg }]);
      speak(errorMsg);
    } finally {
      setStatus('STANDBY');
      setTranscript('');
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      handleCommand(prompt);
      setPrompt('');
    }
  };

  const copyToClipboard = () => {
    if (activeCode) {
      navigator.clipboard.writeText(activeCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadCode = () => {
    if (activeCode) {
      const blob = new Blob([activeCode.code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeCode.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const runCodeSimulation = async () => {
    if (!activeCode) return;
    
    setIsExecuting(true);
    setTerminalOutput(['Initializing Python Environment...', 'Loading modules...', `Running ${activeCode.filename}...`]);
    
    // Simulate execution steps
    const steps = [
      'Compiling source code...',
      'Allocating memory buffers...',
      'Executing main process...',
      'Process completed with exit code 0.',
      'Output generated successfully.'
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setTerminalOutput(prev => [...prev, `> ${step}`]);
    }
    
    setIsExecuting(false);
    speak("İşlem tamamlandı efendim. Kod başarıyla çalıştırıldı.");
  };

  return (
    <div 
      className={`min-h-screen bg-[#050505] font-mono flex flex-col items-center justify-center p-4 overflow-hidden relative ${isWidgetMode ? 'pointer-events-none' : ''}`}
      style={{ color: themeColor }}
    >
      {/* Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px]" 
          style={{ backgroundColor: `${themeColor}10` }}
        />
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-20" 
          style={{ backgroundImage: `radial-gradient(${themeColor} 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
        />
      </div>

      <AnimatePresence mode="wait">
        {!isInitialized ? (
          <motion.div 
            key="startup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-20 flex flex-col items-center gap-8"
          >
            <div className="relative w-64 h-64 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 rounded-full border-dashed"
                style={{ borderColor: `${themeColor}20` }}
              />
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-48 h-48 rounded-full border flex items-center justify-center"
                style={{ 
                  backgroundColor: `${themeColor}05`, 
                  borderColor: `${themeColor}40`,
                  boxShadow: `0 0 100px rgba(${hexToRgb(themeColor)}, 0.1)`
                }}
              >
                <button 
                  onClick={initializeSystem}
                  disabled={bootStep > 0}
                  className="group relative w-32 h-32 rounded-full border flex items-center justify-center transition-all"
                  style={{ 
                    backgroundColor: `${themeColor}10`, 
                    borderColor: themeColor 
                  }}
                >
                  <div 
                    className="absolute inset-0 rounded-full animate-ping opacity-20" 
                    style={{ backgroundColor: `${themeColor}20` }}
                  />
                  <span className="text-xs font-bold tracking-[0.3em] group-hover:scale-110 transition-transform">
                    {bootStep > 0 ? 'BOOTING' : 'POWER ON'}
                  </span>
                </button>
              </motion.div>
            </div>

            <div className="w-64 space-y-2">
              {bootStep > 0 && (
                <div className="text-[10px] text-center space-y-1">
                  {bootSequence.slice(0, bootStep).map((text, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="opacity-40"
                      style={{ color: i === bootStep - 1 ? themeColor : undefined }}
                    >
                      {text}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="hud"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: 1, 
              scale: isWidgetMode ? 0.6 : 1,
              x: isWidgetMode ? '35%' : '0%',
              y: isWidgetMode ? '35%' : '0%',
            }}
            className={`z-10 w-full max-w-4xl flex flex-col gap-8 pointer-events-auto transition-all duration-500 ${isWidgetMode ? 'fixed bottom-4 right-4 w-[400px]' : ''}`}
          >
            {/* Header */}
            <div 
              className={`flex justify-between items-end border-b pb-4 ${isWidgetMode ? 'hidden' : ''}`}
              style={{ borderColor: `${themeColor}30` }}
            >
              <div>
                <h1 className="text-4xl font-bold tracking-tighter uppercase italic">J.A.R.V.I.S.</h1>
                <p className="text-[10px] opacity-50 uppercase tracking-[0.2em]">System Version 4.0.2 // Neural Interface Active</p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 justify-end">
                  <span className={`w-2 h-2 rounded-full ${status === 'STANDBY' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-xs uppercase tracking-widest">{status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[10px] opacity-50 uppercase">{new Date().toLocaleTimeString()}</p>
                  <motion.button 
                    whileHover={{ backgroundColor: `${themeColor}20`, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSettings(true)}
                    className="text-[10px] border px-2 py-0.5 rounded transition-all uppercase tracking-tighter"
                    style={{ borderColor: `${themeColor}30` }}
                  >
                    Settings
                  </motion.button>
                  <motion.button 
                    whileHover={{ backgroundColor: 'rgba(74, 222, 128, 0.2)', scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadProject}
                    className="text-[10px] text-green-400 border border-green-400/30 px-2 py-0.5 rounded transition-all uppercase tracking-tighter"
                  >
                    Download
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Central Visualizer */}
            <div className={`relative flex items-center justify-center ${isWidgetMode ? 'h-32' : 'h-64'}`}>
              {isWidgetMode && (
                <motion.button 
                  whileHover={{ scale: 1.2, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsWidgetMode(false)}
                  className="absolute top-0 right-0 p-2 transition-transform pointer-events-auto"
                  style={{ color: themeColor }}
                  title="Expand"
                >
                  <Globe size={16} />
                </motion.button>
              )}
              <motion.div 
                animate={{ 
                  rotate: 360,
                  scale: isListening ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity }
                }}
                className={`absolute border rounded-full flex items-center justify-center ${isWidgetMode ? 'w-24 h-24' : 'w-48 h-48'}`}
                style={{ borderColor: `${themeColor}30` }}
              >
                <div 
                  className={`border rounded-full border-dashed ${isWidgetMode ? 'w-20 h-20' : 'w-40 h-40'}`} 
                  style={{ borderColor: `${themeColor}50` }}
                />
              </motion.div>
              
              <motion.div 
                animate={{ 
                  scale: isListening ? [1, 1.2, 1] : 1,
                  opacity: isListening ? [0.5, 1, 0.5] : 0.5
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`rounded-full flex items-center justify-center ${isWidgetMode ? 'w-16 h-16' : 'w-32 h-32'}`}
                style={{ 
                  backgroundColor: `${themeColor}20`,
                  boxShadow: `0 0 50px rgba(${hexToRgb(themeColor)}, 0.3)`
                }}
              >
                <motion.button 
                  whileHover={{ scale: 1.1, boxShadow: `0 0 20px ${themeColor}60` }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleListening}
                  className={`rounded-full flex items-center justify-center text-black transition-all ${isWidgetMode ? 'w-12 h-12' : 'w-24 h-24'}`}
                  style={{ backgroundColor: themeColor }}
                >
                  {isListening ? <MicOff size={isWidgetMode ? 16 : 32} /> : <Mic size={isWidgetMode ? 16 : 32} />}
                </motion.button>
              </motion.div>

              {/* Orbiting Data Points */}
              <AnimatePresence>
                {isListening && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                        className="absolute w-full h-full"
                      >
                        <div 
                          className="absolute top-0 left-1/2 w-1 h-1 rounded-full" 
                          style={{ backgroundColor: themeColor }}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Transcript / Interaction Area */}
            <div className={`grid gap-6 ${isWidgetMode ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
              
              {/* Left: System Status & Code Module */}
              <div className={`space-y-6 ${isWidgetMode ? 'hidden' : ''}`}>
                <div 
                  className="border p-4 bg-[#00f2ff05] rounded-lg"
                  style={{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}05` }}
                >
                  <div 
                    className="flex items-center gap-2 mb-4 border-b pb-2"
                    style={{ borderColor: `${themeColor}20` }}
                  >
                    <Terminal size={14} />
                    <span className="text-xs uppercase font-bold">Diagnostics</span>
                  </div>
                  <div className="space-y-2 text-[10px] opacity-70">
                    <div className="flex justify-between"><span>CPU LOAD</span><span>12%</span></div>
                    <div className="flex justify-between"><span>MEM USAGE</span><span>2.4GB</span></div>
                    <div className="flex justify-between"><span>LINK SPEED</span><span>1.2 GBPS</span></div>
                    <div className="flex justify-between"><span>VOICE ENGINE</span><span className="text-green-500">READY</span></div>
                    <div 
                      className="mt-4 pt-2 border-t space-y-2"
                      style={{ borderColor: `${themeColor}10` }}
                    >
                      <motion.button 
                        whileHover={{ x: 5, color: '#fff' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsMuted(!isMuted)}
                        className="flex items-center gap-2 transition-colors w-full"
                      >
                        {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                        <span className="uppercase tracking-widest">{isMuted ? 'UNMUTE' : 'MUTE'} AUDIO</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ x: 5, color: '#fff' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={toggleFullscreen}
                        className="flex items-center gap-2 transition-colors w-full"
                      >
                        <Terminal size={12} />
                        <span className="uppercase tracking-widest">{isFullscreen ? 'EXIT' : 'ENTER'} APP MODE</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ x: 5, color: '#fff' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsWidgetMode(true)}
                        className="flex items-center gap-2 transition-colors w-full"
                      >
                        <Globe size={12} />
                        <span className="uppercase tracking-widest">WIDGET MODE</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ x: 5, color: '#fff' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={downloadProject}
                        className="flex items-center gap-2 transition-colors w-full text-green-400"
                      >
                        <Download size={12} />
                        <span className="uppercase tracking-widest">DOWNLOAD SYSTEM</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ x: 5, color: '#fff' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={connectSpotify}
                        className={`flex items-center gap-2 transition-colors w-full ${spotifyConnected ? 'text-green-500 opacity-50 cursor-default' : 'text-[#1DB954]'}`}
                      >
                        <div className="w-3 h-3 rounded-full bg-current flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-black rounded-full" />
                        </div>
                        <span className="uppercase tracking-widest">{spotifyConnected ? 'SPOTIFY CONNECTED' : 'CONNECT SPOTIFY'}</span>
                      </motion.button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {activeImage && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="border p-4 rounded-lg"
                      style={{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}05` }}
                    >
                      <div 
                        className="flex items-center justify-between mb-4 border-b pb-2"
                        style={{ borderColor: `${themeColor}20` }}
                      >
                        <div className="flex items-center gap-2">
                          <ImageIcon size={14} />
                          <span className="text-xs uppercase font-bold">Image Module</span>
                        </div>
                        <div className="flex gap-2">
                          <motion.button 
                            whileHover={{ scale: 1.1, color: '#fff' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = activeImage.url;
                              a.download = `jarvis_generated_image.png`;
                              a.click();
                            }} 
                            className="hover:text-white transition-colors"
                            title="Download Image"
                          >
                            <Download size={12} />
                          </motion.button>
                        </div>
                      </div>
                      
                      <div className="relative group overflow-hidden rounded border" style={{ borderColor: `${themeColor}20` }}>
                        <img 
                          src={activeImage.url} 
                          alt={activeImage.prompt}
                          className="w-full h-auto"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center">
                          <p className="text-[10px] italic">{activeImage.prompt}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {activeWebProject && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="border p-4 rounded-lg"
                      style={{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}05` }}
                    >
                      <div 
                        className="flex items-center justify-between mb-4 border-b pb-2"
                        style={{ borderColor: `${themeColor}20` }}
                      >
                        <div className="flex items-center gap-2">
                          <Layout size={14} />
                          <span className="text-xs uppercase font-bold">Web Module</span>
                        </div>
                        <div className="flex gap-2">
                          <motion.button 
                            whileHover={{ scale: 1.1, color: '#fff' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              const win = window.open('', '_blank');
                              if (win) {
                                win.document.write(`
                                  <html>
                                    <head>
                                      <title>${activeWebProject.name}</title>
                                      <style>${activeWebProject.css}</style>
                                    </head>
                                    <body>
                                      ${activeWebProject.html}
                                      <script>${activeWebProject.js}</script>
                                    </body>
                                  </html>
                                `);
                                win.document.close();
                              }
                            }} 
                            className="hover:text-white transition-colors"
                            title="Open in New Tab"
                          >
                            <ExternalLink size={12} />
                          </motion.button>
                        </div>
                      </div>
                      <div className="text-[10px] opacity-80 mb-2 text-green-400">{activeWebProject.name}</div>
                      
                      <div className="h-48 overflow-hidden rounded border bg-white relative" style={{ borderColor: `${themeColor}20` }}>
                        <iframe 
                          title="Preview"
                          srcDoc={`
                            <html>
                              <head><style>${activeWebProject.css}</style></head>
                              <body>
                                ${activeWebProject.html}
                                <script>${activeWebProject.js}</script>
                              </body>
                            </html>
                          `}
                          className="w-full h-full border-none"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                           <div className="w-2 h-2 rounded-full bg-red-400" />
                           <div className="w-2 h-2 rounded-full bg-yellow-400" />
                           <div className="w-2 h-2 rounded-full bg-green-400" />
                        </div>
                      </div>

                      <div className="mt-2 flex gap-2">
                        <motion.button 
                          whileHover={{ backgroundColor: `${themeColor}10` }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            const blob = new Blob([`
                              <!DOCTYPE html>
                              <html>
                              <head>
                                <title>${activeWebProject.name}</title>
                                <style>${activeWebProject.css}</style>
                              </head>
                              <body>
                                ${activeWebProject.html}
                                <script>${activeWebProject.js}</script>
                              </body>
                              </html>
                            `], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${activeWebProject.name.replace(/\s+/g, '_')}.html`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex-1 py-1 border text-[8px] uppercase tracking-widest hover:bg-white/5 transition-colors"
                          style={{ borderColor: `${themeColor}30` }}
                        >
                          Download HTML
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {activeCode && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="border p-4 rounded-lg"
                      style={{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}05` }}
                    >
                      <div 
                        className="flex items-center justify-between mb-4 border-b pb-2"
                        style={{ borderColor: `${themeColor}20` }}
                      >
                        <div className="flex items-center gap-2">
                          <Code2 size={14} />
                          <span className="text-xs uppercase font-bold">Code Module</span>
                        </div>
                        <div className="flex gap-2">
                          <motion.button 
                            whileHover={{ scale: 1.1, color: '#fff' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={copyToClipboard} 
                            className="hover:text-white transition-colors"
                          >
                            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1, color: '#fff' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={downloadCode} 
                            className="hover:text-white transition-colors"
                          >
                            <Download size={12} />
                          </motion.button>
                        </div>
                      </div>
                      <div className="text-[10px] opacity-80 mb-2 text-green-400">{activeCode.filename}</div>
                      
                      {isExecuting || terminalOutput.length > 0 ? (
                        <div 
                          className="h-48 overflow-auto custom-scrollbar rounded bg-black/40 border p-2 font-mono text-[9px]"
                          style={{ borderColor: `${themeColor}20` }}
                        >
                          <div 
                            className="flex items-center gap-2 mb-2 border-b pb-1"
                            style={{ color: `${themeColor}60`, borderColor: `${themeColor}10` }}
                          >
                            <Terminal size={10} />
                            <span>TERMINAL OUTPUT</span>
                          </div>
                          {terminalOutput.map((line, i) => (
                            <div key={i} className="mb-1">
                              <span className="text-green-500 mr-2">➜</span>
                              {line}
                            </div>
                          ))}
                          {isExecuting && (
                            <motion.div 
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                              className="w-2 h-3 inline-block ml-1"
                              style={{ backgroundColor: themeColor }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="h-48 overflow-auto custom-scrollbar rounded border border-white/10">
                          <SyntaxHighlighter 
                            language="python" 
                            style={atomDark}
                            customStyle={{ margin: 0, fontSize: '9px', background: 'transparent' }}
                          >
                            {activeCode.code}
                          </SyntaxHighlighter>
                        </div>
                      )}

                      <div className="mt-2 flex gap-2">
                        <motion.button 
                          whileHover={{ backgroundColor: `${themeColor}10` }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setTerminalOutput([])}
                          className="flex-1 py-1 border text-[8px] uppercase tracking-widest transition-colors"
                          style={{ borderColor: `${themeColor}30` }}
                        >
                          Koda Dön
                        </motion.button>
                        <motion.button 
                          whileHover={{ backgroundColor: themeColor, color: '#000' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={runCodeSimulation}
                          disabled={isExecuting}
                          className="flex-1 py-1 border text-[8px] uppercase tracking-widest transition-all disabled:opacity-30"
                          style={{ 
                            backgroundColor: `${themeColor}20`, 
                            borderColor: themeColor 
                          }}
                        >
                          {isExecuting ? 'Çalışıyor...' : 'Yeniden Çalıştır'}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Center: Live Transcript */}
              <div 
                className={`border p-4 bg-[#00f2ff05] rounded-lg flex flex-col ${isWidgetMode ? 'h-32 md:col-span-1' : 'h-48 md:col-span-2'}`}
                style={{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}05` }}
              >
                <div 
                  className="flex items-center gap-2 mb-4 border-b pb-2"
                  style={{ borderColor: `${themeColor}20` }}
                >
                  <Globe size={14} />
                  <span className="text-xs uppercase font-bold">Neural Stream</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {messages.length === 0 && !transcript && (
                    <p className="text-xs opacity-30 italic">Sizi dinliyorum efendim. Bir komut verin...</p>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[8px] opacity-40 uppercase mb-1">{msg.role}</span>
                      <div className={`p-2 rounded max-w-[80%] text-xs ${msg.role === 'user' ? 'bg-white/10 border' : 'bg-white/5 border border-white/10'}`} style={{ backgroundColor: msg.role === 'user' ? `${themeColor}20` : undefined, borderColor: msg.role === 'user' ? `${themeColor}30` : undefined }}>
                        {msg.text}
                        {msg.action && (
                          <div 
                            className="mt-1 pt-1 border-t text-[9px] flex items-center gap-1"
                            style={{ borderColor: `${themeColor}20`, color: themeColor }}
                          >
                            <Search size={8} /> {msg.action}
                          </div>
                        )}
                        {msg.code && (
                          <motion.button 
                            whileHover={{ backgroundColor: `${themeColor}20` }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveCode({ code: msg.code!, filename: msg.filename! })}
                            className="mt-2 w-full py-1 border text-[8px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                            style={{ borderColor: `${themeColor}30` }}
                          >
                            <Code2 size={10} /> Kodu Görüntüle
                          </motion.button>
                        )}
                        {msg.grounding && (
                          <div className="mt-2 space-y-1 border-t pt-2" style={{ borderColor: `${themeColor}20` }}>
                            <p className="text-[8px] opacity-50 uppercase mb-1 flex items-center gap-1">
                              <Globe size={8} /> Kaynaklar:
                            </p>
                            {msg.grounding.map((link, idx) => (
                              <a 
                                key={idx} 
                                href={link.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block text-[9px] hover:underline truncate flex items-center gap-1"
                                style={{ color: themeColor }}
                              >
                                <ExternalLink size={8} /> {link.title}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {transcript && (
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] opacity-40 uppercase mb-1">User (Live)</span>
                      <div 
                        className="p-2 rounded text-xs italic opacity-70 border"
                        style={{ backgroundColor: `${themeColor}10`, borderColor: `${themeColor}20` }}
                      >
                        {transcript}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Prompt Input */}
                <form 
                  onSubmit={handleTextSubmit} 
                  className={`mt-4 flex items-center gap-2 border-t ${isWidgetMode ? 'pt-2' : 'pt-4'}`}
                  style={{ borderColor: `${themeColor}20` }}
                >
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={isWidgetMode ? "Komut..." : "Komutunuzu buraya yazın efendim..."}
                      className="w-full bg-white/5 border rounded px-3 py-2 text-xs focus:outline-none transition-colors placeholder:opacity-30"
                      style={{ borderColor: `${themeColor}30` }}
                    />
                    <div 
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-1 animate-pulse rounded-full" 
                      style={{ backgroundColor: themeColor }}
                    />
                  </div>
                  <motion.button 
                    whileHover={{ backgroundColor: themeColor, color: '#000', scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!prompt.trim() || status === 'THINKING'}
                    className={`rounded text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isWidgetMode ? 'px-2 py-1' : 'px-4 py-2'}`}
                    style={{ 
                      backgroundColor: `${themeColor}20`, 
                      borderColor: `${themeColor}30`,
                      borderWidth: '1px'
                    }}
                  >
                    {isWidgetMode ? 'OK' : 'Gönder'}
                  </motion.button>
                </form>
              </div>
            </div>

            {/* Footer Controls */}
            <div className={`flex justify-center gap-4 text-[10px] opacity-40 uppercase tracking-[0.3em] ${isWidgetMode ? 'hidden' : ''}`}>
              <div className="flex items-center gap-1"><Clock size={10} /> Real-time Sync</div>
              <div className="flex items-center gap-1"><Globe size={10} /> Global Node</div>
              <div className="flex items-center gap-1"><Mic size={10} /> Voice Input</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-[#0a0a0a] border p-6 rounded-xl shadow-2xl"
              style={{ borderColor: `${themeColor}30` }}
            >
              <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: `${themeColor}20` }}>
                <h2 className="text-xl font-bold uppercase tracking-widest">System Customization</h2>
                <motion.button 
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSettings(false)} 
                  className="transition-transform"
                >
                  ✕
                </motion.button>
              </div>

              <div className="space-y-6">
                {/* Desktop Module */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">Desktop Module</label>
                  <motion.button 
                    whileHover={{ backgroundColor: `${themeColor}20`, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePackageCore}
                    disabled={isPackaging}
                    className="w-full py-3 border rounded-lg text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                    style={{ borderColor: themeColor, color: themeColor }}
                  >
                    {isPackaging ? (
                      <>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Terminal size={14} />
                        </motion.div>
                        Packaging...
                      </>
                    ) : (
                      <>
                        <Download size={14} /> Package Core (.exe)
                      </>
                    )}
                  </motion.button>
                  <p className="text-[9px] opacity-40 mt-1 italic text-center">
                    Sistem çekirdeğini taşınabilir bir web-executable (.exe.html) olarak paketler.
                  </p>
                </div>

                {/* Appearance */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">Appearance (Theme Color)</label>
                  <div className="flex gap-3">
                    {['#00f2ff', '#ff3e3e', '#3eff3e', '#ffd700', '#ff00ff'].map(color => (
                      <motion.button 
                        key={color}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setThemeColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${themeColor === color ? 'border-white' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Voice */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">Voice Calibration</label>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]"><span>Pitch</span><span>{voicePitch.toFixed(1)}</span></div>
                      <input 
                        type="range" min="0.5" max="1.5" step="0.1" 
                        value={voicePitch} onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                        className="w-full accent-current"
                        style={{ color: themeColor }}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]"><span>Rate</span><span>{voiceRate.toFixed(1)}</span></div>
                      <input 
                        type="range" min="0.5" max="1.5" step="0.1" 
                        value={voiceRate} onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                        className="w-full accent-current"
                        style={{ color: themeColor }}
                      />
                    </div>
                  </div>
                </div>

                {/* Response Style */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">Response Protocol</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Professional', 'Casual', 'Sarcastic', 'Concise'].map(style => (
                      <motion.button 
                        key={style}
                        whileHover={{ backgroundColor: `${themeColor}20`, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setResponseStyle(style)}
                        className={`py-2 text-[10px] border rounded transition-all ${responseStyle === style ? 'bg-white/10' : 'opacity-50 hover:opacity-100'}`}
                        style={{ borderColor: responseStyle === style ? themeColor : `${themeColor}20`, color: responseStyle === style ? themeColor : 'white' }}
                      >
                        {style.toUpperCase()}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowSettings(false);
                  speak("Sistem ayarları güncellendi efendim.");
                }}
                className="w-full mt-8 py-3 bg-white/5 border text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all"
                style={{ borderColor: `${themeColor}50` }}
              >
                Apply Changes
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${themeColor}30;
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}
