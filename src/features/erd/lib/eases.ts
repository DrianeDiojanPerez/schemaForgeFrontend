/** The `--ease-out-expo` curve from the stylesheet, for motion. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** The same curve run backwards, so a leaving matches its arrival. */
export const EASE_IN_EXPO = [0.7, 0, 0.84, 0] as const;

/** A gentle curve for things that should slip away rather than snap. */
export const EASE_IN_OUT = [0.45, 0, 0.55, 1] as const;
