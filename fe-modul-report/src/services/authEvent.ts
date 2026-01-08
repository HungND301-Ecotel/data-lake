let onUnauthorized: (() => void) | null = null;

export const setOnUnauthorized = (fn: () => void) => {
  onUnauthorized = fn;
};

export const triggerUnauthorized = () => {
  onUnauthorized?.();
};
