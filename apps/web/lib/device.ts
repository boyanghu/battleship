const DEVICE_ID_KEY = "battleship:deviceId";

export function getOrCreateDeviceId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    (typeof crypto !== "undefined" && "randomUUID" in crypto && crypto.randomUUID()) ||
    `device_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

  window.localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}
