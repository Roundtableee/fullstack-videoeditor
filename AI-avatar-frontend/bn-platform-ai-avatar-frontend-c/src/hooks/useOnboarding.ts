import { useEffect, useState } from "react";

const ONBOARDING_KEY = "has_seen_onboarding";

export function useOnboarding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeen) {
      setOpen(true);
    }
  }, []);

  const close = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  };

  return { open, close };
}
