import { createMarkdownPage } from "./markdown-page.js";

const markdownFiles = {
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
    golgotha: new URL("../../../bd/lore/distritos/golgotha.md", import.meta.url),
    lordran: new URL("../../../bd/lore/distritos/lordran.md", import.meta.url),
    hellstradis: new URL("../../../bd/lore/distritos/hellstradis.md", import.meta.url),
    rapture: new URL("../../../bd/lore/distritos/rapture.md", import.meta.url),
    roccia: new URL("../../../bd/lore/distritos/roccia.md", import.meta.url),
    ma_havre: new URL("../../../bd/lore/distritos/ma'havre.md", import.meta.url),
    axiom: new URL("../../../bd/lore/distritos/axiom.md", import.meta.url),
};

const lorePage = createMarkdownPage({
    navigationSelector: ".lore-sidebar",
    contentSelector: "#lore-content",
    documents: markdownFiles,
});

export const { initialize, cleanup } = lorePage;
