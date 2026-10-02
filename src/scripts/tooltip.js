const tooltipManifestUrl = new URL("../../bd/tooltip/index.json", import.meta.url);
const tooltipSyntax = /@\(([^()\r\n]+)\)|@([^\s@()[\]{}]+)/g;

let tooltipDatabasePromise;

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
        (source, groupedItem, simpleItem) => {
            const item = (groupedItem ?? simpleItem).trim();
            const description = tooltipDatabase[item];

            if (description === undefined) {
                return source;
            }

            return `
                <span class="markdown-tooltip" tabindex="0">
                    <span class="markdown-tooltip-label">${escapeHtml(item)}</span>
                    <span class="markdown-tooltip-content" role="tooltip">${escapeHtml(String(description))}</span>
                </span>
            `;
        }
    );
}

export function clearTooltipCache() {
    tooltipDatabasePromise = undefined;
}
