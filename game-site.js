(() => {
  "use strict";
  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.querySelector("#site-menu");
  if (menuButton && menu) {
    const close = () => { menu.classList.remove("is-open"); menuButton.setAttribute("aria-expanded", "false"); menuButton.setAttribute("aria-label", "Open menu"); };
    menuButton.addEventListener("click", () => {
      const next = menuButton.getAttribute("aria-expanded") !== "true";
      menu.classList.toggle("is-open", next);
      menuButton.setAttribute("aria-expanded", String(next));
      menuButton.setAttribute("aria-label", next ? "Close menu" : "Open menu");
    });
    menu.querySelectorAll("a").forEach(link => link.addEventListener("click", close));
    document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
  }
  const heatBtn = document.querySelector("[data-heat-button]");
  const heatBall = document.querySelector("[data-demo-ball]");
  const heatLabel = document.querySelector("[data-heat-value]");
  const heatFill = document.querySelector("[data-heat-fill]");
  let heat = 35;
  if (heatBtn && heatLabel && heatFill && heatBall) {
    heatBtn.addEventListener("click", () => {
      heat = heat >= 95 ? 35 : Math.min(100, heat + 15);
      heatLabel.textContent = String(heat);
      heatFill.style.width = heat + "%";
      heatBall.classList.toggle("hotter", heat >= 65);
      heatBtn.textContent = heat >= 95 ? "↻ RESET" : "+ HEAT";
    });
  }
  // Assets are intentionally optional. If no path is configured, CSS artwork stays visible.
  // A broken or missing image also leaves its placeholder in place.
  const slots = [...document.querySelectorAll("[data-media-slot]")];
  if (slots.length) {
    fetch("./site-media.json", { cache: "no-store" })
      .then(response => { if (!response.ok) throw new Error("No media manifest"); return response.json(); })
      .then(manifest => {
        slots.forEach(slot => {
          const name = slot.getAttribute("data-media-slot");
          const src = manifest && manifest[name];
          if (typeof src !== "string" || !src.trim()) return;
          if (!/^(\/|\.\/|https:\/\/)/.test(src)) return;
          const img = new Image();
          img.className = "media-loaded";
          img.alt = slot.getAttribute("data-media-alt") || "";
          img.decoding = "async";
          // Detached lazy images may never load before the onload insertion below.
          img.loading = "eager";
          img.onload = () => { slot.appendChild(img); slot.classList.add("is-filled"); };
          img.src = src;
        });
      })
      .catch(() => { /* designed placeholders remain active */ });
  }
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
