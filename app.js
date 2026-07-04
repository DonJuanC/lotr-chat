import {
  handleSendMessage,
  renderExistingMessages,
  setActiveCharacter,
  getActiveCharacterId,
  clearHistory,
  hasStoredHistory,
} from "./chat.js";
import { CHARACTERS } from "./characters.js";

const routes = {
  "/": renderGallery,
  "/home": renderGallery,
  "/gallery": renderGallery,
  "/chat": renderChat,
  "/about": renderAbout,
};

function router() {
  const path = window.location.pathname;
  const renderFn = routes[path] || renderNotFound;
  renderFn();
}

function navigateTo(path) {
  if (window.location.pathname === path) return;
  history.pushState(null, "", path);
  router();
}

window.addEventListener("popstate", router);

function setupLinkInterception() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href) return;
    if (!href.startsWith("/")) return;

    event.preventDefault();
    navigateTo(href);
  });
}

function setupThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("lotr-chat-theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    toggleBtn.textContent = "☀️";
  }

  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    const isDark = document.body.classList.contains("dark-theme");
    localStorage.setItem("lotr-chat-theme", isDark ? "dark" : "light");
    toggleBtn.textContent = isDark ? "☀️" : "🌙";
  });
}

function renderAbout() {
  const app = document.getElementById("app");
  app.innerHTML = `
        <section>
        <h1>Acerca de este proyecto</h1>
        <p>SPA para chatear con personajes de la Tierra Media (Gandalf, Gollum, Aragorn, Bilbo, Legolas, Gimli y Saruman) usando Google Gemini AI. Proyecto Integrador M3 - Henry Full Stack.</p>
        </section>
        `;
}

function renderNotFound() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <section>
    <h1>Ruta no encontrada</h1>
    <a href="/home" data-href="/home">Volver al inicio</a>
    </section>
    `;
}

function renderChat() {
  const app = document.getElementById("app");
  const character = CHARACTERS.find((c) => c.id === getActiveCharacterId());
  app.innerHTML = `
        <header>${character.emoji} ${character.name}</header>
        <div class="chat-toolbar">
          <span>${hasStoredHistory(character.id) ? "💾 Historial guardado" : ""}</span>
          <button id="clear-history-btn">🗑️ Borrar historial</button>
        </div>
        <main id="messages-area"></main>
        <div class="input-group">
            <textarea id="topic-input" placeholder="Ej: hola ${character.name}" maxlength="200" rows="1"></textarea>
             <button id="generate-btn">Enviar</button>
        </div>
        `;

  const messagesEl = document.getElementById("messages-area");
  renderExistingMessages(messagesEl);
  const inputEl = document.getElementById("topic-input");
  const sendBtn = document.getElementById("generate-btn");

  function sendMessage() {
    handleSendMessage(inputEl.value, messagesEl);
    inputEl.value = "";
  }

  sendBtn.addEventListener("click", sendMessage);

  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  document.getElementById("clear-history-btn").addEventListener("click", () => {
    clearHistory();
    renderChat();
  });
}

function renderGallery() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <section>
        <h1>Elegí con quién chatear</h1>
        <div class="gallery-grid">
            ${CHARACTERS.map(
              (c) => `
                <div class="character-card" data-id="${c.id}">
                    <span class="character-card__emoji">${c.emoji}</span>
                    <h3>${c.name}</h3>
                    <p>${c.tagline}</p>
                </div>
            `,
            ).join("")}
        </div>
    </section>
`;

  document.querySelectorAll(".character-card").forEach((card) => {
    card.addEventListener("click", () => {
      setActiveCharacter(card.dataset.id);
      navigateTo("/chat");
    });
  });
}

setupLinkInterception();
setupThemeToggle();
router();
