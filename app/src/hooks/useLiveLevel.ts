import { useEffect, useState } from "react";
import { currentLevel } from "../lib/levels";

/** A React-friendly view of the audio level, refreshed ~20 times a second. */
export function useLiveLevel(source: "mic" | "voice") {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setLevel(currentLevel(source)), 50);
    return () => clearInterval(timer);
  }, [source]);
  return level;
}
