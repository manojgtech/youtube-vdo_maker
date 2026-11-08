import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadPlayfairDisplay } from "@remotion/google-fonts/PlayfairDisplay";

/**
 * Google Fonts are fetched and awaited by Remotion before the first frame.
 * Loading all of them is cheap and keeps theme switching instant.
 */
const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const playfair = loadPlayfairDisplay("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const bebas = loadBebasNeue("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const caveat = loadCaveat("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

const mono = loadJetBrainsMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

export const FONT_FAMILY = {
  inter: inter.fontFamily,
  playfair: playfair.fontFamily,
  bebas: bebas.fontFamily,
  caveat: caveat.fontFamily,
  mono: mono.fontFamily,
} as const;
