import { createMarkdownPage } from "./markdown-page.js";

const markdownFiles = {
    // Regras
    intro:           new URL("../../../bd/system/regras/intro.md", import.meta.url),
    atributos:       new URL("../../../bd/system/regras/atributos.md", import.meta.url),
    reacoes:         new URL("../../../bd/system/regras/reacoes.md", import.meta.url),
    desestabilizado: new URL("../../../bd/system/regras/desestabilizado.md", import.meta.url),
    efeitos:         new URL("../../../bd/system/regras/efeitos.md", import.meta.url),
    nivel:           new URL("../../../bd/system/regras/nivel.md", import.meta.url),

    // Raças
    humano: new URL("../../../bd/system/racas/humano.md", import.meta.url),

    // Classes

    // Perks

    // Armas Únicas

    // Recursos
};

const systemPage = createMarkdownPage({
    navigationSelector: ".system-sidebar",
    contentSelector: "#system-content",
    documents: markdownFiles,
});

export const { initialize, cleanup } = systemPage;
