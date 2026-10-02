import { renderTooltips } from "./tooltip.js";
import { renderMarkdownFunctions } from "./subscripts/markdown-functions.js";

const markdownCache = new Map();
export async function loadMarkdown(fileUrl) {
    let markdown = markdownCache.get(fileUrl.href);

    if (markdown === undefined) {
        const response = await fetch(fileUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        markdown = await response.text();
        markdownCache.set(fileUrl.href, markdown);
    }

    const tooltipMarkdown = await renderTooltips(markdown);
    return renderMarkdownFunctions(tooltipMarkdown, fileUrl);
}

export function clearMarkdownCache() {
    markdownCache.clear();
}