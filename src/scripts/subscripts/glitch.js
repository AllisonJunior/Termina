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

function startHideEffect(element) {
    const revealRadius = 70;

    const handlePointerMove = (event) => {
        const bounds = element.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;

        element.style.setProperty("--hide-x", `${x}px`);
        element.style.setProperty("--hide-y", `${y}px`);
        element.style.setProperty("--hide-radius", `${revealRadius}px`);
        element.classList.add("markdown-glitch-hide-active");
    };

    const handlePointerLeave = () => {
        element.classList.remove("markdown-glitch-hide-active");
    };

    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerleave", handlePointerLeave);

    return () => {
        element.removeEventListener("pointermove", handlePointerMove);
        element.removeEventListener("pointerleave", handlePointerLeave);
        element.classList.remove("markdown-glitch-hide-active");
        element.style.removeProperty("--hide-x");
        element.style.removeProperty("--hide-y");
        element.style.removeProperty("--hide-radius");
    };
}

export function initializeGlitches(root) {
    const effects = [];

    root.querySelectorAll('[data-glitch="distorted"]').forEach((element) => {
        effects.push(startDistortedEffect(element));
    });

    root.querySelectorAll('[data-glitch="hide"]').forEach((element) => {
        effects.push(startHideEffect(element));
    });

    return () => effects.forEach((stopEffect) => stopEffect());
}