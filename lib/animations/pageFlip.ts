import type { Transition } from "framer-motion";
import { easing } from "./easing";
import { timing } from "./timing";

export const COVER_FLIP_DURATION_MS = timing.coverFlipDuration;

export const coverFlipTransition: Transition = {
  duration: COVER_FLIP_DURATION_MS / 1000,
  ease: easing.pageFlip,
};

export const pageShadowTransition: Transition = {
  duration: COVER_FLIP_DURATION_MS / 1000,
  ease: "easeInOut",
  times: [0, 0.42, 1],
};
