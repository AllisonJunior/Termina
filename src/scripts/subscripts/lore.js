
import { loadMarkdown as renderMarkdown } from "../markdown.js";
import { initializeGlitches } from "./glitch.js";
import { initializeImageViewer } from "./image-viewer.js";

const markdownFiles = {
    lore: new URL("../../../bd/lore/intro.md", import.meta.url),
    player: new URL("../../../bd/lore/player.md", import.meta.url),
    convite: new URL("../../../bd/lore/convite.md", import.meta.url)
};

let activeButton = null;
let requestId = 0;
let stopGlitches = () => {};
let stopImageViewer = () => {};

export function initialize() {
    const sidebar = document.querySelector(".lore-sidebar");
    const content = document.getElementById("lore-content");

    if (!sidebar || !content) {
        return;
    }

    stopImageViewer = initializeImageViewer(content);
    const buttons = [...sidebar.querySelectorAll("[data-md]")];
    const initialButton = buttons.find((item) => item.classList.contains("active"))
        ?? buttons[0];

    buttons.forEach((item) => {
        if (item !== initialButton) {
            item.classList.remove("active");
            item.removeAttribute("aria-current");
        }
    });

    sidebar.addEventListener("click", (event) => {
        const button = event.target.closest("[data-md]");

        if (!button || !sidebar.contains(button)) {
            return;
        }

        loadMarkdown(button.dataset.md, button, content);
    });

    if (initialButton) {
        loadMarkdown(initialButton.dataset.md, initialButton, content);
    }
}

async function loadMarkdown(name, button, content) {
    const fileUrl = markdownFiles[name];

    if (!fileUrl) {
        console.error(`Documento Markdown não cadastrado: ${name}`);
        return;
    }

    const currentRequest = ++requestId;

    // Atualiza o item selecionado na barra lateral.
    button.closest(".lore-sidebar")?.querySelectorAll("[data-md].active").forEach((item) => {
        item.classList.remove("active");
        item.removeAttribute("aria-current");
    });
    activeButton?.classList.remove("active");
    activeButton?.removeAttribute("aria-current");
    button.classList.add("active");
    button.setAttribute("aria-current", "page");
    activeButton = button;

    content.classList.remove("is-visible");
    content.innerHTML = "<p>Carregando conteúdo...</p>";
    stopGlitches();
    stopGlitches = () => {};

    try {
        const renderedMarkdown = await renderMarkdown(fileUrl);

        // Descarta respostas de cliques anteriores.
        if (currentRequest !== requestId) {
            return;
        }

        content.innerHTML = renderedMarkdown;
        requestAnimationFrame(() => content.classList.add("is-visible"));
        stopGlitches = initializeGlitches(content);

    } catch (error) {
        if (currentRequest !== requestId) {
            return;
        }

        console.error(`Falha ao carregar ${name}.md:`, error);

        content.innerHTML = `
            <h2>Não foi possível carregar o documento</h2>
            <p>Verifique se o arquivo existe e tente novamente.</p>
        `;
        requestAnimationFrame(() => content.classList.add("is-visible"));
    }
}

export function cleanup() {
    // Invalida qualquer requisição pendente ao sair da página.
    requestId++;
    stopGlitches();
    stopGlitches = () => {};
    stopImageViewer();
    stopImageViewer = () => {};
    activeButton = null;
}