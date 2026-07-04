import { handleSendMessage, renderExistingMessages } from "./chat.js";

const routes = {
  "/": renderHome,
  "/home": renderHome,
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

function renderHome() {
  const app = document.getElementById("app");
  app.innerHTML = `
        <section>
        <h1>Gandalf el Gris</h1>
        <p>Uno de los Istari, guía de la Comunidad del Anillo y protector de la Comarca.</p>
        <a href="/chat" data-href="/chat">Empezar a chatear</a>
        </section>
        `;
}

function renderAbout() {
  const app = document.getElementById("app");
  app.innerHTML = `
        <section>
        <h1>Acerca de este proyecto</h1>
        <p>SPA para chatear con Gandalf el Gris usando Google Gemini AI. Proyecto Integrador M3 - Henry Full Stack.</p>
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
  app.innerHTML = `
        <header>Gandalf el Gris</header>
        <main id="messages-area"></main>
        <div class="input-group">
            <textarea id="topic-input" placeholder="Ej: hola Gandalf" maxlength="200" rows="1"></textarea>
             <button id="generate-btn">Enviar</button>
        </div>
        `;

  const messagesEl = document.getElementById("messages-area");
  renderExistingMessages(messagesEl);
  const inputEl = document.getElementById("topic-input");
  const sendBtn = document.getElementById("generate-btn");

  sendBtn.addEventListener("click", () => {
    handleSendMessage(inputEl.value, messagesEl);
    inputEl.value = "";
  });
}

setupLinkInterception();
router();
