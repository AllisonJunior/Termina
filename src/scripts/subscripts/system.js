import { createMarkdownPage } from "./markdown-page.js";

const markdownFiles = {
    // Regras
    intro:           new URL("../../../bd/system/regras/intro.md", import.meta.url),
    atributos:       new URL("../../../bd/system/regras/atributos.md", import.meta.url),
    magias:          new URL("../../../bd/system/regras/magias.md", import.meta.url),
    reacoes:         new URL("../../../bd/system/regras/reacoes.md", import.meta.url),
    desestabilizado: new URL("../../../bd/system/regras/desestabilizado.md", import.meta.url),
    efeitos:         new URL("../../../bd/system/regras/efeitos.md", import.meta.url),
    nivel:           new URL("../../../bd/system/regras/nivel.md", import.meta.url),

    // Raças
    humano:          new URL("../../../bd/system/racas/humano.md", import.meta.url),
    elfo:            new URL("../../../bd/system/racas/elfo.md", import.meta.url),
    mink:            new URL("../../../bd/system/racas/mink.md", import.meta.url),
    vampir:          new URL("../../../bd/system/racas/vampir.md", import.meta.url),
    seele:           new URL("../../../bd/system/racas/seele.md", import.meta.url),
    carnical:        new URL("../../../bd/system/racas/carnical.md", import.meta.url),
    
    // Classes
    robusto:         new URL("../../../bd/system/classes/robusto.md", import.meta.url),
    sobrevivente:    new URL("../../../bd/system/classes/sobrevivente.md", import.meta.url),
    intocavel:       new URL("../../../bd/system/classes/intocavel.md", import.meta.url),
    arcanista:       new URL("../../../bd/system/classes/arcanista.md", import.meta.url),
    horrante:        new URL("../../../bd/system/classes/horrante.md", import.meta.url),
    mestre:          new URL("../../../bd/system/classes/mestre.md", import.meta.url),
    
    // Magias
    mundana:         new URL("../../../bd/system/magias/mundana.md", import.meta.url),
    alma:            new URL("../../../bd/system/magias/alma.md", import.meta.url),
    
    // Perks
    perks:           new URL("../../../bd/system/perks.md", import.meta.url),

    // Armas Únicas

    // Recursos
};

const systemPage = createMarkdownPage({
    navigationSelector: ".system-sidebar",
    contentSelector: "#system-content",
    documents: markdownFiles,
});

export const { initialize, cleanup } = systemPage;
