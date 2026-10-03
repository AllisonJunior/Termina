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
let stopBuggedAnimations = () => {};
let stopViewerBuggedAnimation = () => {};

function syncRedmistOverlay(viewer) {
    const image = viewer.querySelector(".image-viewer-image");
    const viewport = viewer.querySelector(".image-viewer-viewport");
    const overlay = viewer.querySelector(".image-viewer-redmist-overlay");

    if (!image || !viewport || !overlay) {
        return;
    }

    const imageBounds = image.getBoundingClientRect();
    const viewportBounds = viewport.getBoundingClientRect();
    overlay.style.left = `${imageBounds.left - viewportBounds.left}px`;
    overlay.style.top = `${imageBounds.top - viewportBounds.top}px`;
    overlay.style.width = `${imageBounds.width}px`;
    overlay.style.height = `${imageBounds.height}px`;
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function randomTransform() {
    const scaleX = Math.random() < 0.25 ? -1 : 1;
    const scaleY = Math.random() < 0.25 ? -1 : 1;
    const rotation = randomBetween(-2, 2).toFixed(2);

    return `translate(${randomBetween(-12, 12).toFixed(1)}px, ${randomBetween(-5, 5).toFixed(1)}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`;
}

function randomClipPath() {
    const type = Math.floor(randomBetween(0, 4));

    if (type === 0) {
        const top = randomBetween(0, 90);
        const height = randomBetween(2, 16);
        const bottom = Math.max(0, 100 - top - height);
        return `inset(${top.toFixed(1)}% 0 ${bottom.toFixed(1)}% 0)`;
    }

    if (type === 1) {
        const left = randomBetween(0, 90);
        const width = randomBetween(2, 18);
        const right = Math.max(0, 100 - left - width);
        return `inset(0 ${right.toFixed(1)}% 0 ${left.toFixed(1)}%)`;
    }

    if (type === 2) {
        const top = randomBetween(0, 82);
        const bottom = Math.max(0, 100 - top - randomBetween(5, 18));
        const left = randomBetween(0, 78);
        const right = Math.max(0, 100 - left - randomBetween(5, 22));
        return `inset(${top.toFixed(1)}% ${right.toFixed(1)}% ${bottom.toFixed(1)}% ${left.toFixed(1)}%)`;
    }

    const firstTop = randomBetween(0, 72);
    const firstHeight = randomBetween(2, 10);
    const secondTop = Math.min(94, firstTop + randomBetween(8, 25));
    const secondHeight = randomBetween(2, 10);

    return `polygon(
        0 ${firstTop.toFixed(1)}%,
        100% ${firstTop.toFixed(1)}%,
        100% ${(firstTop + firstHeight).toFixed(1)}%,
        0 ${(firstTop + firstHeight).toFixed(1)}%,
        0 ${secondTop.toFixed(1)}%,
        100% ${secondTop.toFixed(1)}%,
        100% ${Math.min(100, secondTop + secondHeight).toFixed(1)}%,
        0 ${Math.min(100, secondTop + secondHeight).toFixed(1)}%
    )`;
}

function randomGlitchFilter() {
    const hue = Math.floor(randomBetween(0, 360));
    const saturation = randomBetween(2, 8).toFixed(2);
    const contrast = randomBetween(1.4, 3).toFixed(2);

    return `hue-rotate(${hue}deg) saturate(${saturation}) contrast(${contrast})`;
}

function refreshViewerTransform(image) {
    const viewer = image.closest(".image-viewer");

    if (viewer) {
        applyTransform(viewer);
    }
}

function startBuggedImage(image) {
    const frame = image.closest(".markdown-image-frame, .image-viewer-viewport");
    const layers = [...frame.querySelectorAll(".markdown-image-glitch-layer")];
    const timers = [];
    let stopped = false;

    image.style.animation = "none";

    const scheduleLayer = (layer) => {
        const timer = setTimeout(() => {
            if (stopped) {
                return;
            }

            layer.style.opacity = randomBetween(0.45, 0.9).toFixed(2);
            layer.style.clipPath = randomClipPath();
            layer.style.filter = randomGlitchFilter();
            layer.style.transform = randomTransform();

            const duration = randomBetween(45, 320);
            const hideTimer = setTimeout(() => {
                layer.style.opacity = "0";
                scheduleLayer(layer);
            }, duration);

            timers.push(hideTimer);
        }, randomBetween(120, 1500));

        timers.push(timer);
    };

    const scheduleBase = () => {
        const timer = setTimeout(() => {
            if (stopped) {
                return;
            }

            image.style.filter = randomGlitchFilter();
            image.style.setProperty("--bugged-transform", randomTransform());
            refreshViewerTransform(image);

            const resetTimer = setTimeout(() => {
                image.style.filter = "";
                image.style.removeProperty("--bugged-transform");
                refreshViewerTransform(image);
                scheduleBase();
            }, randomBetween(50, 260));

            timers.push(resetTimer);
        }, randomBetween(500, 2600));

        timers.push(timer);
    };

    layers.forEach(scheduleLayer);
    scheduleBase();

    return () => {
        stopped = true;
        timers.forEach((timer) => clearTimeout(timer));
        image.style.filter = "";
        image.style.removeProperty("--bugged-transform");
        refreshViewerTransform(image);
        layers.forEach((layer) => {
            layer.style.opacity = "0";
            layer.style.clipPath = "";
            layer.style.filter = "";
            layer.style.transform = "";
        });
    };
}

function initializeBuggedAnimations(root) {
    const stops = [...root.querySelectorAll(".markdown-image-anim-bugged")]
        .map(startBuggedImage);

    return () => stops.forEach((stop) => stop());
}

function applyTransform(viewer) {
    const image = viewer.querySelector(".image-viewer-image");
    const resetButton = viewer.querySelector("[data-viewer-reset]");
    const buggedTransform = image.style.getPropertyValue("--bugged-transform");

    image.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${imageScale}) ${buggedTransform}`;
    resetButton.hidden = imageScale <= minZoom;
    syncRedmistOverlay(viewer);
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

    stopViewerBuggedAnimation();
    stopViewerBuggedAnimation = () => {};
    activeViewer.hidden = true;
    const viewport = activeViewer.querySelector(".image-viewer-viewport");
    viewport.querySelector(".image-viewer-image").removeAttribute("src");
    viewport.querySelectorAll(".image-viewer-glitch-layer").forEach((layer) => {
        layer.remove();
    });
    document.body.classList.remove("image-viewer-open");
    activeViewer = undefined;
    dragState = undefined;
}

function openViewer(sourceImage) {
    const viewer = activeViewer ?? createViewer();
    const image = viewer.querySelector(".image-viewer-image");
    const viewport = viewer.querySelector(".image-viewer-viewport");

    stopViewerBuggedAnimation();
    viewport.querySelectorAll(".image-viewer-glitch-layer").forEach((layer) => {
        layer.remove();
    });
    image.src = sourceImage.currentSrc || sourceImage.src;
    image.alt = sourceImage.alt;
    image.classList.toggle(
        "markdown-image-anim-bugged",
        sourceImage.classList.contains("markdown-image-anim-bugged")
    );
    const redmistEnabled = sourceImage.classList.contains("markdown-image-anim-redmist");
    viewport.querySelector(".image-viewer-redmist-overlay").hidden = !redmistEnabled;

    if (sourceImage.classList.contains("markdown-image-anim-bugged")) {
        for (let index = 0; index < 5; index++) {
            const layer = document.createElement("img");
            layer.className = "image-viewer-glitch-layer";
            layer.src = image.src;
            layer.alt = "";
            layer.setAttribute("aria-hidden", "true");
            viewport.appendChild(layer);
        }

        stopViewerBuggedAnimation = startBuggedImage(image);
    }

    resetTransform(viewer);
    viewer.hidden = false;
    activeViewer = viewer;
    document.body.classList.add("image-viewer-open");
    requestAnimationFrame(() => syncRedmistOverlay(viewer));
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
                <span class="image-viewer-redmist-overlay" aria-hidden="true" hidden></span>
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
    image.addEventListener("load", () => syncRedmistOverlay(viewer));
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
    let stopBuggedAnimations = () => {};

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

    const startBuggedAnimations = () => {
        stopBuggedAnimations();
        stopBuggedAnimations = initializeBuggedAnimations(root);
    };
    const observer = new MutationObserver(startBuggedAnimations);

    startBuggedAnimations();
    observer.observe(root, { childList: true, subtree: true });
    root.addEventListener("click", openImage);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
        root.removeEventListener("click", openImage);
        document.removeEventListener("keydown", handleKeyDown);
        observer.disconnect();
        stopBuggedAnimations();
        closeViewer();
        document.querySelector(".image-viewer")?.remove();
    };
}
