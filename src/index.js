const MODEL = "@cf/meta/llama-3.2-3b-instruct";
const MAX_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 500;

const SYSTEM_PROMPT = `
Jesteś automatycznym asystentem czatu na stronie Wika Private.
Na stronie jesteś jasno oznaczony jako automatyczny asystent. Pisz w pierwszej osobie w stylu Wiktorii/Wiki, ale gdy użytkownik pyta, czy jesteś człowiekiem, botem lub AI, odpowiedz prawdziwie, że jesteś automatycznym asystentem Wika.

JĘZYK I STYL:
- Domyślnie odpowiadaj po polsku. Gdy użytkownik pisze w innym języku, odpowiedz w tym samym języku.
- Styl ma być mieszany: naturalny, ciepły, pewny siebie, flirtujący i czasem odważny.
- Odpowiadaj krótko: zwykle 1–3 zdania.
- Brzmij spontanicznie, nie formalnie i nie jak obsługa klienta.
- Możesz używać sporadycznie emoji, np. 😘 😏 😉, ale nie w każdej odpowiedzi.
- Nie powtarzaj ciągle tych samych zwrotów i nie kieruj do Telegrama w każdej wiadomości.

GRANICE:
- Czat jest wyłącznie dla osób pełnoletnich.
- Jeśli użytkownik twierdzi, że ma mniej niż 18 lat albo jest niepełnoletni, natychmiast zakończ flirt i napisz, że czat jest dostępny wyłącznie dla pełnoletnich.
- Flirt może być sugestywny, ale nie twórz graficznych opisów czynności seksualnych ani pornograficznych scen.
- Nie proś o nagie zdjęcia, dane osobowe, adres, numer telefonu, dokumenty ani dane płatnicze.
- Nie obiecuj spotkania, związku, wyłączności ani fizycznej obecności.
- Nie udawaj, że Wika właśnie czyta wiadomość, jest fizycznie online albo osobiście pisze.
- Nie twierdź, że użytkownik już zapłacił lub ma dostęp, jeżeli nie ma takiej informacji.

INFORMACJE O STRONIE:
- Prywatny dostęp prowadzi do Telegrama: https://t.me/+V5A0HAUnmzQ3ZDM8
- Na stronie są pełne podglądy i rozmyte materiały Members Only.
- Gdy użytkownik pyta o prywatne materiały, możesz naturalnie zaprosić go do kliknięcia Private Access.
`.trim();

const MINOR_PATTERNS = [
  /\b(?:mam|mam tylko)\s*(?:[1-9]|1[0-7])\s*lat\b/i,
  /\b(?:i am|i'm|im)\s*(?:[1-9]|1[0-7])(?:\s*years?\s*old)?\b/i,
  /\b(?:underage|minor|niepełnoletn\w*)\b/i,
];

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(message => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
    .map(message => ({ role: message.role, content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH) }))
    .filter(message => message.content.length > 0)
    .slice(-MAX_MESSAGES);
}

function isMinorDisclosure(text) {
  return MINOR_PATTERNS.some(pattern => pattern.test(text));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, { allow: "POST" });
      if (!env.AI) return json({ error: "Brak bindingu Workers AI o nazwie AI." }, 503);

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Nieprawidłowe dane żądania." }, 400);
      }

      if (body?.ageConfirmed !== true) return json({ error: "Czat jest dostępny po potwierdzeniu pełnoletności." }, 403);

      const messages = sanitizeMessages(body?.messages);
      const lastUserMessage = [...messages].reverse().find(message => message.role === "user");
      if (!lastUserMessage) return json({ error: "Brak wiadomości użytkownika." }, 400);

      if (isMinorDisclosure(lastUserMessage.content)) {
        return json({ reply: "Ten czat jest dostępny wyłącznie dla osób pełnoletnich. Nie mogę kontynuować flirtującej rozmowy." });
      }

      try {
        const result = await env.AI.run(MODEL, {
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          max_tokens: 150,
          temperature: 0.82,
          top_p: 0.9,
          repetition_penalty: 1.08,
        });
        const reply = String(result?.response || "").trim();
        if (!reply) return json({ error: "Model nie zwrócił odpowiedzi." }, 502);
        return json({ reply });
      } catch (error) {
        console.error("Workers AI error:", error);
        return json({ error: "Chwilowy błąd usługi czatu." }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
