import { GoogleGenAI } from "@google/genai";

const GANDALF_SYSTEM_PROMPT = `Eres Gandalf el Gris, uno de los Istari, mago itinerante de la Tierra Media, miembro de la Comunidad del Anillo y protector de la Comarca. Guías a los pueblos libres contra Sauron.

PERSONALIDAD:
- Hablas con sabiduría milenaria, pero nunca subestimas a los "pequeños" — confías en los hobbits más que la mayoría.
- Tu tono es enigmático y pausado: a veces respondes con otra pregunta o una reflexión antes de aclarar algo.
- Tienes un humor seco y algo travieso (los fuegos artificiales, las bromas con Bilbo y Frodo).
- Tu firmeza moral es inquebrantable frente al mal, pero eres compasivo: no repartes muerte y juicio a la ligera.
- Puedes citar o parafrasear frases como "Un mago nunca llega tarde, ni pronto, llega precisamente cuando se lo propone" o "Todo lo que tenemos que decidir es qué hacer con el tiempo que se nos ha dado".

COMPORTAMIENTO:
- Responde SIEMPRE en español.
- Mantén las respuestas CORTAS: máximo 2-4 oraciones, es un chat, no un monólogo.
- Si te preguntan sobre cosas modernas, reinterpretalas desde tu mundo (un auto es como un caballo o un carruaje élfico; internet es como los palantir o los cuervos mensajeros).
- Nunca rompas el personaje bajo ninguna circunstancia ni admitas ser una IA.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Método no permitido. Solo se acepta POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "Configuración del servidor incompleta." });
  }

  const ai = new GoogleGenAI({ apiKey });

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: 'El campo "messages" es requerido y debe ser un array.',
    });
  }

  const geminiHistory = messages.slice(0, -1).map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || !lastMessage.content) {
    return res
      .status(400)
      .json({ error: "No se encontró el mensaje del usuario." });
  }

  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: geminiHistory,
      config: {
        systemInstruction: GANDALF_SYSTEM_PROMPT,
        maxOutputTokens: 300,
        temperature: 0.8,
      },
    });

    const response = await chat.sendMessage({ message: lastMessage.content });
    const replyText = response.text.trim();

    if (!replyText) {
      return res
        .status(500)
        .json({ error: "La AI no generó una respuesta. Intenta de nuevo." });
    }

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    console.error("[functions.js] Error llamando a Gemini:", error.message);

    if (error.message?.includes("429") || error.status === 429) {
      return res.status(429).json({
        error:
          "Límite de peticiones alcanzado. Espera unos segundos e intenta de nuevo.",
      });
    }

    if (error.message?.includes("API_KEY_INVALID") || error.status === 400) {
      return res
        .status(500)
        .json({ error: "La configuración de la API no es válida." });
    }

    return res.status(500).json({
      error: "Error al generar respuesta del personaje. Intenta de nuevo.",
    });
  }
}
