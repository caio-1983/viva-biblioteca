// All animation durations in milliseconds — single source of truth
export const timing = {
  bookAppearDelay:    180,   // dark pause before book enters
  holdCoverMs:        750,   // how long closed book is visible
  coverFlipDuration:  1290,  // duration of the full page sweep
  openBuffer:         180,   // settle time after flip completes
} as const;

// Derived phase start times (ms from app start)
export const phases = {
  appear:  timing.bookAppearDelay,
  flipping: timing.bookAppearDelay + timing.holdCoverMs,                               // 1000ms
  open:     timing.bookAppearDelay + timing.holdCoverMs + timing.coverFlipDuration + timing.openBuffer, // 2730ms
} as const;
