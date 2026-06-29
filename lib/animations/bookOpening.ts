import type { Variants } from "framer-motion";
import { easing } from "./easing";

export const bookAppearVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 22 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.7, ease: easing.bookOpen },
  },
};

export const goldLineVariants: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.75, ease: "easeOut", delay: 0.32 },
  },
};

export const coverTextVariants: Variants = {
  hidden: { opacity: 0, y: 9 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.52, ease: easing.reveal, delay: 0.38 + i * 0.13 },
  }),
};

export const staggerRevealVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 13 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.46, ease: easing.reveal },
  },
};
