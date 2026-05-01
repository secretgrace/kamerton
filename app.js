(function () {
  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const progress = document.getElementById("progress");
  const backToTop = document.querySelector("[data-back-to-top]");
  const slides = Array.from(document.querySelectorAll(".deck-slide"));
  const navLinks = Array.from(document.querySelectorAll(".slide-link"));
  const images = Array.from(document.querySelectorAll(".slide-frame img, .preview-card img"));

  let theme = "dark";
  root.setAttribute("data-theme", theme);

  function renderThemeButton() {
    if (!themeToggle) return;
    const isDark = theme === "dark";
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Переключить на светлый режим" : "Переключить на тёмный режим"
    );
    themeToggle.innerHTML = isDark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.8 6.8 0 0 0 21 12.8Z"/></svg>';
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", theme);
      renderThemeButton();
    });
  }
  renderThemeButton();

  images.forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const fallback = document.createElement("div");
        fallback.className = "img-fallback";
        fallback.setAttribute("role", "img");
        fallback.setAttribute("aria-label", img.alt || "Слайд временно недоступен");
        fallback.textContent = (img.alt || "Слайд") + " — файл изображения не найден.";
        img.replaceWith(fallback);
      },
      { once: true }
    );
  });

  function activateNav(id) {
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
    });
  }

  function updateActiveNav() {
    if (!slides.length) return;
    const center = window.innerHeight * 0.45;
    let best = slides[0];
    let bestDistance = Infinity;

    slides.forEach((slide) => {
      const rect = slide.getBoundingClientRect();
      const distance = Math.abs(rect.top - center);
      if (distance < bestDistance) {
        best = slide;
        bestDistance = distance;
      }
    });

    activateNav(best.id);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      activateNav(id);
      if (target) {
        target.scrollIntoView({ behavior: "auto", block: "start" });
        history.pushState(null, "", "#" + id);
      }
    });
  });

  function updateProgress() {
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
    const ratio = Math.min(1, Math.max(0, (window.scrollY || doc.scrollTop || 0) / max));

    if (progress) {
      progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    }

    if (backToTop) {
      backToTop.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.75);
    }

    updateActiveNav();
  }

  const revealObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) entry.target.classList.add("is-visible");
            });
          },
          { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
        )
      : null;

  slides.forEach((slide) => {
    if (revealObserver) revealObserver.observe(slide);
    else slide.classList.add("is-visible");
  });

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  window.addEventListener("load", updateProgress);
  updateProgress();

  const audio = document.getElementById("audio");
  const btnPlay = document.getElementById("btnPlay");
  const btnMute = document.getElementById("btnMute");
  const iconPlay = document.getElementById("iconPlay");
  const iconPause = document.getElementById("iconPause");
  const iconWaves = document.getElementById("iconWaves");
  const iconMuted = document.getElementById("iconMuted");
  const vol = document.getElementById("vol");
  const status = document.querySelector("[data-player-status]");

  let muted = false;
  let audioAvailable = false;

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function syncPlayIcon() {
    const playing = audio && !audio.paused && !audio.ended;
    if (iconPlay) iconPlay.style.display = playing ? "none" : "";
    if (iconPause) iconPause.style.display = playing ? "" : "none";
    if (btnPlay) btnPlay.setAttribute("aria-pressed", playing ? "true" : "false");
  }

  function syncMuteIcon() {
    if (iconWaves) iconWaves.style.display = muted ? "none" : "";
    if (iconMuted) iconMuted.style.display = muted ? "" : "inline";
    if (btnMute) btnMute.setAttribute("aria-pressed", muted ? "true" : "false");
  }

  if (audio) {
    audio.preload = "metadata";
    audio.volume = parseFloat(vol && vol.value ? vol.value : "0.55");

    const markAudioReady = () => {
      audioAvailable = true;
      setStatus("М. Ипполитов-Иванов · Симфония №1");
      if (btnPlay) btnPlay.disabled = false;
      syncPlayIcon();
    };

    const markAudioMissing = () => {
      audioAvailable = false;
      setStatus("Музыка ожидает файл symphony-preview.mp3");
      if (btnPlay) btnPlay.disabled = true;
      syncPlayIcon();
    };

    audio.addEventListener("loadedmetadata", markAudioReady);
    audio.addEventListener("canplay", markAudioReady);
    audio.addEventListener("canplaythrough", markAudioReady);
    audio.addEventListener("error", markAudioMissing);
    audio.addEventListener("play", syncPlayIcon);
    audio.addEventListener("pause", syncPlayIcon);
    audio.addEventListener("ended", syncPlayIcon);

    if (audio.readyState >= 1) {
      markAudioReady();
    } else {
      setTimeout(() => {
        if (audio.readyState >= 1) markAudioReady();
        else markAudioMissing();
      }, 1200);
      audio.load();
    }

    if (btnPlay) {
      btnPlay.addEventListener("click", async (event) => {
        event.preventDefault();

        if (!audioAvailable) {
          audio.load();
          setStatus("Пробуем загрузить музыку…");
          return;
        }

        if (audio.paused) {
          try {
            await audio.play();
            setStatus("М. Ипполитов-Иванов · Симфония №1");
          } catch (e) {
            setStatus("Нажмите ещё раз для запуска музыки");
          }
        } else {
          audio.pause();
        }

        syncPlayIcon();
      });
    }

    if (btnMute) {
      btnMute.addEventListener("click", (event) => {
        event.preventDefault();
        muted = !muted;
        audio.muted = muted;
        syncMuteIcon();
      });
    }

    if (vol) {
      vol.addEventListener("input", (event) => {
        const value = parseFloat(event.target.value);
        audio.volume = value;

        if (muted && value > 0) {
          muted = false;
          audio.muted = false;
          syncMuteIcon();
        }
      });
    }

    syncMuteIcon();
    syncPlayIcon();
  }
})();
