export type MoodType = "default" | "sad" | "happy" | "calm" | "playful" | "angry";

export interface MoodTheme {
  id: MoodType;
  label: string;
  emoji: string;
  description: string;
  // Background Ambient Gradients (Tailwind & CSS colors)
  bgGradient1: string; // Top light
  bgGradient2: string; // Bottom light
  bgGradient3: string; // Center light
  bgColorHex: string; // Main background tint
  // Visualizer Colors
  coreColor: string;
  pulseGlow: string;
  borderColor: string;
  textGlow: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const MOOD_THEMES: Record<MoodType, MoodTheme> = {
  default: {
    id: "default",
    label: "Zoya Connected",
    emoji: "⚡",
    description: "Futuristic Violet & Cyan",
    bgGradient1: "bg-violet-900/25",
    bgGradient2: "bg-pink-900/20",
    bgGradient3: "bg-cyan-900/15",
    bgColorHex: "#050505",
    coreColor: "rgba(139, 92, 246, 1)",
    pulseGlow: "shadow-violet-500/60",
    borderColor: "border-violet-400",
    textGlow: "rgba(167, 139, 250, 0.9)",
    badgeBg: "bg-violet-500/15",
    badgeText: "text-violet-300",
    badgeBorder: "border-violet-500/30",
  },
  sad: {
    id: "sad",
    label: "Comfort & Warmth",
    emoji: "🧡",
    description: "Soothing Amber & Golden Peach for comfort",
    bgGradient1: "bg-amber-900/40",
    bgGradient2: "bg-rose-950/45",
    bgGradient3: "bg-orange-900/25",
    bgColorHex: "#0c0806",
    coreColor: "rgba(245, 158, 11, 1)",
    pulseGlow: "shadow-amber-500/80",
    borderColor: "border-amber-400",
    textGlow: "rgba(251, 191, 36, 0.95)",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/30",
  },
  happy: {
    id: "happy",
    label: "Joy & Energy",
    emoji: "🎉",
    description: "Vibrant Magenta & Radiant Sun",
    bgGradient1: "bg-fuchsia-900/35",
    bgGradient2: "bg-amber-600/30",
    bgGradient3: "bg-pink-900/30",
    bgColorHex: "#0a040b",
    coreColor: "rgba(236, 72, 153, 1)",
    pulseGlow: "shadow-pink-500/90",
    borderColor: "border-pink-400",
    textGlow: "rgba(244, 114, 182, 0.95)",
    badgeBg: "bg-pink-500/20",
    badgeText: "text-pink-300",
    badgeBorder: "border-pink-500/40",
  },
  calm: {
    id: "calm",
    label: "Peace & Sukoon",
    emoji: "🍃",
    description: "Serene Emerald & Ocean Teal",
    bgGradient1: "bg-teal-950/45",
    bgGradient2: "bg-emerald-950/40",
    bgGradient3: "bg-cyan-950/30",
    bgColorHex: "#020c0a",
    coreColor: "rgba(20, 184, 166, 1)",
    pulseGlow: "shadow-teal-500/70",
    borderColor: "border-teal-400",
    textGlow: "rgba(45, 212, 191, 0.95)",
    badgeBg: "bg-teal-500/15",
    badgeText: "text-teal-300",
    badgeBorder: "border-teal-500/30",
  },
  playful: {
    id: "playful",
    label: "Playful & Loving",
    emoji: "💖",
    description: "Sweet Rose & Lavender Shimmer",
    bgGradient1: "bg-rose-900/40",
    bgGradient2: "bg-purple-900/35",
    bgGradient3: "bg-pink-950/35",
    bgColorHex: "#0c0408",
    coreColor: "rgba(244, 63, 94, 1)",
    pulseGlow: "shadow-rose-500/80",
    borderColor: "border-rose-400",
    textGlow: "rgba(251, 113, 133, 0.95)",
    badgeBg: "bg-rose-500/20",
    badgeText: "text-rose-300",
    badgeBorder: "border-rose-500/35",
  },
  angry: {
    id: "angry",
    label: "Cooling & Relaxing",
    emoji: "🧘‍♂️",
    description: "Gentle Crimson fading to Calming Indigo",
    bgGradient1: "bg-red-950/40",
    bgGradient2: "bg-indigo-950/45",
    bgGradient3: "bg-rose-950/30",
    bgColorHex: "#0b0406",
    coreColor: "rgba(239, 68, 68, 1)",
    pulseGlow: "shadow-red-500/75",
    borderColor: "border-rose-400",
    textGlow: "rgba(248, 113, 113, 0.95)",
    badgeBg: "bg-red-500/15",
    badgeText: "text-red-300",
    badgeBorder: "border-red-500/30",
  },
};

/**
 * Detects Raja ji's mood based on keywords in his message or voice command
 */
export function detectMoodFromText(text: string): MoodType | null {
  const lower = text.toLowerCase().trim();

  // Sad / Upset / Needs comforting
  if (
    lower.includes("udaas") ||
    lower.includes("udas") ||
    lower.includes("sad") ||
    lower.includes("mood off") ||
    lower.includes("dukhi") ||
    lower.includes("heartbroken") ||
    lower.includes("rona") ||
    lower.includes("depress") ||
    lower.includes("low feel") ||
    lower.includes("alone") ||
    lower.includes("tanhai") ||
    lower.includes("bura lag raha") ||
    lower.includes("pareshan") ||
    lower.includes("tension") ||
    lower.includes("naraz") ||
    lower.includes("manao") ||
    lower.includes("cry") ||
    lower.includes("unhappy") ||
    lower.includes("dil toot") ||
    lower.includes("afsos")
  ) {
    return "sad";
  }

  // Happy / Energetic / Celebrating
  if (
    lower.includes("khush") ||
    lower.includes("happy") ||
    lower.includes("party") ||
    lower.includes("excited") ||
    lower.includes("maza aa gaya") ||
    lower.includes("dance") ||
    lower.includes("banger") ||
    lower.includes("jeet") ||
    lower.includes("celebrate") ||
    lower.includes("superb") ||
    lower.includes("awesome") ||
    lower.includes("josh") ||
    lower.includes("energetic") ||
    lower.includes("congratulat") ||
    lower.includes("badhai") ||
    lower.includes("badhiya") ||
    lower.includes("bahut accha") ||
    lower.includes("yay")
  ) {
    return "happy";
  }

  // Calm / Sukoon / Relax / Tired
  if (
    lower.includes("sukoon") ||
    lower.includes("peace") ||
    lower.includes("shanti") ||
    lower.includes("calm") ||
    lower.includes("relax") ||
    lower.includes("chill") ||
    lower.includes("neend") ||
    lower.includes("aram") ||
    lower.includes("thak gaya") ||
    lower.includes("soothing") ||
    lower.includes("meditat") ||
    lower.includes("halka")
  ) {
    return "calm";
  }

  // Playful / Loving / Romantic
  if (
    lower.includes("love") ||
    lower.includes("pyar") ||
    lower.includes("pyaar") ||
    lower.includes("romantic") ||
    lower.includes("nakhre") ||
    lower.includes("cute") ||
    lower.includes("flirt") ||
    lower.includes("mohabbat") ||
    lower.includes("sweetie") ||
    lower.includes("shona") ||
    lower.includes("tareef") ||
    lower.includes("khoobsurat") ||
    lower.includes("khubsurat")
  ) {
    return "playful";
  }

  // Angry / Irritated / Stressed
  if (
    lower.includes("gussa") ||
    lower.includes("angry") ||
    lower.includes("irritat") ||
    lower.includes("frustrat") ||
    lower.includes("dimaag kharab") ||
    lower.includes("chidh") ||
    lower.includes("bakwas")
  ) {
    return "angry";
  }

  return null;
}
