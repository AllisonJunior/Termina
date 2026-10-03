const tracks = [
    {
        title: "Doplefy - What Was My Sin",
        source: new URL("../../res/audio/what was my sin.mp3", import.meta.url).href,
    },
];

const defaultVolume = 0.5;
const volumeStorageKey = "termina-music-volume";
const startWithMusic = false;

function getStoredVolume() {
    const storedVolume = Number.parseFloat(
        localStorage.getItem(volumeStorageKey) ?? ""
    );

    return Number.isFinite(storedVolume)
        ? Math.min(1, Math.max(0, storedVolume))
        : defaultVolume;
}

export function createMusicPlayer() {
    const player = document.createElement("aside");
    player.className = "music-player";
    player.innerHTML = `
        <button class="music-player__toggle" type="button"
                aria-expanded="false" aria-controls="music-player-panel"
                aria-label="Abrir trilha sonora">
            <span aria-hidden="true">♪</span>
        </button>
        <div class="music-player__panel" id="music-player-panel" hidden>
            <div class="music-player__heading">
                <span class="music-player__eyebrow">Trilha sonora</span>
                <strong class="music-player__title"></strong>
            </div>
            <label class="music-player__control">
                <span>Volume: <output class="music-player__volume-value"></output></span>
                <input class="music-player__volume" type="range"
                       min="0" max="1" step="0.01" aria-label="Volume da trilha sonora">
            </label>
            <button class="music-player__pause" type="button"></button>
            <audio class="music-player__audio" preload="metadata"></audio>
        </div>
    `;

    const toggle = player.querySelector(".music-player__toggle");
    const panel = player.querySelector(".music-player__panel");
    const pauseButton = player.querySelector(".music-player__pause");
    const volume = player.querySelector(".music-player__volume");
    const volumeValue = player.querySelector(".music-player__volume-value");
    const title = player.querySelector(".music-player__title");
    const audio = player.querySelector(".music-player__audio");
    let userPaused = false;

    volume.value = String(getStoredVolume());
    audio.volume = Number(volume.value);
    audio.src = tracks[0].source;

    function updatePauseButton() {
        const isPaused = audio.paused;
        pauseButton.textContent = isPaused ? "Tocar" : "Pausar";
        pauseButton.setAttribute(
            "aria-label",
            isPaused ? "Tocar trilha sonora" : "Pausar trilha sonora"
        );
        player.classList.toggle("music-player--paused", isPaused);
    }

    function updateVolumeValue() {
        volumeValue.textContent = `${Math.round(audio.volume * 100)}%`;
    }

    function updateTrackTitle() {
        title.textContent = tracks[0].title;
    }

    async function playAudio(isManual = false) {
        if (isManual) {
            userPaused = false;
        }

        try {
            await audio.play();
            userPaused = false;
        } catch (error) {
            if (error.name !== "NotAllowedError") {
                console.error("Não foi possível reproduzir a trilha sonora:", error);
            }
        } finally {
            updatePauseButton();
        }
    }

    toggle.addEventListener("click", () => {
        const isOpen = !panel.hidden;
        panel.hidden = isOpen;
        toggle.setAttribute("aria-expanded", String(!isOpen));
        toggle.setAttribute(
            "aria-label",
            isOpen ? "Abrir trilha sonora" : "Fechar trilha sonora"
        );

    });

    const closeOnOutsideClick = (event) => {
        if (panel.hidden || player.contains(event.target)) {
            return;
        }

        panel.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Abrir trilha sonora");
    };

    document.addEventListener("click", closeOnOutsideClick);
    pauseButton.addEventListener("click", () => {
        if (audio.paused) {
            playAudio(true);
        } else {
            audio.pause();
            userPaused = true;
            updatePauseButton();
        }
    });

    volume.addEventListener("input", () => {
        audio.volume = Number(volume.value);
        localStorage.setItem(volumeStorageKey, volume.value);
        updateVolumeValue();
    });

    audio.addEventListener("play", updatePauseButton);
    audio.addEventListener("pause", updatePauseButton);
    audio.addEventListener("ended", updatePauseButton);

    updateTrackTitle();
    updatePauseButton();
    updateVolumeValue();
    document.body.appendChild(player);
    if (startWithMusic && !userPaused) {
        playAudio();
    }

    return {
        setVisible(isVisible) {
            player.hidden = !isVisible;
        },
        cleanup() {
            document.removeEventListener("click", closeOnOutsideClick);
            audio.pause();
            player.remove();
        },
    };
}
