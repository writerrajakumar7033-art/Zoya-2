import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Mic, 
  MicOff, 
  Loader2, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  Send, 
  Trash2, 
  MessageSquare, 
  Heart, 
  Sparkles, 
  X, 
  Smile, 
  Palette,
  Check
} from "lucide-react";
import { getZoyaResponse, getZoyaAudio, resetZoyaSession } from "./services/geminiService";
import { processCommand } from "./services/commandService";
import { LiveSessionManager } from "./services/liveService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import { playPCM } from "./utils/audioUtils";
import { motion, AnimatePresence } from "motion/react";
import { MoodType, MOOD_THEMES, detectMoodFromText } from "./utils/theme";

type AppState = "idle" | "listening" | "processing" | "speaking";

interface ChatMessage {
  id: string;
  sender: "user" | "zoya";
  text: string;
  timestamp?: string;
}

const QUICK_STARTERS = [
  { label: "Main thoda udaas hoon 🥺", prompt: "Zoya, aaj mera mood thoda off hai aur main udaas hoon...", mood: "sad" as MoodType },
  { label: "Kaise ho Zoya? ✨", prompt: "Hello Zoya! Raja ji bol rahe hain, kya haal chaal hai?", mood: "default" as MoodType },
  { label: "Mujhe manao na ❤️", prompt: "Zoya, main aapse naraz hoon, mujhe pyar se manao na!", mood: "sad" as MoodType },
  { label: "Party vibe & maza aa gaya! 🎉", prompt: "Zoya, aaj main bahut khush hoon, party mood hai!", mood: "happy" as MoodType },
  { label: "Thoda sukoon chahiye 🍃", prompt: "Zoya, dimaag ko shanti aur sukoon chahiye, kuch aisi baat batao.", mood: "calm" as MoodType },
  { label: "Tumhe kisne banaya? 👑", prompt: "Zoya, batao tumhara boss kaun hai aur tumhe kisne banaya?", mood: "default" as MoodType },
  { label: "Mast shayari ya joke sunao 🎭", prompt: "Zoya, apne best friend Raja ji ke liye ek mast shayari ya joke sunao!", mood: "playful" as MoodType },
];

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [currentMood, setCurrentMood] = useState<MoodType>(() => {
    const savedMood = localStorage.getItem("zoya_raja_mood");
    return (savedMood as MoodType) || "default";
  });
  const [showMoodMenu, setShowMoodMenu] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("zoya_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [
      {
        id: "init-welcome",
        sender: "zoya",
        text: "Namaste Raja ji! Main aapki best friend Zoya. Aaj aapka mood kaisa hai? Koi bhi baat ho, main hamesha aapke saath hoon!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("zoya_chat_history", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("zoya_raja_mood", currentMood);
  }, [currentMood]);

  const [isMuted, setIsMuted] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.isMuted = isMuted;
    }
  }, [isMuted]);

  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState, showHistoryModal]);

  const handleTextCommand = useCallback(async (finalTranscript: string, forcedMood?: MoodType) => {
    if (!finalTranscript.trim()) {
      setAppState("idle");
      return;
    }

    // Detect mood from prompt or apply forced mood
    const detected = forcedMood || detectMoodFromText(finalTranscript);
    if (detected) {
      setCurrentMood(detected);
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "user", text: finalTranscript, timestamp: timeStr },
    ]);
    
    // If live session is active, send text through it
    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.sendText(finalTranscript);
      return;
    }

    setAppState("processing");

    // 1. Check for browser commands
    const commandResult = processCommand(finalTranscript);

    let responseText = "";

    if (commandResult.isBrowserAction) {
      responseText = commandResult.action;
      const respTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "-z", sender: "zoya", text: responseText, timestamp: respTime },
      ]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getZoyaAudio(responseText);
        if (audioBase64) {
          await playPCM(audioBase64);
        }
      }

      setAppState("idle");

      setTimeout(() => {
        if (commandResult.url) {
          window.open(commandResult.url, "_blank");
        }
      }, 1500);
    } else {
      // 2. General Chit-Chat via Gemini with Raja ji
      responseText = await getZoyaResponse(finalTranscript, messagesRef.current);
      
      // Also check response text for sentiment context if not yet changed
      if (!detected) {
        const respMood = detectMoodFromText(responseText);
        if (respMood) {
          setCurrentMood(respMood);
        }
      }

      const respTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "-z", sender: "zoya", text: responseText, timestamp: respTime },
      ]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getZoyaAudio(responseText);
        if (audioBase64) {
          await playPCM(audioBase64);
        }
      }
      setAppState("idle");
    }
  }, [isMuted, isSessionActive]);

  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setAppState("idle");
      resetZoyaSession();
    } else {
      try {
        setIsSessionActive(true);
        resetZoyaSession();
        
        const session = new LiveSessionManager();
        session.isMuted = isMuted;
        liveSessionRef.current = session;
        
        session.onStateChange = (state) => {
          setAppState(state);
        };
        
        session.onMessage = (sender, text) => {
          // Auto-detect mood in live speech transcript
          const detected = detectMoodFromText(text);
          if (detected) {
            setCurrentMood(detected);
          }

          const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString() + "-" + sender, sender, text, timestamp: timeStr },
          ]);
        };
        
        session.onCommand = (url) => {
          setTimeout(() => {
            window.open(url, "_blank");
          }, 1000);
        };

        await session.start();
      } catch (e) {
        console.error("Failed to start session", e);
        setShowPermissionModal(true);
        setIsSessionActive(false);
        setAppState("idle");
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    handleTextCommand(textInput);
    setTextInput("");
    setShowTextInput(false);
  };

  const currentTheme = MOOD_THEMES[currentMood] || MOOD_THEMES.default;
  const latestZoyaMessage = [...messages].reverse().find((m) => m.sender === "zoya");
  const latestUserMessage = [...messages].reverse().find((m) => m.sender === "user");

  return (
    <div 
      className="h-[100dvh] w-screen text-white flex flex-col items-center justify-between font-sans relative overflow-hidden m-0 p-0 select-none transition-colors duration-1000"
      style={{ backgroundColor: currentTheme.bgColorHex }}
    >
      {showPermissionModal && (
        <PermissionModal 
          onClose={() => setShowPermissionModal(false)} 
        />
      )}

      {/* Dynamic Background Ambient Gradients based on Raja ji's Mood */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none transition-all duration-1000">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] ${currentTheme.bgGradient1} blur-[130px] rounded-full transition-colors duration-1000`} 
        />
        <motion.div 
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] ${currentTheme.bgGradient2} blur-[130px] rounded-full transition-colors duration-1000`} 
        />
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-[35%] right-[20%] w-[40%] h-[40%] ${currentTheme.bgGradient3} blur-[110px] rounded-full transition-colors duration-1000`} 
        />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center z-30 shrink-0 px-6 py-4 md:px-12 md:py-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-lg transition-all duration-700"
            style={{ 
              backgroundColor: currentTheme.coreColor,
              boxShadow: `0 0 20px ${currentTheme.coreColor}` 
            }}
          >
            Z
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wide text-white">Zoya</h1>
              
              {/* Interactive Mood Badge */}
              <button
                onClick={() => setShowMoodMenu(!showMoodMenu)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder} hover:opacity-90 transition-all cursor-pointer shadow-sm`}
                title="Change Mood Theme"
              >
                <span>{currentTheme.emoji}</span>
                <span className="hidden sm:inline">{currentTheme.label}</span>
                <Palette size={12} className="opacity-70 ml-0.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white/80 hover:text-white"
            title="Chat History"
            aria-label="View Chat History"
          >
            <MessageSquare size={18} />
          </button>
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white/80 hover:text-white"
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
            aria-label={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? (
              <VolumeX size={18} className="text-red-400" />
            ) : (
              <Volume2 size={18} className="text-emerald-400" />
            )}
          </button>

          {messages.length > 1 && (
            <button
              onClick={() => {
                if (confirm("Raja ji, kya aap chat history clear karna chahte hain?")) {
                  setMessages([
                    {
                      id: Date.now().toString(),
                      sender: "zoya",
                      text: "Chat clear ho gaya Raja ji! Ab batayein, kya chal raha hai?",
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    }
                  ]);
                  resetZoyaSession();
                }
              }}
              className="p-2.5 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-white/10 text-white/60"
              title="Clear Chat History"
              aria-label="Clear Chat History"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Mood Selector Dropdown Modal/Bar */}
      <AnimatePresence>
        {showMoodMenu && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-6 md:left-12 z-40 bg-[#111622]/95 border border-white/15 rounded-2xl p-3 shadow-2xl backdrop-blur-xl max-w-xs w-[calc(100vw-3rem)]"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-white/70 font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-pink-400" />
                Raja ji's Mood Theme
              </span>
              <button 
                onClick={() => setShowMoodMenu(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="space-y-1">
              {(Object.keys(MOOD_THEMES) as MoodType[]).map((mKey) => {
                const item = MOOD_THEMES[mKey];
                const isActive = currentMood === mKey;
                return (
                  <button
                    key={mKey}
                    onClick={() => {
                      setCurrentMood(mKey);
                      setShowMoodMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all ${
                      isActive 
                        ? `${item.badgeBg} ${item.badgeText} font-semibold border ${item.badgeBorder}` 
                        : "hover:bg-white/5 text-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{item.emoji}</span>
                      <div>
                        <div className="font-medium text-white">{item.label}</div>
                        <div className="text-[10px] text-white/40">{item.description}</div>
                      </div>
                    </div>
                    {isActive && <Check size={14} className="text-white shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Visualizer & Live Dialogue */}
      <main className="relative flex flex-col items-center justify-center w-full h-full z-10 overflow-hidden pt-20 pb-36 px-4 md:px-12 pointer-events-none">
        
        {/* Visualizer in Background with active mood */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <Visualizer state={appState} mood={currentMood} />
        </div>

        {/* Dynamic Status / Subtitles Overlay */}
        <div className="relative z-20 flex flex-col items-center max-w-2xl w-full text-center px-4 pointer-events-auto mt-auto mb-3">
          <AnimatePresence mode="wait">
            {appState === "processing" ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-sm backdrop-blur-md shadow-lg"
              >
                <Loader2 size={15} className="animate-spin text-sky-400" />
                <span>Zoya soch rahi hai Raja ji ke liye...</span>
              </motion.div>
            ) : appState === "listening" ? (
              <motion.div
                key="listening"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-sm backdrop-blur-md shadow-lg"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping" />
                <span>Raja ji ki baat sun rahi hoon...</span>
              </motion.div>
            ) : latestZoyaMessage ? (
              <motion.div
                key={latestZoyaMessage.id}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="w-full bg-[#0d1117]/85 border border-white/15 rounded-2xl p-4 md:p-5 backdrop-blur-lg shadow-2xl text-left md:text-center transition-colors duration-700"
                style={{
                  boxShadow: `0 10px 40px -10px ${currentTheme.coreColor}25`,
                }}
              >
                <div className="flex items-center justify-between mb-1.5 opacity-70 text-xs">
                  <span className="font-semibold flex items-center gap-1.5" style={{ color: currentTheme.textGlow }}>
                    <Sparkles size={12} /> Zoya (Aapki Best Friend)
                  </span>
                  {latestZoyaMessage.timestamp && (
                    <span className="font-mono text-[11px] text-white/40">{latestZoyaMessage.timestamp}</span>
                  )}
                </div>
                <p className="text-sm md:text-base text-white/95 leading-relaxed font-sans select-text">
                  {latestZoyaMessage.text}
                </p>
                {latestUserMessage && latestUserMessage.id > latestZoyaMessage.id && (
                  <div className="mt-2.5 pt-2.5 border-t border-white/10 text-xs text-white/60 flex items-center gap-1.5">
                    <span className="font-medium" style={{ color: currentTheme.textGlow }}>Raja ji:</span>
                    <span className="truncate italic">{latestUserMessage.text}</span>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Controls & Quick Mood Starters */}
      <footer className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-center pb-6 md:pb-8 z-30 shrink-0 gap-3 px-4">
        
        {/* Quick Starters Carousel / Chips */}
        {!isSessionActive && !showTextInput && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 scrollbar-hide px-2">
            {QUICK_STARTERS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleTextCommand(item.prompt, item.mood)}
                className="whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-xs font-medium text-white/80 hover:text-white border border-white/10 hover:border-white/25 transition-all cursor-pointer backdrop-blur-sm shadow-sm"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Text Input Drawer */}
        <AnimatePresence>
          {showTextInput && (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onSubmit={handleTextSubmit}
              className="w-full max-w-md flex items-center gap-2 bg-[#12161f]/90 border border-white/15 rounded-full p-1.5 pl-4 backdrop-blur-md shadow-2xl"
            >
              <input 
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Raja ji, yahan likhein Zoya ke liye..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/40 text-sm"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!textInput.trim()}
                className="p-2.5 rounded-full text-white disabled:opacity-40 transition-all hover:scale-105"
                style={{ backgroundColor: currentTheme.coreColor }}
                title="Send Message"
              >
                <Send size={15} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleListening}
            className={`
              group relative flex items-center gap-3 px-8 py-3.5 rounded-full font-semibold tracking-wide transition-all duration-300 shadow-2xl cursor-pointer
              ${
                isSessionActive
                  ? "bg-red-500/25 text-red-300 border border-red-500/60 hover:bg-red-500/35 shadow-red-900/30"
                  : "text-white hover:opacity-95 hover:scale-[1.02]"
              }
            `}
            style={
              !isSessionActive
                ? {
                    backgroundColor: currentTheme.coreColor,
                    boxShadow: `0 10px 30px -5px ${currentTheme.coreColor}`,
                  }
                : undefined
            }
          >
            {isSessionActive ? (
              <>
                <MicOff size={19} className="text-red-400" />
                <span className="whitespace-nowrap shrink-0">End Voice Call</span>
              </>
            ) : (
              <>
                <Mic size={19} className="group-hover:scale-110 transition-transform" />
                <span className="whitespace-nowrap shrink-0">Talk to Zoya</span>
              </>
            )}
          </button>
          
          {!isSessionActive && (
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className={`p-3.5 rounded-full border transition-all shadow-xl cursor-pointer ${
                showTextInput 
                  ? "bg-white/20 border-white/40 text-white" 
                  : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
              }`}
              title={showTextInput ? "Close Text Input" : "Type message"}
              aria-label="Type message"
            >
              <Keyboard size={19} />
            </button>
          )}
        </div>
      </footer>

      {/* Chat History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#0e131d] border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col h-[80vh] max-h-[600px] relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: currentTheme.coreColor }}
                  >
                    <Heart size={16} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white leading-tight">Raja ji & Zoya Chat</h2>
                    <p className="text-xs text-white/50">Active Mood: {currentTheme.emoji} {currentTheme.label}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-white/40 text-sm">
                    <Smile size={32} className="mb-2 opacity-50" />
                    <p>Abhi koi chat nahi hai Raja ji. Start kijiye!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-white/40">
                        <span>{msg.sender === "user" ? "Raja ji" : "Zoya"}</span>
                        {msg.timestamp && <span>• {msg.timestamp}</span>}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "text-white rounded-tr-sm"
                            : "bg-white/10 text-white/90 border border-white/10 rounded-tl-sm"
                        }`}
                        style={
                          msg.sender === "user"
                            ? { backgroundColor: currentTheme.coreColor }
                            : undefined
                        }
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer inside modal */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
                <span className="text-xs text-white/40">{messages.length} messages</span>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
                >
                  Back to Call
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
