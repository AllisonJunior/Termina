import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

const colorMacros = {
    "!RED": "#ff0000",
    "!BLUE": "#0b0b66"
};
const alignmentMacros = {
    "!LEFT": "left",
    "!CENTER": "center",
    "!RIGHT": "right",
    "!JUSTIFY": "justify"
};
const glitchModes = {
    DISTORTED: "distorted"
};
const sizeAliases = {
    DEFAULT: "inherit"
};

const alignmentSyntax = /^align\((!(?:LEFT|CENTER|RIGHT|JUSTIFY))\)[ \t]*(?:\r?\n){1,2}/gim;
const imageResizeSyntax = /^(?:0|\d+(?:\.\d+)?(?:px|rem|em|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc|%))$/i;

function escapeHtmlAttribute(value) {
    return value.replace(/[&<>"']/g, (character) => {
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

function findClosingBrace(text, openingBraceIndex) {
    let depth = 1;

    for (let index = openingBraceIndex + 1; index < text.length; index++) {
        if (text[index] === "{") {
            depth++;
        }

        if (text[index] === "}") {
            depth--;

            if (depth === 0) {
                return index;
            }
        }
    }

    return -1;
}

function renderMacroContent(text) {
    const nestedMarkdown = renderMacroFunctions(text);
    const normalizedMarkdown = nestedMarkdown.trim().replace(/\r?\n|\r/g, "<br>");

    return marked.parseInline(normalizedMarkdown);
}

function renderMacroFunctions(markdown) {
    const macroPattern = /\b(?:c|align|glitch|size|img)\s*\(/gi;
    let result = "";
    let cursor = 0;
    let match;

    while ((match = macroPattern.exec(markdown)) !== null) {
        const macroName = match[0].slice(0, -1).trim().toLowerCase();
        const argumentStart = match.index + match[0].length;
        const argumentEnd = markdown.indexOf(")", argumentStart);

        if (argumentEnd === -1) {
            break;
        }

        let openingBraceIndex = argumentEnd + 1;

        while (/\s/.test(markdown[openingBraceIndex] ?? "")) {
            openingBraceIndex++;
        }

        if (markdown[openingBraceIndex] !== "{") {
            if (macroName === "img") {
                const argument = markdown.slice(argumentStart, argumentEnd);

                result += markdown.slice(cursor, match.index);
                result += renderMacro(macroName, argument, "");
                cursor = argumentEnd + 1;
                macroPattern.lastIndex = cursor;
            }

            continue;
        }

        const closingBraceIndex = findClosingBrace(markdown, openingBraceIndex);

        if (closingBraceIndex === -1) {
            break;
        }

        const argument = markdown.slice(argumentStart, argumentEnd);
        const content = markdown.slice(openingBraceIndex + 1, closingBraceIndex);
        const renderedContent = macroName === "img"
            ? content.trim()
            : renderMacroContent(content);

        result += markdown.slice(cursor, match.index);
        result += renderMacro(macroName, argument, renderedContent);
        cursor = closingBraceIndex + 1;
        macroPattern.lastIndex = cursor;
    }

    return result + markdown.slice(cursor);
}

function renderMacro(name, argument, content) {
    const normalizedArgument = argument.trim().toUpperCase();

    if (name === "c") {
        const color = normalizedArgument.startsWith("!")
            ? colorMacros[normalizedArgument]
            : normalizedArgument.match(/^#[\da-fA-F]{3,8}$/)?.[0];

        if (color) {
            return `<span style="color: ${color};">${content}</span>`;
        }
    }

    if (name === "align") {
        const alignment = alignmentMacros[normalizedArgument];

        if (alignment) {
            return `<span style="display: block; text-align: ${alignment};">${content}</span>`;
        }
    }

    if (name === "glitch") {
        const mode = glitchModes[normalizedArgument];

        if (mode) {
            return `<span class="markdown-glitch" data-glitch="${mode}">${content}</span>`;
        }
    }

    if (name === "size") {
        const size = sizeAliases[normalizedArgument]
            ?? normalizedArgument.match(/^(?:0|\d+(?:\.\d+)?(?:px|rem|em|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc|%))$/i)?.[0];

        if (size) {
            return `<span style="font-size: ${size};">${content}</span>`;
        }
    }

    if (name === "img") {
        const imageSource = argument.trim();

        if (!imageSource) {
            return `${name}(${argument}){${content}}`;
        }

        const styles = [];
        let enableZoom = false;
        const modifiers = content
            .split(";")
            .map((modifier) => modifier.trim())
            .filter(Boolean);

        for (const modifier of modifiers) {
            const separatorIndex = modifier.indexOf(":");

            if (separatorIndex === -1) {
                return `${name}(${argument}){${content}}`;
            }

            const modifierName = modifier.slice(0, separatorIndex).trim().toLowerCase();
            const modifierValue = modifier.slice(separatorIndex + 1).trim();

            if (modifierName === "resize" && imageResizeSyntax.test(modifierValue)) {
                styles.push(`width: ${modifierValue};`);
                continue;
            }

            if (modifierName === "zoom" && modifierValue.toLowerCase() === "yes") {
                enableZoom = true;
                continue;
            }

            return `${name}(${argument}){${content}}`;
        }

        const frameStyleAttribute = styles.length > 0
            ? ` style="${styles.join(" ")}"`
            : "";
        const zoomButton = enableZoom
            ? `<button class="markdown-image-maximize" type="button" data-image-viewer aria-label="Maximizar imagem" title="Maximizar imagem">⛶</button>`
            : "";

        return `<span class="markdown-image"><span class="markdown-image-frame"${frameStyleAttribute}>${zoomButton}<img src="${escapeHtmlAttribute(imageSource)}" alt=""></span></span>`;
    }

    return `${name}(${argument}){${content}}`;
}

function renderAlignedText(markdown) {
    const alignments = new Map();
    let markerIndex = 0;

    const markdownWithMarkers = markdown.replace(
        alignmentSyntax,
        (_, alignment) => {
            const marker = `ALIGNMENT_MARKER_${markerIndex++}`;
            alignments.set(marker, alignmentMacros[alignment.toUpperCase()]);
            return `${marker}\n`;
        }
    );

    return { markdown: markdownWithMarkers, alignments };
}

function applyAlignments(renderedMarkdown, alignments) {
    for (const [marker, alignment] of alignments) {
        const markerPattern = new RegExp(`<p>${marker}\\s*`, "g");
        renderedMarkdown = renderedMarkdown.replace(
            markerPattern,
            `<p style="text-align: ${alignment};">`
        );
    }

    return renderedMarkdown;
}

function resolveImageSources(renderedMarkdown, baseUrl) {
    if (!baseUrl || typeof document === "undefined") {
        return renderedMarkdown;
    }

    const container = document.createElement("div");
    container.innerHTML = renderedMarkdown;

    container.querySelectorAll("img[src]").forEach((image) => {
        const source = image.getAttribute("src");

        if (!source) {
            return;
        }

        image.setAttribute("src", new URL(source, baseUrl).href);
    });

    return container.innerHTML;
}

export function renderMarkdownFunctions(markdown, baseUrl) {
    const alignedMarkdown = renderAlignedText(renderMacroFunctions(markdown));
    const renderedMarkdown = marked.parse(alignedMarkdown.markdown);

    const alignedOutput = applyAlignments(renderedMarkdown, alignedMarkdown.alignments);
    return resolveImageSources(alignedOutput, baseUrl);
}