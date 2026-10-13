export const fetchWithoutCache: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });
