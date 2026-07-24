(() => {
  const STORAGE_KEY = "wika-chat-history-v1";
  const MAX_STORED_MESSAGES = 16;
  const launcher = document.getElementById("chatLauncher");
  const panel = document.getElementById("chatPanel");
  const closeButton = document.getElementById("chatClose");
  const unread = document.getElementById("chatUnread");
  const messagesElement = document.getElementById("chatMessages");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const sendButton = document.getElementById("chatSend");
  const quick = document.getElementById("chatQuick");
  const clearButton = document.getElementById("chatClear");

  const initialMessage = {
    role: "assistant",
    content: "Hej 😘 Miło, że tu jesteś. Co najbardziej przyciągnęło Cię na moją stronę?",
    timestamp: Date.now(),
  };

  let history = loadHistory();
  let sending = false;

  function loadHistory() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored) && stored.length) {
        return stored.filter(item => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string").slice(-MAX_STORED_MESSAGES);
      }
    } catch (_) {}
    return [initialMessage];
  }

  function saveHistory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_STORED_MESSAGES)));
  }

  function formatTime(timestamp) {
    return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp || Date.now()));
  }

  function createMessageNode(message) {
    const row = document.createElement("div");
    row.className = `chat-row ${message.role}`;
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = message.content;
    const time = document.createElement("span");
    time.className = "chat-time";
    time.textContent = formatTime(message.timestamp);
    bubble.appendChild(time);
    row.appendChild(bubble);
    return row;
  }

  function renderHistory() {
    messagesElement.innerHTML = "";
    history.forEach(message => messagesElement.appendChild(createMessageNode(message)));
    scrollToBottom(false);
  }

  function appendMessage(role, content) {
    const message = { role, content: String(content).trim(), timestamp: Date.now() };
    history.push(message);
    history = history.slice(-MAX_STORED_MESSAGES);
    saveHistory();
    messagesElement.appendChild(createMessageNode(message));
    scrollToBottom();
  }

  function showTyping() {
    const row = document.createElement("div");
    row.className = "chat-row assistant";
    row.id = "chatTypingRow";
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble chat-typing";
    bubble.innerHTML = "<i></i><i></i><i></i>";
    row.appendChild(bubble);
    messagesElement.appendChild(row);
    scrollToBottom();
  }

  function hideTyping() { document.getElementById("chatTypingRow")?.remove(); }
  function scrollToBottom(smooth = true) {
    requestAnimationFrame(() => messagesElement.scrollTo({ top: messagesElement.scrollHeight, behavior: smooth ? "smooth" : "auto" }));
  }

  function openChat() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    launcher.classList.add("hidden");
    unread.hidden = true;
    document.body.classList.add("locked");
    setTimeout(() => input.focus(), 320);
    scrollToBottom(false);
  }

  function closeChat() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    launcher.classList.remove("hidden");
    if (document.getElementById("gate")?.classList.contains("hidden")) document.body.classList.remove("locked");
  }

  async function requestReply() {
    const requestMessages = history.filter(message => ["user", "assistant"].includes(message.role)).slice(-10).map(({ role, content }) => ({ role, content }));
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ageConfirmed: localStorage.getItem("wika-wow-age-confirmed") === "yes",
        messages: requestMessages,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Nie udało się połączyć z czatem.");
    if (!data.reply || typeof data.reply !== "string") throw new Error("Czat nie zwrócił odpowiedzi.");
    return data.reply.trim();
  }

  function previewFallback(userText) {
    const text = userText.toLowerCase();
    if (text.includes("telegram") || text.includes("dostęp") || text.includes("private")) return "Prywatny dostęp czeka na Telegramie 😘 Kliknij „Private Access” na stronie, a przeniosę Cię prosto tam.";
    if (text.includes("flirt") || text.includes("zaskocz")) return "Skoro już tu jesteś… chyba lubisz zaglądać tam, gdzie robi się trochę ciekawiej 😏";
    return "Podoba mi się Twoja ciekawość 😘 W wersji online odpowiadam przez Cloudflare Workers AI.";
  }

  async function sendMessage(rawText) {
    const text = String(rawText || "").trim();
    if (!text || sending) return;
    appendMessage("user", text);
    input.value = "";
    resizeInput();
    quick.hidden = true;
    sending = true;
    sendButton.disabled = true;
    showTyping();
    try {
      let reply;
      if (location.protocol === "file:") {
        await new Promise(resolve => setTimeout(resolve, 850));
        reply = previewFallback(text);
      } else {
        reply = await requestReply();
      }
      hideTyping();
      appendMessage("assistant", reply);
    } catch (error) {
      hideTyping();
      appendMessage("assistant", "Chwilowo nie mogę odpowiedzieć. Spróbuj ponownie za moment albo przejdź do Private Access 😘");
      console.error(error);
    } finally {
      sending = false;
      sendButton.disabled = false;
      input.focus();
    }
  }

  function resizeInput() {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 110)}px`;
  }

  launcher.addEventListener("click", openChat);
  closeButton.addEventListener("click", closeChat);
  form.addEventListener("submit", event => { event.preventDefault(); sendMessage(input.value); });
  input.addEventListener("input", resizeInput);
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });
  quick.addEventListener("click", event => {
    const button = event.target.closest("button[data-message]");
    if (button) sendMessage(button.dataset.message);
  });
  clearButton.addEventListener("click", () => {
    history = [{ ...initialMessage, timestamp: Date.now() }];
    saveHistory();
    quick.hidden = false;
    renderHistory();
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && panel.classList.contains("open")) closeChat(); });

  renderHistory();
  setTimeout(() => {
    if (!panel.classList.contains("open")) launcher.animate([
      { transform: "translateY(0) scale(1)" },
      { transform: "translateY(-6px) scale(1.04)" },
      { transform: "translateY(0) scale(1)" },
    ], { duration: 700, easing: "ease-out" });
  }, 2400);
})();
