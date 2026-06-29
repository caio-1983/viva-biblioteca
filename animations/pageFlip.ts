import type { Transition } from "framer-motion";

export const pageFlipTransition: Transition = {
  duration: 1.5,
  ease: [0.645, 0.045, 0.355, 1.0],
  delay: 0.2,
};

export const PAGE_FLIP_DURATION_MS =
  (pageFlipTransition.delay as number) * 1000 +
  (pageFlipTransition.duration as number) * 1000;
