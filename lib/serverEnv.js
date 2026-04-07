export function getMissingServerEnv(keys) {
  return keys.filter((key) => !process.env[key]);
}
