
import { loadMarkdown as renderMarkdown } from "../markdown.js";
import { initializeGlitches } from "./glitch.js";
import { initializeImageViewer } from "./image-viewer.js";

const markdownFiles = {
    // Whatever
    lore: new URL("../../../bd/lore/intro.md", import.meta.url),
    player: new URL("../../../bd/lore/player.md", import.meta.url),
    convite: new URL("../../../bd/lore/convite.md", import.meta.url),
    sociedade: new URL("../../../bd/lore/sociedade.md", import.meta.url),
    vanguarda: new URL("../../../bd/lore/vanguarda.md", import.meta.url),
    periferias: new URL("../../../bd/lore/periferias.md", import.meta.url),
    abismo: new URL("../../../bd/lore/abismo.md", import.meta.url),
    morta: new URL("../../../bd/lore/morta.md", import.meta.url),
    as_criaturas: new URL("../../../bd/lore/as_criaturas.md", import.meta.url),
    reliquias: new URL("../../../bd/lore/reliquias.md", import.meta.url),

    // Distritos 
    golgotha: new URL("../../../bd/lore/distritos/golgotha.md", import.meta.url),
    lordran: new URL("../../../bd/lore/distritos/lordran.md", import.meta.url),
    hellstradis: new URL("../../../bd/lore/distritos/hellstradis.md", import.meta.url),
    rapture: new URL("../../../bd/lore/distritos/rapture.md", import.meta.url),
    roccia: new URL("../../../bd/lore/distritos/roccia.md", import.meta.url),
    ma_havre: new URL("../../../bd/lore/distritos/ma'havre.md", import.meta.url),
    axiom: new URL("../../../bd/lore/distritos/axiom.md", import.meta.url),
};

let activeButton = null;
let requestId = 0;
let stopGlitches = () => {};
let stopImageViewer = () => {};
const contentTransitionDuration = 240;

function waitForImages(container) {
    const images = [...container.querySelectorAll("img")];

    return Promise.all(images.map((image) => {
        if (image.complete) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const finish = () => {
                image.removeEventListener("load", finish);
                image.removeEventListener("error", finish);
                resolve();
            };

            image.addEventListener("load", finish);
            image.addEventListener("error", finish);
        });
    }));
}

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

    const wasVisible = content.classList.contains("is-visible");
    content.classList.remove("is-visible");
    content.setAttribute("aria-busy", "true");

    // Garante que o estado de saída seja pintado antes da nova página.
    if (wasVisible) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => {
            setTimeout(resolve, contentTransitionDuration);
        });
    }

    // Os efeitos continuam ativos durante o fade-out para não revelar o texto.
    if (currentRequest !== requestId) {
        return;
    }

    stopGlitches();
    stopGlitches = () => {};
    content.innerHTML = "<p>Carregando conteúdo...</p>";

    try {
        const renderedMarkdown = await renderMarkdown(fileUrl);

        // Descarta respostas de cliques anteriores.
        if (currentRequest !== requestId) {
            return;
        }

        const renderedContent = document.createElement("div");
        renderedContent.innerHTML = renderedMarkdown;
        await waitForImages(renderedContent);

        if (currentRequest !== requestId) {
            return;
        }

        content.innerHTML = renderedContent.innerHTML;
        stopGlitches = initializeGlitches(content);
        content.setAttribute("aria-busy", "false");
        requestAnimationFrame(() => content.classList.add("is-visible"));

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
        content.setAttribute("aria-busy", "false");
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