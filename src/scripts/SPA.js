
import { createMusicPlayer } from "./music-player.js";

const pages = {
    home: new URL("../pages/home.html", import.meta.url),
    lore: new URL("../pages/lore.html", import.meta.url),
    system: new URL("../pages/system.html", import.meta.url),
    characters: new URL("../pages/characters.html", import.meta.url),
};

const pageModules = {
    lore: () => import("./subscripts/lore.js")
};

const pageCache = new Map();
let renderRequestId = 0;
let activePageModule = null;
let musicPlayer = null;

export function initializeSPA(navBar) {
    const appContent = document.createElement("main");
    appContent.id = "app-content";
    document.body.appendChild(appContent);
    musicPlayer = createMusicPlayer();

    // Delegação de eventos para navbar e conteúdo das páginas.
    document.addEventListener("click", async (event) => {
        const button = event.target.closest("[setPage]");

        if (!button) {
            return;
        }

        const page = button.getAttribute("setPage");

        if (!pages[page]) {
            return;
        }

        // Atualiza o botão ativo da navbar.
        navBar.querySelectorAll("[setPage]").forEach((item) => {
            item.classList.toggle(
                "active",
                item.getAttribute("setPage") === page
            );
        });

        await renderPage(page);
    });

    // Carrega uma página como principal
    // durante dev, mudar para pasta em que está trabalhando
    // ao lançar, mudar para home
    renderPage("home");
}

async function renderPage(page) {
    const appContent = document.getElementById("app-content");

    if (!appContent || !pages[page]) {
        return;
    }

    const requestId = ++renderRequestId;

    activePageModule?.cleanup?.();
    activePageModule = null;
    musicPlayer?.setVisible(page === "home");

    appContent.classList.remove("is-visible");
    appContent.innerHTML = `
        <section class="page">
            <p>Carregando...</p>
        </section>
    `;

    try {
        let html = pageCache.get(page);

        if (html === undefined) {
            const response = await fetch(pages[page]);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            html = await response.text();
            pageCache.set(page, html);
        }

        // Evita que uma resposta antiga substitua a página atual.
        if (requestId !== renderRequestId) {
            return;
        }

        appContent.innerHTML = html;
        requestAnimationFrame(() => appContent.classList.add("is-visible"));

        const loadModule = pageModules[page];

        if (loadModule) {
            const pageModule = await loadModule();

            if (requestId !== renderRequestId) {
                pageModule.cleanup?.();
                return;
            }

            pageModule.initialize();
            activePageModule = pageModule;
        }

    } catch (error) {
        if (requestId !== renderRequestId) {
            return;
        }

        console.error(`Erro ao carregar "${page}":`, error);

        appContent.innerHTML = `
            <section class="page">
                <h1>Erro ao carregar a página</h1>
                <p>Não foi possível carregar o conteúdo solicitado.</p>
            </section>
        `;
        requestAnimationFrame(() => appContent.classList.add("is-visible"));
    }
}