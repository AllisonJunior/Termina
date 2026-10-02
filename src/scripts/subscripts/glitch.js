const glitchCharacters = "!@#$%?+*=/\\|<>[]{}";

function collectTextNodes(element) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                return node.nodeValue.trim()
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
            }
        }
    );
    const textNodes = [];
    let node;

    while ((node = walker.nextNode())) {
        textNodes.push(node);
    }

    return textNodes;
}

function distortText(text) {
    return [...text].map((character) => {
        if (/\s/.test(character) || Math.random() > 0.18) {
            return character;
        }

        if (Math.random() < 0.35) {
            return "";
        }

        return glitchCharacters[Math.floor(Math.random() * glitchCharacters.length)];
    }).join("");
}

function startDistortedEffect(element) {
    const textNodes = collectTextNodes(element);
    const originalText = textNodes.map((node) => node.nodeValue);
    const intervalId = setInterval(() => {
        textNodes.forEach((node, index) => {
            node.nodeValue = distortText(originalText[index]);
        });
    }, 140);

    return () => {
        clearInterval(intervalId);
        textNodes.forEach((node, index) => {
            node.nodeValue = originalText[index];
        });
    };
}

export function initializeGlitches(root) {
    const effects = [];

    root.querySelectorAll('[data-glitch="distorted"]').forEach((element) => {
        effects.push(startDistortedEffect(element));
    });

    return () => effects.forEach((stopEffect) => stopEffect());
}