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
        if (/\s/.test(character) || Math.random() > 0.28) {
            return character;
        }

        if (Math.random() < 0.25) {
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
    const hitboxBottomPadding = 4;
    const textNodes = collectTextNodes(element);
    const replacements = [];

    textNodes.forEach((node) => {
        const fragment = document.createDocumentFragment();
        const characters = [];

        [...node.nodeValue].forEach((character) => {
            const characterElement = document.createElement("span");
            characterElement.className = "markdown-glitch-hide-character";
            characterElement.textContent = character;
            fragment.appendChild(characterElement);
            characters.push(characterElement);
        });

        node.replaceWith(fragment);
        replacements.push({ characters, text: node.nodeValue });
    });

    const handlePointerMove = (event) => {
        element.querySelectorAll(".markdown-glitch-hide-character").forEach((character) => {
            const bounds = character.getBoundingClientRect();
            const closestX = Math.max(bounds.left, Math.min(event.clientX, bounds.right));
            const closestY = Math.max(bounds.top, Math.min(event.clientY, bounds.bottom));
            const distance = Math.hypot(
                event.clientX - closestX,
                event.clientY - closestY
            );

            character.classList.toggle(
                "markdown-glitch-hide-character-visible",
                distance <= revealRadius
            );
        });
    };

    const handlePointerLeave = () => {
        element.querySelectorAll(".markdown-glitch-hide-character-visible").forEach((character) => {
            character.classList.remove("markdown-glitch-hide-character-visible");
        });
    };

    const handleDocumentPointerMove = (event) => {
        const isInsideHitbox = [...element.getClientRects()].some((bounds) => (
            event.clientX >= bounds.left
            && event.clientX <= bounds.right
            && event.clientY >= bounds.top
            && event.clientY <= bounds.bottom + hitboxBottomPadding
        ));

        if (isInsideHitbox) {
            handlePointerMove(event);
        } else {
            handlePointerLeave();
        }
    };

    document.addEventListener("pointermove", handleDocumentPointerMove);

    return () => {
        document.removeEventListener("pointermove", handleDocumentPointerMove);
        handlePointerLeave();
        replacements.forEach(({ characters, text }) => {
            const firstCharacter = characters[0];

            if (!firstCharacter?.parentNode) {
                return;
            }

            const replacement = document.createTextNode(text);
            firstCharacter.replaceWith(replacement);
            characters.slice(1).forEach((character) => character.remove());
        });
    };
}

export function initializeGlitches(root) {
    const effects = [];

    // Initialize outer hide effects first so nested distorted effects keep
    // updating the text nodes that remain attached to the document.
    root.querySelectorAll('[data-glitch="hide"]').forEach((element) => {
        effects.push(startHideEffect(element));
    });

    root.querySelectorAll('[data-glitch="distorted"]').forEach((element) => {
        effects.push(startDistortedEffect(element));
    });

    return () => effects.forEach((stopEffect) => stopEffect());
}