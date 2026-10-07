const tooltipManifestUrl = new URL("../../bd/tooltip/index.json", import.meta.url);
const effectsDirectoryUrl = new URL("../../res/effects/", import.meta.url);
const tooltipSyntax = /@\{([^{}\r\n]+)\}|@\(([^()\r\n]+)\)|@([\p{L}\p{N}-]+)/gu;
const tooltipTypeColors = {
    negative: "#ff0000",
    positive: "#5793e2",
    resource: "#19c424"
};

let tooltipDatabasePromise;
let activeTooltipTarget;
let hoverSuppressedTarget;

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function normalizeTooltipKey(value) {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

function resolveTooltipEntry(database, item) {
    if (database[item] !== undefined) {
        return database[item];
    }

    const normalizedItem = normalizeTooltipKey(item);
    const matchingKey = Object.keys(database).find(
        (key) => normalizeTooltipKey(key) === normalizedItem
    );

    return matchingKey === undefined ? undefined : database[matchingKey];
}

function getTooltipDescription(entry) {
    return entry && typeof entry === "object" && !Array.isArray(entry)
        ? entry.desc ?? entry.description
        : entry;
}

function getTooltipType(entry) {
    const type = entry && typeof entry === "object" && !Array.isArray(entry)
        ? String(entry.type ?? "").trim().toLowerCase()
        : "";

    return Object.hasOwn(tooltipTypeColors, type) ? type : "neutral";
}

function getTooltipTitle(entry) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return undefined;
    }

    const title = String(entry.title ?? "").trim();
    return title || undefined;
}

function getEffectIconUrl(item, descriptionEntry) {
    if (descriptionEntry === undefined) {
        return undefined;
    }

    const iconName = descriptionEntry && typeof descriptionEntry === "object" && !Array.isArray(descriptionEntry)
        ? descriptionEntry.icon ?? item
        : item;
    return new URL(`${encodeURIComponent(iconName)}.png`, effectsDirectoryUrl).href;
}

async function fetchJson(fileUrl) {
    const response = await fetch(fileUrl, { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ao carregar ${fileUrl}`);
    }

    return response.json();
}

async function loadTooltipDatabase() {
    if (!tooltipDatabasePromise) {
        tooltipDatabasePromise = fetchJson(tooltipManifestUrl).then(async (manifest) => {
            const files = Array.isArray(manifest) ? manifest : manifest.files;

            if (!Array.isArray(files)) {
                throw new Error("O manifesto de tooltips deve conter uma lista de arquivos.");
            }

            const documents = await Promise.all(
                files.map((file) => fetchJson(new URL(file, tooltipManifestUrl)))
            );

            return documents.reduce((database, document) => {
                return Object.assign(database, document);
            }, {});
        });
    }

    return tooltipDatabasePromise;
}

export async function renderTooltips(markdown) {
    const tooltipDatabase = await loadTooltipDatabase();

    return markdown.replace(
        tooltipSyntax,
        (source, bracedItem, groupedItem, simpleItem) => {
            const item = (bracedItem ?? groupedItem ?? simpleItem).trim();
            const descriptionEntry = resolveTooltipEntry(tooltipDatabase, item);
            const description = getTooltipDescription(descriptionEntry);

            if (description === undefined) {
                return source;
            }

            const iconUrl = getEffectIconUrl(item, descriptionEntry);
            const tooltipType = getTooltipType(descriptionEntry);
            const tooltipTitle = getTooltipTitle(descriptionEntry);
            const tooltipColor = tooltipTypeColors[tooltipType] ?? "currentColor";
            const iconMarkup = iconUrl
                ? `<img class="markdown-tooltip-icon" src="${iconUrl}" alt="" aria-hidden="true" onerror="this.remove(); this.closest('.markdown-tooltip').style.removeProperty('--markdown-tooltip-color')">`
                : "";
            const headerText = tooltipTitle ?? item;

            return `<span class="markdown-tooltip markdown-tooltip-${tooltipType}" tabindex="0" style="--markdown-tooltip-color: ${tooltipColor};"><span class="markdown-tooltip-label">${iconMarkup}<span>${escapeHtml(item)}</span></span><span class="markdown-tooltip-content" role="tooltip"><span class="markdown-tooltip-header">${iconMarkup}<span>${escapeHtml(headerText)}</span></span><span class="markdown-tooltip-description">${escapeHtml(String(description))}</span></span></span>`;
        }
    );
}

function positionTooltip(target, content) {
    const gap = 2;
    const padding = 12;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const { width, height } = content.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    let left = targetRect.right + gap;
    let top = targetRect.bottom + gap;

    if (left + width > viewportWidth - padding) {
        left = targetRect.left - width - gap;
    }

    if (top + height > viewportHeight - padding) {
        top = targetRect.top - height - gap;
    }

    if (left + width > viewportWidth - padding) {
        left = viewportWidth - width - padding;
    }

    if (left < padding) {
        left = padding;
    }

    if (top + height > viewportHeight - padding) {
        top = viewportHeight - height - padding;
    }

    if (top < padding) {
        top = padding;
    }

    // A transformed ancestor becomes the containing block for fixed descendants.
    // Convert the viewport coordinates to that containing block's coordinates.
    const containingBlock = getFixedContainingBlock(content);

    if (containingBlock) {
        const containingBlockRect = containingBlock.getBoundingClientRect();
        left -= containingBlockRect.left;
        top -= containingBlockRect.top;
    }

    content.style.left = `${left}px`;
    content.style.top = `${top}px`;
    content.classList.add("is-positioned");
}

function getFixedContainingBlock(element) {
    let ancestor = element.parentElement;

    while (ancestor) {
        const styles = getComputedStyle(ancestor);
        const establishesContainingBlock = styles.transform !== "none"
            || styles.willChange.split(",").some((property) => property.trim() === "transform");

        if (establishesContainingBlock) {
            return ancestor;
        }

        ancestor = ancestor.parentElement;
    }

    return undefined;
}

function getTooltipTarget(event) {
    if (activeTooltipTarget && !activeTooltipTarget.isConnected) {
        deactivateTooltip();
    }

    return event.target instanceof Element
        ? event.target.closest(".markdown-tooltip")
        : null;
}

function deactivateTooltip(suppressHover = false) {
    if (!activeTooltipTarget) {
        return;
    }

    if (suppressHover) {
        hoverSuppressedTarget = activeTooltipTarget;
        hoverSuppressedTarget.classList.add("is-hover-suppressed");
    }

    activeTooltipTarget.classList.remove("is-active");
    const content = activeTooltipTarget.querySelector(".markdown-tooltip-content");
    content?.classList.remove("is-positioned");

    if (content) {
        content.scrollTop = 0;
    }

    activeTooltipTarget = undefined;
    document.documentElement.classList.remove("has-active-tooltip");
}

function activateTooltip(target) {
    if (hoverSuppressedTarget === target) {
        hoverSuppressedTarget.classList.remove("is-hover-suppressed");
        hoverSuppressedTarget = undefined;
    }

    if (activeTooltipTarget && activeTooltipTarget !== target) {
        deactivateTooltip();
    }

    activeTooltipTarget = target;
    target.classList.add("is-active");
    document.documentElement.classList.add("has-active-tooltip");

    const content = target.querySelector(".markdown-tooltip-content");

    if (content) {
        content.scrollTop = 0;
        requestAnimationFrame(() => {
            if (activeTooltipTarget === target) {
                positionTooltip(target, content);
            }
        });
    }
}

function handleTooltipScroll(event) {
    const content = activeTooltipTarget?.querySelector(".markdown-tooltip-content");

    if (content && event.target instanceof Node && content.contains(event.target)) {
        return;
    }

    deactivateTooltip(true);
}

function handleTooltipWheel(event) {
    const content = activeTooltipTarget?.querySelector(".markdown-tooltip-content");

    if (content && event.target instanceof Node && content.contains(event.target)) {
        return;
    }

    deactivateTooltip(true);
}

function getHoveredTooltipContent(event) {
    const target = getTooltipTarget(event);

    if (
        !target
        || !target.matches(":hover")
        || (activeTooltipTarget && activeTooltipTarget !== target)
    ) {
        return undefined;
    }

    const content = target.querySelector(".markdown-tooltip-content");

    return content && content.scrollHeight > content.clientHeight
        ? content
        : undefined;
}

function handleTooltipHoverWheel(event) {
    const content = getHoveredTooltipContent(event);

    if (!content) {
        handleTooltipWheel(event);
        return;
    }

    event.preventDefault();
    content.scrollTop += event.deltaY;
}

function handleWindowScroll() {
    deactivateTooltip(true);
}

function handleWindowBlur() {
    document.documentElement.classList.add("tooltip-window-blurred");
    deactivateTooltip(true);
}

function handleWindowFocus() {
    document.documentElement.classList.remove("tooltip-window-blurred");
}

function initializeTooltipPositioning() {
    document.addEventListener("pointerover", (event) => {
        const target = getTooltipTarget(event);

        if (
            target
            && target === hoverSuppressedTarget
            && !target.contains(event.relatedTarget)
        ) {
            target.classList.remove("is-hover-suppressed");
            hoverSuppressedTarget = undefined;
        }

        if (
            target
            && !target.contains(event.relatedTarget)
            && target !== activeTooltipTarget
            && target !== hoverSuppressedTarget
        ) {
            const content = target.querySelector(".markdown-tooltip-content");

            if (content) {
                content.scrollTop = 0;
            }
        }

        if (
            !target
            || target === activeTooltipTarget
            || (activeTooltipTarget && target !== activeTooltipTarget)
            || target.contains(event.relatedTarget)
        ) {
            return;
        }

        const content = target.querySelector(".markdown-tooltip-content");

        if (content) {
            content.classList.remove("is-positioned");
            requestAnimationFrame(() => {
                if (target.matches(":hover") || target === document.activeElement) {
                    positionTooltip(target, content);
                }
            });
        }
    });

    document.addEventListener("pointermove", (event) => {
        const target = getTooltipTarget(event);
        const content = target?.querySelector(".markdown-tooltip-content");

        if (target && content && (!activeTooltipTarget || activeTooltipTarget === target)) {
            positionTooltip(target, content);
        }
    });

    document.addEventListener("pointerout", (event) => {
        const target = getTooltipTarget(event);

        if (
            target
            && target === hoverSuppressedTarget
            && !target.contains(event.relatedTarget)
        ) {
            target.classList.remove("is-hover-suppressed");
            hoverSuppressedTarget = undefined;
        }

    });

    document.addEventListener("focusin", (event) => {
        const target = getTooltipTarget(event);
        const content = target?.querySelector(".markdown-tooltip-content");

        if (target && content && (!activeTooltipTarget || activeTooltipTarget === target)) {
            content.classList.remove("is-positioned");
            requestAnimationFrame(() => {
                positionTooltip(target, content);
            });
        }
    });

    document.addEventListener("click", (event) => {
        const target = getTooltipTarget(event);

        if (target) {
            activateTooltip(target);
            return;
        }

        deactivateTooltip();
    });

    document.addEventListener("scroll", handleTooltipScroll, true);
    document.addEventListener("wheel", handleTooltipHoverWheel, { capture: true, passive: false });
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
}

initializeTooltipPositioning();

export function clearTooltipCache() {
    tooltipDatabasePromise = undefined;
}
