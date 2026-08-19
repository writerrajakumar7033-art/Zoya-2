import { motion } from "motion/react";
import { MoodType, MOOD_THEMES } from "../utils/theme";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface VisualizerProps {
  state: VisualizerState;
  mood?: MoodType;
}

export default function Visualizer({ state, mood = "default" }: VisualizerProps) {
  const currentTheme = MOOD_THEMES[mood] || MOOD_THEMES.default;

  const getRingAnimation = (index: number, reverse: boolean = false) => {
    const baseSpeed =
      state === "listening" ? 3 : state === "processing" ? 1.5 : state === "speaking" ? 2 : 14;
    return {
      rotate: reverse ? [-360, 0] : [0, 360],
      transition: { duration: baseSpeed + index * 2.5, repeat: Infinity, ease: "linear" },
    };
  };

  const getPulseAnimation = () => {
    if (state === "speaking") {
      return {
        scale: [1, 1.08, 0.96, 1.05, 1],
        opacity: [0.85, 1, 0.8, 1, 0.85],
        transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
      };
    }
    if (state === "listening") {
      return {
        scale: [1, 1.04, 1],
        opacity: [0.75, 1, 0.75],
        transition: { duration: 1, repeat: Infinity, ease: "easeInOut" },
      };
    }
    if (state === "processing") {
      return {
        scale: [0.96, 1.04, 0.96],
        opacity: [0.6, 0.95, 0.6],
        transition: { duration: 0.8, repeat: Infinity, ease: "linear" },
      };
    }
    return {
      scale: [1, 1.02, 1],
      opacity: [0.4, 0.65, 0.4],
      transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
    };
  };

  // Harmonize state with active mood theme
  const getVisualizerColors = () => {
    // If speaking, emphasize mood's core color strongly
    if (state === "speaking") {
      return {
        color: currentTheme.coreColor,
        glow: currentTheme.pulseGlow,
        border: currentTheme.borderColor,
      };
    }
    // If listening, vibrant responsive touch
    if (state === "listening") {
      return {
        color: currentTheme.coreColor,
        glow: currentTheme.pulseGlow,
        border: currentTheme.borderColor,
      };
    }
    // If processing, subtle bright pulse
    if (state === "processing") {
      return {
        color: "rgba(56, 189, 248, 1)",
        glow: "shadow-sky-400/80",
        border: "border-sky-400",
      };
    }
    // Idle state
    return {
      color: currentTheme.coreColor,
      glow: currentTheme.pulseGlow,
      border: currentTheme.borderColor,
    };
  };

  const activeColorSet = getVisualizerColors();

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Ambient Pulsing Glow behind rings */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[65%] h-[65%] rounded-full blur-[90px] ${activeColorSet.glow} transition-colors duration-700`}
        style={{ backgroundColor: activeColorSet.color, opacity: 0.18 }}
      />

      {/* Ring 1: Massive Outer Dashed */}
      <motion.div
        animate={getRingAnimation(4, false)}
        className={`absolute w-[100%] h-[100%] rounded-full border-[1px] border-dashed ${activeColorSet.border} opacity-20 transition-colors duration-700`}
      />

      {/* Ring 2: Segmented Thick Dotted Ring */}
      <motion.div
        animate={getRingAnimation(3, true)}
        className={`absolute w-[85%] h-[85%] rounded-full border-[2px] border-dotted ${activeColorSet.border} opacity-30 transition-colors duration-700`}
      />

      {/* Ring 3: Scanner Ring (Solid with gaps) */}
      <motion.div
        animate={getRingAnimation(2, false)}
        className={`absolute w-[70%] h-[70%] rounded-full border-[1px] ${activeColorSet.border} border-t-transparent border-b-transparent opacity-40 transition-colors duration-700`}
      />

      {/* Ring 4: Inner Dashed */}
      <motion.div
        animate={getRingAnimation(1, true)}
        className={`absolute w-[55%] h-[55%] rounded-full border-[2px] border-dashed ${activeColorSet.border} opacity-50 transition-colors duration-700`}
      />
      
      {/* Ring 5: Core HUD Ring */}
      <motion.div
        animate={getRingAnimation(0, false)}
        className={`absolute w-[40%] h-[40%] rounded-full border-[3px] border-dotted ${activeColorSet.border} opacity-70 transition-colors duration-700`}
      />

      {/* Core Circle with Dynamic Glow & Mood Theme */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[25%] h-[25%] min-w-[130px] min-h-[130px] max-w-[220px] max-h-[220px] rounded-full border-[1.5px] ${activeColorSet.border} bg-black/45 backdrop-blur-md flex flex-col items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.6)] transition-all duration-700`}
        style={{
          boxShadow: `0 0 45px ${activeColorSet.color}, inset 0 0 30px ${activeColorSet.color}`,
        }}
      >
        {/* Center Text */}
        <div 
          className="font-bold tracking-[0.3em] text-xl md:text-3xl lg:text-4xl text-white select-none transition-all duration-500"
          style={{ textShadow: `0 0 15px ${currentTheme.textGlow}, 0 0 30px ${currentTheme.textGlow}` }}
        >
          ZOYA
        </div>
        <div className="text-[10px] tracking-widest uppercase opacity-75 font-mono mt-1 text-white/70">
          {currentTheme.emoji} {currentTheme.label}
        </div>
      </motion.div>
    </div>
  );
}
