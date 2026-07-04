export function isValidMessage(text) {
  if (!text) return false;
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= 500;
}

export function parseAIResponse(data) {
  if (
    !data ||
    typeof data.reply !== "string" ||
    data.reply.trim().length === 0
  ) {
    return "No pude procesar la respuesta del personaje.";
  }
  return data.reply.trim();
}
