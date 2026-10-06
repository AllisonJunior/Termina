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
    humano:      new URL("../../../bd/system/racas/humano.md", import.meta.url),
    elfo:        new URL("../../../bd/system/racas/elfo.md", import.meta.url),
    mink:        new URL("../../../bd/system/racas/mink.md", import.meta.url),
    vampir:      new URL("../../../bd/system/racas/vampir.md", import.meta.url),
    seele:       new URL("../../../bd/system/racas/seele.md", import.meta.url),
    carnical:    new URL("../../../bd/system/racas/carnical.md", import.meta.url),
    agraciado:   new URL("../../../bd/system/racas/agraciado.md", import.meta.url),
    amaldicoado: new URL("../../../bd/system/racas/amaldicoado.md", import.meta.url),

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
