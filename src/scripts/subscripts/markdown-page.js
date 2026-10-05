import { loadMarkdown as renderMarkdown } from "../markdown.js";
import { initializeGlitches } from "./glitch.js";
import { initializeImageViewer } from "./image-viewer.js";

const contentTransitionDuration = 240;

/**
 * Creates the behavior for a page that navigates between Markdown documents.
 *
 * @param {{
 *     navigationSelector: string,
 *     contentSelector: string,
 *     itemSelector?: string,
 *     itemDataAttribute?: string,
 *     documents: Record<string, URL>,
 *     errorTitle?: string,
 *     errorMessage?: string
 * }} options
 */
export function createMarkdownPage(options) {
    const {
        navigationSelector,
        contentSelector,
        itemSelector = "[data-md]",
        itemDataAttribute = "md",
        documents,
        errorTitle = "Não foi possível carregar o documento",
        errorMessage = "Verifique se o arquivo existe e tente novamente.",
    } = options;

    let activeButton = null;
    let requestId = 0;
    let navigation = null;
    let content = null;
    let stopGlitches = () => {};
    let stopImageViewer = () => {};

    function setActiveButton(button) {
        navigation?.querySelectorAll(`${itemSelector}.active`).forEach((item) => {
            item.classList.remove("active");
            item.removeAttribute("aria-current");
        });
        activeButton?.classList.remove("active");
        activeButton?.removeAttribute("aria-current");
        button.classList.add("active");
        button.setAttribute("aria-current", "page");
        activeButton = button;
    }

    async function loadDocument(name, button) {
        const fileUrl = documents[name];

        if (!fileUrl) {
            console.error(`Documento Markdown não cadastrado: ${name}`);
            return;
        }

        const currentRequest = ++requestId;
        setActiveButton(button);

        const wasVisible = content.classList.contains("is-visible");
        content.classList.remove("is-visible");
        content.setAttribute("aria-busy", "true");

        if (wasVisible) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await new Promise((resolve) => {
                setTimeout(resolve, contentTransitionDuration);
            });
        }

        if (currentRequest !== requestId) {
            return;
        }

        stopGlitches();
        stopGlitches = () => {};
        content.innerHTML = "<p>Carregando conteúdo...</p>";

        try {
            const renderedMarkdown = await renderMarkdown(fileUrl);

            if (currentRequest !== requestId) {
                return;
            }

            const renderedContent = document.createElement("div");
            renderedContent.innerHTML = renderedMarkdown;

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
                <h2>${errorTitle}</h2>
                <p>${errorMessage}</p>
            `;
            content.setAttribute("aria-busy", "false");
            requestAnimationFrame(() => content.classList.add("is-visible"));
        }
    }

    function handleNavigationClick(event) {
        const button = event.target.closest(itemSelector);

        if (!button || !navigation.contains(button)) {
            return;
        }

        loadDocument(button.dataset[itemDataAttribute], button);
    }

    function initialize() {
        if (navigation || content) {
            cleanup();
        }

        navigation = document.querySelector(navigationSelector);
        content = document.querySelector(contentSelector);

        if (!navigation || !content) {
            return;
        }

        stopImageViewer = initializeImageViewer(content);
        navigation.addEventListener("click", handleNavigationClick);

        const buttons = [...navigation.querySelectorAll(itemSelector)];
        const initialButton = buttons.find((item) => item.classList.contains("active"))
            ?? buttons[0];

        buttons.forEach((item) => {
            if (item !== initialButton) {
                item.classList.remove("active");
                item.removeAttribute("aria-current");
            }
        });

        if (initialButton) {
            loadDocument(initialButton.dataset[itemDataAttribute], initialButton);
        }
    }

    function cleanup() {
        requestId++;
        stopGlitches();
        stopGlitches = () => {};
        stopImageViewer();
        stopImageViewer = () => {};
        navigation?.removeEventListener("click", handleNavigationClick);
        navigation = null;
        content = null;
        activeButton = null;
    }

    return { initialize, cleanup };
}
