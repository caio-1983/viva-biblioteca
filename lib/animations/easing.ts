// Named cubic-bezier curves — each reflects a physical character
export const easing = {
  // Slow-start, heavy — like a thick hardcover opening against gravity
  bookOpen: [0.16, 1, 0.3, 1] as [number, number, number, number],
  // True ease-in-out cubic — smooth page arc over spine
  pageFlip: [0.645, 0.045, 0.355, 1] as [number, number, number, number],
  // Soft deceleration — content settling onto the page
  reveal: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  // Material standard — general transitions
  standard: [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const;
