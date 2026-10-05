const zoomStep = 0.12;
const defaultZoom = 1;
const minZoom = 0.88;
const maxZoom = 5;

let activeViewer;
let imageScale = defaultZoom;
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
    const isDefaultTransform = imageScale === defaultZoom && offsetX === 0 && offsetY === 0;

    image.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${imageScale}) ${buggedTransform}`;
    resetButton.hidden = isDefaultTransform;
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

    applyTransform(viewer);
}

function resetTransform(viewer) {
    imageScale = defaultZoom;
    offsetX = 0;
    offsetY = 0;
    dragState = undefined;
    activePointers.clear();
    pinchState = undefined;
    viewer.querySelector(".image-viewer-image").classList.remove("is-dragging");
    applyTransform(viewer);
}

function changeCarouselImage(frame, direction) {
    if (!frame) {
        return;
    }

    let imageList;

    try {
        imageList = JSON.parse(frame.dataset.imageList);
    } catch (error) {
        console.error("Lista de imagens inválida:", error);
        return;
    }

    const image = frame.querySelector("img:not(.markdown-image-glitch-layer)");

    if (!image || !Array.isArray(imageList) || imageList.length < 2) {
        return;
    }

    const currentIndex = Number.parseInt(frame.dataset.imageIndex ?? "0", 10) || 0;
    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= imageList.length) {
        return;
    }

    if (frame.dataset.imageChanging === "true") {
        return;
    }

    const nextSource = imageList[nextIndex];
    const preload = new Image();
    frame.dataset.imageChanging = "true";
    setCarouselButtonsDisabled(frame, true);

    preload.addEventListener("load", () => {
        const currentHeight = frame.getBoundingClientRect().height;
        const frameWidth = frame.getBoundingClientRect().width;
        const nextHeight = frameWidth * preload.naturalHeight / preload.naturalWidth;
        let clearTimer;

        const clearHeight = () => {
            clearTimeout(clearTimer);
            frame.style.height = "";
            frame.classList.remove("is-changing-image");
            frame.removeAttribute("data-image-changing");
            frame.removeEventListener("transitionend", clearHeight);
            updateCarouselButtons(frame, nextIndex, imageList.length);
        };

        frame.style.height = `${currentHeight}px`;
        frame.classList.add("is-changing-image");
        image.style.opacity = "0";
        image.src = nextSource;
        frame.querySelectorAll(".markdown-image-glitch-layer").forEach((layer) => {
            layer.src = nextSource;
        });
        frame.dataset.imageIndex = String(nextIndex);

        requestAnimationFrame(() => {
            frame.addEventListener("transitionend", clearHeight);
            clearTimer = setTimeout(clearHeight, 350);
            frame.style.height = `${nextHeight}px`;
            requestAnimationFrame(() => {
                image.style.opacity = "1";
            });
        });
    }, { once: true });
    preload.addEventListener("error", () => {
        console.error(`Falha ao carregar a imagem da galeria: ${nextSource}`);
        frame.removeAttribute("data-image-changing");
        updateCarouselButtons(frame, currentIndex, imageList.length);
    }, { once: true });
    preload.src = nextSource;
}

function setCarouselButtonsDisabled(frame, disabled) {
    frame.querySelectorAll("[data-image-carousel]").forEach((button) => {
        button.disabled = disabled;
    });
}

function updateCarouselButtons(frame, currentIndex, imageCount) {
    const previousButton = frame.querySelector('[data-image-carousel="previous"]');
    const nextButton = frame.querySelector('[data-image-carousel="next"]');

    if (previousButton) {
        previousButton.disabled = currentIndex <= 0;
    }

    if (nextButton) {
        nextButton.disabled = currentIndex >= imageCount - 1;
    }
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

function clampZoom(scale) {
    return Math.min(maxZoom, Math.max(minZoom, scale));
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
    pinchState = undefined;
    activePointers.clear();
}

function updateViewerCarouselButtons(viewer, currentIndex, imageCount) {
    const navigation = viewer.querySelector(".image-viewer-navigation");
    const previousButton = viewer.querySelector('[data-viewer-carousel="previous"]');
    const nextButton = viewer.querySelector('[data-viewer-carousel="next"]');

    navigation.hidden = imageCount < 2;
    previousButton.disabled = currentIndex <= 0;
    nextButton.disabled = currentIndex >= imageCount - 1;
}

function changeViewerImage(viewer, direction) {
    const image = viewer.querySelector(".image-viewer-image");
    const imageList = JSON.parse(viewer.dataset.imageList || "[]");
    const currentIndex = Number.parseInt(viewer.dataset.imageIndex ?? "0", 10) || 0;
    const nextIndex = currentIndex + direction;

    if (!image || nextIndex < 0 || nextIndex >= imageList.length) {
        return;
    }

    image.src = imageList[nextIndex];
    viewer.dataset.imageIndex = String(nextIndex);
    viewer.querySelectorAll(".image-viewer-glitch-layer").forEach((layer) => {
        layer.src = imageList[nextIndex];
    });
    resetTransform(viewer);
    updateViewerCarouselButtons(viewer, nextIndex, imageList.length);
}

function openViewer(sourceImage) {
    const viewer = activeViewer ?? createViewer();
    const image = viewer.querySelector(".image-viewer-image");
    const viewport = viewer.querySelector(".image-viewer-viewport");
    const frame = sourceImage.closest(".markdown-image-frame");
    const imageList = frame?.dataset.imageList
        ? JSON.parse(frame.dataset.imageList)
        : [];
    const imageIndex = Number.parseInt(frame?.dataset.imageIndex ?? "0", 10) || 0;

    stopViewerBuggedAnimation();
    viewport.querySelectorAll(".image-viewer-glitch-layer").forEach((layer) => {
        layer.remove();
    });
    image.src = sourceImage.currentSrc || sourceImage.src;
    image.alt = sourceImage.alt;
    viewer.dataset.imageList = JSON.stringify(imageList);
    viewer.dataset.imageIndex = String(imageIndex);
    updateViewerCarouselButtons(viewer, imageIndex, imageList.length);
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
            <span class="image-viewer-navigation" aria-label="Navegação entre imagens" hidden>
                <button type="button" data-viewer-carousel="previous"
                    aria-label="Imagem anterior" title="Imagem anterior">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
                </button>
                <button type="button" data-viewer-carousel="next"
                    aria-label="Próxima imagem" title="Próxima imagem">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
                </button>
            </span>
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
            return;
        }

        const carouselButton = event.target.closest("[data-viewer-carousel]");

        if (carouselButton) {
            const direction = carouselButton.dataset.viewerCarousel === "next" ? 1 : -1;
            changeViewerImage(viewer, direction);
        }
    });

    viewer.querySelector(".image-viewer-viewport").addEventListener("wheel", (event) => {
        if (viewer.hidden) {
            return;
        }

        event.preventDefault();
        const nextScale = clampZoom(
            imageScale + (event.deltaY < 0 ? zoomStep : -zoomStep)
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
        } else if (imageScale !== defaultZoom) {
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
            if (pinchState.distance === 0) {
                return;
            }

            const nextScale = clampZoom(pinchState.scale * distance / pinchState.distance);

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
        image.classList.remove("is-dragging");

        if (image.hasPointerCapture(event.pointerId)) {
            image.releasePointerCapture(event.pointerId);
        }

        if (activePointers.size < 2) {
            pinchState = undefined;
        }

        const remainingPointer = getPointerPair()[0];

        if (activePointers.size === 1 && remainingPointer && imageScale !== defaultZoom) {
            dragState = {
                startX: remainingPointer.clientX - offsetX,
                startY: remainingPointer.clientY - offsetY
            };
            image.classList.add("is-dragging");
        }
    };

    image.addEventListener("pointerup", stopDragging);
    image.addEventListener("pointercancel", stopDragging);
    image.addEventListener("lostpointercapture", stopDragging);
    document.body.appendChild(viewer);
    return viewer;
}

export function initializeImageViewer(root) {
    let stopBuggedAnimations = () => {};

    const changeImage = (event) => {
        const button = event.target.closest("[data-image-carousel]");

        if (!button || !root.contains(button)) {
            return;
        }

        const direction = button.dataset.imageCarousel === "next" ? 1 : -1;
        changeCarouselImage(button.closest(".markdown-image-frame"), direction);
    };

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
    root.addEventListener("click", changeImage);
    root.addEventListener("click", openImage);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
        root.removeEventListener("click", changeImage);
        root.removeEventListener("click", openImage);
        document.removeEventListener("keydown", handleKeyDown);
        observer.disconnect();
        stopBuggedAnimations();
        closeViewer();
        document.querySelector(".image-viewer")?.remove();
    };
}
