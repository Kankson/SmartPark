"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

export function MotionProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      return;
    }

    const cleanups: Array<() => void> = [];
    const ctx = gsap.context(() => {
      const pageItems = gsap.utils.toArray<HTMLElement>("[data-motion='page']");
      if (pageItems.length) {
        gsap.fromTo(
          pageItems,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out" },
        );
      }

      const staggerItems = gsap.utils.toArray<HTMLElement>("[data-motion='stagger'] > *");
      if (staggerItems.length) {
        gsap.fromTo(
          staggerItems,
          { autoAlpha: 0, y: 18, scale: 0.985 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: "power3.out",
            stagger: 0.055,
            delay: 0.08,
          },
        );
      }

      const metricItems = gsap.utils.toArray<HTMLElement>("[data-motion='metric']");
      if (metricItems.length) {
        gsap.fromTo(
          metricItems,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.42, ease: "power2.out", stagger: 0.045, delay: 0.12 },
        );
      }

      const pulseItems = gsap.utils.toArray<HTMLElement>("[data-motion='pulse']");
      if (pulseItems.length) {
        gsap.to(pulseItems, {
          scale: 1.025,
          duration: 1.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      const liftItems = gsap.utils.toArray<HTMLElement>("[data-lift]");
      liftItems.forEach((item) => {
        const enter = () => gsap.to(item, { y: -4, duration: 0.22, ease: "power2.out" });
        const leave = () => gsap.to(item, { y: 0, duration: 0.22, ease: "power2.out" });
        item.addEventListener("pointerenter", enter);
        item.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          item.removeEventListener("pointerenter", enter);
          item.removeEventListener("pointerleave", leave);
        });
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      ctx.revert();
    };
  }, [pathname]);

  return null;
}
