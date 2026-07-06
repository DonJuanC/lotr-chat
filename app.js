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

// Toast genérico (usado por el cambio de tema y por acciones como borrar
// historial): role="status" + aria-live="polite" en el HTML hace que se
// anuncie a lectores de pantalla apenas cambia el texto, y para quien ve
// la pantalla aparece y se desvanece solo.
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("toast--visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("toast--visible");
  }, 2200);
}

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

  function applyLabel(isDark) {
    toggleBtn.textContent = isDark ? "☀️" : "🌙";
    toggleBtn.setAttribute(
      "aria-label",
      isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
    );
  }

  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    applyLabel(true);
  } else {
    applyLabel(false);
  }

  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    const isDark = document.body.classList.contains("dark-theme");
    localStorage.setItem("lotr-chat-theme", isDark ? "dark" : "light");
    applyLabel(isDark);
    showToast(isDark ? "Modo oscuro activado" : "Modo claro activado");
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
            <p>SPA para chatear con personajes de la Tierra Media (Gandalf, Gollum, Aragorn, Bilbo, Legolas, Gimli y Saruman) usando Google Gemini AI. Construida para afianzar diseño responsive, SPA con History API, JavaScript asíncrono, integración con IA y despliegue serverless.</p>
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
          <div class="bento-item bento-item--credits">
            <h3>Créditos</h3>
            <p>JuanCamilo Castellanos — <a href="https://github.com/DonJuanC" target="_blank" rel="noopener noreferrer">github.com/DonJuanC</a></p>
            <p class="bento-disclaimer">Proyecto académico sin fines comerciales. Los personajes y el universo de la Tierra Media son propiedad de The Tolkien Estate y sus respectivos titulares de derechos; este proyecto no está afiliado ni respaldado por ellos.</p>
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
        <div class="chat-layout" style="--character-accent: ${character.accent}; --character-accent-rgb: ${character.accentRgb};">
          <h1 class="sr-only">${character.name}</h1>
          <header>
            ${character.name}
            <a href="/personaje/${character.id}" data-href="/personaje/${character.id}" class="chat-header__lore-link">Historia</a>
          </header>
          <div class="chat-columns">
            <nav class="chat-rail" aria-label="Elegir personaje">
              <ul class="chat-rail__list">
                ${CHARACTERS.map(
                  (c) => `
                  <li>
                    <button
                      type="button"
                      class="chat-rail__item${c.id === character.id ? " chat-rail__item--active" : ""}"
                      data-id="${c.id}"
                      data-name="${c.name}"
                      data-tagline="${c.tagline}"
                      aria-label="${c.name}"
                      aria-current="${c.id === character.id ? "true" : "false"}"
                    >
                      ${avatarMarkup(c, "chat-rail__avatar", "chat-rail__emoji")}
                    </button>
                  </li>
                `,
                ).join("")}
              </ul>
            </nav>
            <div class="chat-main">
              <div class="chat-toolbar">
                <span>${hasStoredHistory(character.id) ? "Historial guardado" : ""}</span>
                <button id="clear-history-btn">Borrar historial</button>
              </div>
              <main id="messages-area" role="log" aria-live="polite"></main>
              <div class="input-group">
                  <textarea id="topic-input" placeholder="Ej: hola ${character.name}" maxlength="200" rows="1" aria-label="Mensaje para ${character.name}"></textarea>
                   <button id="generate-btn">Enviar</button>
              </div>
            </div>
            <aside class="chat-lore-panel" aria-label="Sobre ${character.name}">
              <div class="chat-lore-panel__header">
                ${avatarMarkup(character, "chat-lore-panel__avatar", "chat-lore-panel__emoji")}
                <h2>${character.name}</h2>
                <p class="chat-lore-panel__tagline">${character.tagline}</p>
              </div>
              <div class="lore-section">
                <button type="button" class="lore-section__trigger" aria-expanded="true" aria-controls="lore-history">
                  Historia <span class="lore-section__icon" aria-hidden="true">▾</span>
                </button>
                <div id="lore-history" class="lore-section__content">
                  <p>${character.lore}</p>
                </div>
              </div>
              <div class="lore-section">
                <button type="button" class="lore-section__trigger" aria-expanded="true" aria-controls="lore-prompts">
                  Puedes preguntarle <span class="lore-section__icon" aria-hidden="true">▾</span>
                </button>
                <div id="lore-prompts" class="lore-section__content">
                  <ul class="lore-section__prompts">
                    ${character.suggestedPrompts.map((q) => `<li><button type="button" class="lore-section__prompt">${q}</button></li>`).join("")}
                  </ul>
                </div>
              </div>
              <a href="/personaje/${character.id}" data-href="/personaje/${character.id}" class="chat-lore-panel__link">Ver página completa →</a>
            </aside>
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
    showToast("Historial borrado");
  });

  // Tooltip del rail: un único elemento position:fixed reposicionado por JS
  // según el avatar activo (un ::after dentro del riel quedaba recortado
  // por el overflow-y:auto del contenedor).
  let railTooltip = document.getElementById("rail-tooltip");
  if (!railTooltip) {
    railTooltip = document.createElement("div");
    railTooltip.id = "rail-tooltip";
    railTooltip.className = "chat-rail__tooltip";
    railTooltip.innerHTML = "<strong></strong><span></span>";
    document.body.appendChild(railTooltip);
  }

  function showRailTooltip(btn) {
    const rect = btn.getBoundingClientRect();
    railTooltip.querySelector("strong").textContent = btn.dataset.name;
    railTooltip.querySelector("span").textContent = btn.dataset.tagline;
    railTooltip.style.top = `${rect.top + rect.height / 2}px`;
    railTooltip.style.left = `${rect.right}px`;
    railTooltip.classList.add("chat-rail__tooltip--visible");
  }

  function hideRailTooltip() {
    railTooltip.classList.remove("chat-rail__tooltip--visible");
  }

  document.querySelectorAll(".chat-rail__item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.id === character.id) return;
      setActiveCharacter(btn.dataset.id);
      renderChat();
    });
    btn.addEventListener("mouseenter", () => showRailTooltip(btn));
    btn.addEventListener("mouseleave", hideRailTooltip);
    btn.addEventListener("focus", () => showRailTooltip(btn));
    btn.addEventListener("blur", hideRailTooltip);
  });

  // Acordeón del panel de historia: patrón disclosure (aria-expanded +
  // atributo hidden en el contenido), sin librería.
  document.querySelectorAll(".lore-section__trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
      document.getElementById(trigger.getAttribute("aria-controls")).hidden =
        expanded;
    });
  });

  document.querySelectorAll(".lore-section__prompt").forEach((btn) => {
    btn.addEventListener("click", () => {
      handleSendMessage(btn.textContent, messagesEl);
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
                    <a href="/personaje/${c.id}" data-href="/personaje/${c.id}" class="character-card__lore-link">Su historia</a>
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

  // Scroll-reveal: IntersectionObserver avisa cuando una card entra en
  // pantalla, sin escuchar el evento "scroll" a mano. Si el navegador no
  // soporta la API, esta clase nunca se agrega y las cards quedan visibles.
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
