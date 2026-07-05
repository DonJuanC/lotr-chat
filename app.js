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

function avatarMarkup(character, avatarClass, emojiClass) {
  return `
    <img
      src="/assets/${character.id}.png"
      alt="${character.name}"
      class="${avatarClass}"
      onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
    />
    <span class="${emojiClass}" style="display:none;">${character.emoji}</span>
  `;
}

function router() {
  const app = document.getElementById("app");
  app.classList.add("is-transitioning");

  setTimeout(() => {
    const path = window.location.pathname;

    if (path.startsWith("/personaje/")) {
      const characterId = path.split("/personaje/")[1];
      renderLore(characterId);
    } else {
      const renderFn = routes[path] || renderNotFound;
      renderFn();
    }

    app.classList.remove("is-transitioning");
  }, 150);
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
    toggleBtn.setAttribute("aria-label", "Cambiar a modo claro");
  } else {
    toggleBtn.setAttribute("aria-label", "Cambiar a modo oscuro");
  }

  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    const isDark = document.body.classList.contains("dark-theme");
    localStorage.setItem("lotr-chat-theme", isDark ? "dark" : "light");
    toggleBtn.textContent = isDark ? "☀️" : "🌙";
    toggleBtn.setAttribute(
      "aria-label",
      isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
    );
  });
}

function renderAbout() {
  const app = document.getElementById("app");
  app.innerHTML = `
        <section>
        <h1>Acerca de este proyecto</h1>
        <div class="about-bento">
          <div class="bento-item bento-item--what">
            <h2>¿Qué es esto?</h2>
            <p>SPA para chatear con personajes de la Tierra Media (Gandalf, Gollum, Aragorn, Bilbo, Legolas, Gimli y Saruman) usando Google Gemini AI. Proyecto Integrador M3 — Henry Full Stack.</p>
          </div>
          <div class="bento-item bento-item--stack">
            <h3>Stack técnico</h3>
            <ul>
              <li>JavaScript vanilla + SPA con History API</li>
              <li>Vercel Serverless Functions</li>
              <li>Google Gemini AI (@google/genai)</li>
              <li>Vitest para testing</li>
              <li>CSS puro, mobile-first</li>
            </ul>
          </div>
          <div class="bento-item bento-item--characters">
            <h3>Los 7 personajes</h3>
            <ul class="bento-character-list">
              ${CHARACTERS.map((c) => `<li>${c.emoji} ${c.name}</li>`).join("")}
            </ul>
          </div>
          <div class="bento-item bento-item--process">
            <h3>Proceso con IA</h3>
            <p>Construido con Claude como tutor: cada línea de código fue escrita a mano, guiada paso a paso — desde el routing hasta la accesibilidad WCAG 2.1 AA.</p>
          </div>
        </div>
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
        <div class="chat-layout">
          <aside class="chat-sidebar">
            <h2 class="chat-sidebar__title">Personajes</h2>
            <ul class="chat-sidebar__list">
              ${CHARACTERS.map(
                (c) => `
                <li class="chat-sidebar__item${c.id === character.id ? " chat-sidebar__item--active" : ""}" data-id="${c.id}" role="button" tabindex="0">
                  ${avatarMarkup(c, "chat-sidebar__avatar", "chat-sidebar__emoji")}
                  <span>${c.name}</span>
                </li>
              `,
              ).join("")}
            </ul>
          </aside>
          <div class="chat-main">
            <h1 class="sr-only">${character.name}</h1>
            <header>${avatarMarkup(character, "chat-header__avatar", "chat-header__emoji")} ${character.name}</header>
            <div class="chat-toolbar">
              <span>${hasStoredHistory(character.id) ? "💾 Historial guardado" : ""}</span>
              <button id="clear-history-btn">🗑️ Borrar historial</button>
            </div>
            <main id="messages-area" role="log" aria-live="polite"></main>
            <div class="input-group">
                <textarea id="topic-input" placeholder="Ej: hola ${character.name}" maxlength="200" rows="1" aria-label="Mensaje para ${character.name}"></textarea>
                 <button id="generate-btn">Enviar</button>
            </div>
          </div>
        </div>
        `;

  const messagesEl = document.getElementById("messages-area");
  renderExistingMessages(messagesEl);

  if (!hasStoredHistory(character.id)) {
    const suggestions = document.createElement("div");
    suggestions.className = "suggested-prompts";
    suggestions.innerHTML = character.suggestedPrompts
      .map(
        (q) => `<button class="suggested-prompt" type="button">${q}</button>`,
      )
      .join("");
    messagesEl.appendChild(suggestions);

    suggestions.querySelectorAll(".suggested-prompt").forEach((btn) => {
      btn.addEventListener("click", () => {
        handleSendMessage(btn.textContent, messagesEl);
        suggestions.remove();
      });
    });
  }

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

  document.querySelectorAll(".chat-sidebar__item").forEach((item) => {
    function selectSidebarCharacter() {
      if (item.dataset.id === character.id) return;
      setActiveCharacter(item.dataset.id);
      renderChat();
    }

    item.addEventListener("click", selectSidebarCharacter);

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectSidebarCharacter();
      }
    });
  });
}

function renderGallery() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <section class="hero">
        <h1 class="hero__title">El Chat de la Tierra Media</h1>
        <p class="hero__subtitle">Desde la Comarca hasta Isengard: habla con quienes forjaron el destino de un mundo... o lo condenaron.</p>
        <div class="divider" aria-hidden="true">⚜</div>
    </section>
    <section class="gallery">
        <h2>Elige con quién chatear</h2>
        <div class="gallery-grid">
            ${CHARACTERS.map(
              (c) => `
                <div class="character-card" data-id="${c.id}" role="button" tabindex="0">
                    ${avatarMarkup(c, "character-card__avatar", "character-card__emoji")}
                    <h3>${c.name}</h3>
                    <p>${c.tagline}</p>
                    <a href="/personaje/${c.id}" data-href="/personaje/${c.id}" class="character-card__lore-link">📖 Su historia</a>
                </div>
            `,
            ).join("")}
        </div>
    </section>
`;

  document.querySelectorAll(".character-card").forEach((card) => {
    function selectCharacter() {
      setActiveCharacter(card.dataset.id);
      navigateTo("/chat");
    }

    card.addEventListener("click", selectCharacter);

    card.addEventListener("keydown", (event) => {
      if (event.target !== card) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCharacter();
      }
    });
  });

  document.querySelectorAll(".character-card__lore-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      navigateTo(link.getAttribute("href"));
    });
  });

  if ("IntersectionObserver" in window) {
    const cards = document.querySelectorAll(".character-card");
    cards.forEach((card) => card.classList.add("reveal-pending"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("reveal-pending");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    cards.forEach((card) => observer.observe(card));
  }
}

function renderLore(characterId) {
  const app = document.getElementById("app");
  const character = CHARACTERS.find((c) => c.id === characterId);

  if (!character) {
    renderNotFound();
    return;
  }

  app.innerHTML = `
    <section class="lore">
        ${avatarMarkup(character, "lore__avatar", "lore__emoji")}
        <h1>${character.name}</h1>
        <div class="divider" aria-hidden="true">⚜</div>
        <p class="lore__text">${character.lore}</p>
        <div class="lore__actions">
            <button id="chat-with-character-btn">Chatear con ${character.name}</button>
            <a href="/home" data-href="/home">← Volver a la galería</a>
        </div>
    </section>
`;

  document
    .getElementById("chat-with-character-btn")
    .addEventListener("click", () => {
      setActiveCharacter(character.id);
      navigateTo("/chat");
    });
}

setupLinkInterception();
setupThemeToggle();
router();
