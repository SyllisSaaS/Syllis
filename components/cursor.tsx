"use client";

import { useEffect } from "react";

export function Cursor() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const fine = window.matchMedia("(pointer: fine)").matches;
      root.classList.toggle("fine-pointer", fine);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return null;
}
