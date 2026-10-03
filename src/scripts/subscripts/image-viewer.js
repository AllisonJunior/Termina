const zoomStep = 0.12;
const minZoom = 1;
const maxZoom = 5;

let activeViewer;
let imageScale = 1;
let offsetX = 0;
let offsetY = 0;
let dragState;
const activePointers = new Map();
let pinchState;

function applyTransform(viewer) {
    const image = viewer.querySelector(".image-viewer-image");
    const resetButton = viewer.querySelector("[data-viewer-reset]");

    image.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${imageScale})`;
    resetButton.hidden = imageScale <= minZoom;
}

function zoomAtPoint(viewer, clientX, clientY, nextScale) {
    const viewport = viewer.querySelector(".image-viewer-viewport");
    const bounds = viewport.getBoundingClientRect();
    const pointX = clientX - (bounds.left + bounds.width / 2);
    const pointY = clientY - (bounds.top + bounds.height / 2);
    const imagePointX = (pointX - offsetX) / imageScale;
    const imagePointY = (pointY - offsetY) / imageScale;

    offsetX = pointX - imagePointX * nextScale;
    offsetY = pointY - imagePointY * nextScale;
    imageScale = nextScale;

    if (imageScale === minZoom) {
        offsetX = 0;
        offsetY = 0;
    }

    applyTransform(viewer);
}

function resetTransform(viewer) {
    imageScale = minZoom;
    offsetX = 0;
    offsetY = 0;
    dragState = undefined;
    activePointers.clear();
    pinchState = undefined;
    viewer.querySelector(".image-viewer-image").classList.remove("is-dragging");
    applyTransform(viewer);
}

function getPointerPair() {
    return [...activePointers.values()].slice(0, 2);
}

function getPointerDistance(first, second) {
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

function getPointerMidpoint(first, second) {
    return {
        x: (first.clientX + second.clientX) / 2,
        y: (first.clientY + second.clientY) / 2
    };
}

function closeViewer() {
    if (!activeViewer) {
        return;
    }

    activeViewer.hidden = true;
    activeViewer.querySelector(".image-viewer-image").removeAttribute("src");
    document.body.classList.remove("image-viewer-open");
    activeViewer = undefined;
    dragState = undefined;
}

function openViewer(sourceImage) {
    const viewer = activeViewer ?? createViewer();
    const image = viewer.querySelector(".image-viewer-image");

    image.src = sourceImage.currentSrc || sourceImage.src;
    image.alt = sourceImage.alt;
    resetTransform(viewer);
    viewer.hidden = false;
    activeViewer = viewer;
    document.body.classList.add("image-viewer-open");
    viewer.querySelector("[data-viewer-close]").focus();
}

function createViewer() {
    const viewer = document.createElement("div");
    viewer.className = "image-viewer";
    viewer.hidden = true;
    viewer.innerHTML = `
        <div class="image-viewer-backdrop" data-viewer-close></div>
        <section class="image-viewer-card" role="dialog" aria-modal="true"
            aria-label="Visualização ampliada da imagem">
            <button class="image-viewer-reset" type="button" data-viewer-reset
                aria-label="Resetar zoom e posição" hidden>↺</button>
            <button class="image-viewer-close" type="button" data-viewer-close
                aria-label="Fechar visualização">×</button>
            <div class="image-viewer-viewport">
                <img class="image-viewer-image" src="" alt="">
            </div>
        </section>
    `;

    viewer.addEventListener("click", (event) => {
        if (event.target.closest("[data-viewer-close]")) {
            closeViewer();
            return;
        }

        if (event.target.closest("[data-viewer-reset]")) {
            resetTransform(viewer);
        }
    });

    viewer.querySelector(".image-viewer-viewport").addEventListener("wheel", (event) => {
        if (viewer.hidden) {
            return;
        }

        event.preventDefault();
        const nextScale = Math.min(
            maxZoom,
            Math.max(minZoom, imageScale + (event.deltaY < 0 ? zoomStep : -zoomStep))
        );

        zoomAtPoint(viewer, event.clientX, event.clientY, nextScale);
    }, { passive: false });

    const image = viewer.querySelector(".image-viewer-image");
    image.addEventListener("pointerdown", (event) => {
        if (viewer.hidden) {
            return;
        }

        event.preventDefault();
        activePointers.set(event.pointerId, {
            clientX: event.clientX,
            clientY: event.clientY
        });
        image.setPointerCapture(event.pointerId);

        if (activePointers.size === 2) {
            dragState = undefined;
            const [first, second] = getPointerPair();
            pinchState = {
                distance: getPointerDistance(first, second),
                scale: imageScale
            };
            image.classList.remove("is-dragging");
        } else if (imageScale > minZoom) {
            dragState = {
                startX: event.clientX - offsetX,
                startY: event.clientY - offsetY
            };
            image.classList.add("is-dragging");
        }
    });

    image.addEventListener("pointermove", (event) => {
        if (viewer.hidden || !activePointers.has(event.pointerId)) {
            return;
        }

        activePointers.set(event.pointerId, {
            clientX: event.clientX,
            clientY: event.clientY
        });

        if (activePointers.size >= 2 && pinchState) {
            const [first, second] = getPointerPair();
            const distance = getPointerDistance(first, second);
            const midpoint = getPointerMidpoint(first, second);
            const nextScale = Math.min(
                maxZoom,
                Math.max(minZoom, pinchState.scale * distance / pinchState.distance)
            );

            zoomAtPoint(viewer, midpoint.x, midpoint.y, nextScale);
        } else if (dragState) {
            offsetX = event.clientX - dragState.startX;
            offsetY = event.clientY - dragState.startY;
            applyTransform(viewer);
        }
    });

    const stopDragging = (event) => {
        activePointers.delete(event.pointerId);
        dragState = undefined;
        pinchState = undefined;
        image.classList.remove("is-dragging");

        if (image.hasPointerCapture(event.pointerId)) {
            image.releasePointerCapture(event.pointerId);
        }
    };

    image.addEventListener("pointerup", stopDragging);
    image.addEventListener("pointercancel", stopDragging);
    document.body.appendChild(viewer);
    return viewer;
}

export function initializeImageViewer(root) {
    const openImage = (event) => {
        const button = event.target.closest("[data-image-viewer]");

        if (!button || !root.contains(button)) {
            return;
        }

        openViewer(button.closest(".markdown-image-frame").querySelector("img"));
    };

    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            closeViewer();
        }
    };

    root.addEventListener("click", openImage);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
        root.removeEventListener("click", openImage);
        document.removeEventListener("keydown", handleKeyDown);
        closeViewer();
        document.querySelector(".image-viewer")?.remove();
    };
}
