// === Audio ===
function playCluck() {
  const sound = document.getElementById("CluckSound");
  sound.currentTime = 0;
  sound.play();
}

// === Main ===
document.addEventListener("DOMContentLoaded", function () {
  // === Layout Mode ===
  // Change these values to adjust breakpoints in one place
  const MOBILE_MAX = 480;
  const TABLET_MAX = 819;

  function getMode() {
    const w = window.innerWidth;
    if (w <= MOBILE_MAX) return "mobile";
    if (w <= TABLET_MAX) return "tablet";
    return "desktop";
  }

  function updateLayoutMode() {
    const mode = getMode();
    document.body.classList.remove("mobile", "tablet", "desktop");
    document.body.classList.add(mode);
  }

  function isMobileOrTablet() {
    return (
      document.body.classList.contains("mobile") ||
      document.body.classList.contains("tablet")
    );
  }

  // Set mode immediately on load
  updateLayoutMode();
  window.addEventListener("resize", () => {
    updateLayoutMode();
    // Reset all windows when switching modes
    document.querySelectorAll(".window-box").forEach((w) => {
      w.classList.remove("active");
      w.style.display = isMobileOrTablet() ? "" : "none";
    });
  });

  // === Window Management ===

  function setupWindow(linkSelector, windowId) {
    const link = document.querySelector(linkSelector);
    const windowEl = document.getElementById(windowId);
    const closeButton = windowEl.querySelector(".close-button");

    // Open
    link.addEventListener("click", function (e) {
      e.preventDefault();

      if (isMobileOrTablet()) {
        windowEl.style.display = "block";
        requestAnimationFrame(() =>
          requestAnimationFrame(() => windowEl.classList.add("active")),
        );
      } else {
        windowEl.style.display = "block";
        const randomOffsetX = Math.floor(Math.random() * 61) - 30;
        const randomOffsetY = Math.floor(Math.random() * 61) - 30;
        windowEl.style.transform = `translate(calc(-50% + ${randomOffsetX}px), calc(-50% + ${randomOffsetY}px))`;
        applyTypewriterEffect(windowId);
      }
    });

    // Close
    closeButton.addEventListener("click", () => {
      if (isMobileOrTablet()) {
        windowEl.classList.remove("active");
      } else {
        windowEl.style.display = "none";
      }
    });

    if (!isMobileOrTablet()) {
      makeWindowDraggable(windowEl);
    }
  }

  // Brings a window in front of all others
  function bringToFront(windowBox) {
    const allWindows = document.querySelectorAll(".window-box");
    let maxZIndex = 0;
    allWindows.forEach((win) => {
      maxZIndex = Math.max(
        maxZIndex,
        parseInt(window.getComputedStyle(win).zIndex) || 0,
      );
    });
    windowBox.style.zIndex = maxZIndex + 1;
  }

  // Gets the current CSS translate values of an element in pixels
  function getCurrentTranslation(el) {
    const style = window.getComputedStyle(el).transform;
    if (style && style !== "none") {
      try {
        const m = new DOMMatrix(style);
        if (Number.isFinite(m.m41) && Number.isFinite(m.m42)) {
          return { x: m.m41, y: m.m42 };
        }
      } catch (e) {}
    }
    const rect = el.getBoundingClientRect();
    const parentRect = el.offsetParent
      ? el.offsetParent.getBoundingClientRect()
      : { left: 0, top: 0 };
    return {
      x: rect.left - parentRect.left,
      y: rect.top - parentRect.top,
    };
  }

  // Makes a window draggable by its header bar
  function makeWindowDraggable(windowBox) {
    const header = windowBox.querySelector(".window-header");
    const closeButton = windowBox.querySelector(".close-button");
    let initialX = 0,
      initialY = 0,
      xOffset = 0,
      yOffset = 0;
    let isDragging = false;

    header.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);

    function dragStart(e) {
      if (e.button !== 0) return;
      if (e.target === closeButton || closeButton.contains(e.target)) return;
      bringToFront(windowBox);
      const t = getCurrentTranslation(windowBox);
      xOffset = t.x || 0;
      yOffset = t.y || 0;
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      isDragging = true;
      document.body.classList.add("dragging");
      e.preventDefault();
    }

    function drag(e) {
      if (!isDragging) return;
      e.preventDefault();
      xOffset = e.clientX - initialX;
      yOffset = e.clientY - initialY;
      windowBox.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    }

    function dragEnd() {
      if (!isDragging) return;
      isDragging = false;
      document.body.classList.remove("dragging");
    }
  }

  // === Typewriter Effect ===
  function applyTypewriterEffect(windowId) {
    const windowElement = document.getElementById(windowId);
    if (!windowElement) return;

    const contentElements = windowElement.querySelectorAll(
      ".window-content h2, .window-content h3, .window-content h4, .window-content p, .window-content a",
    );

    function measureTextHeight(el, fullText) {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const clone = document.createElement(el.tagName);
      clone.textContent = fullText;
      clone.style.cssText = `
        position: absolute; visibility: hidden;
        left: -9999px; top: 0;
        width: ${Math.max(0, rect.width)}px;
      `;
      const props = [
        "font",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "lineHeight",
        "letterSpacing",
        "wordSpacing",
        "whiteSpace",
        "wordBreak",
        "wordWrap",
        "boxSizing",
        "paddingLeft",
        "paddingRight",
        "paddingTop",
        "paddingBottom",
      ];
      props.forEach((p) => {
        try {
          clone.style[p] = style[p];
        } catch (e) {}
      });
      document.body.appendChild(clone);
      const h = clone.getBoundingClientRect().height;
      document.body.removeChild(clone);
      return h;
    }

    contentElements.forEach((element) => {
      const fullText = element.textContent || "";
      const finalH = measureTextHeight(element, fullText);
      const origDisplay = getComputedStyle(element).display || "block";
      element.style.display =
        origDisplay === "inline" ? "inline-block" : origDisplay;
      element.style.whiteSpace = "normal";
      element.style.minHeight = finalH + "px";
      element.textContent = "";
      let i = 0;
      (function step() {
        if (i <= fullText.length) {
          element.textContent = fullText.slice(0, i++);
          setTimeout(step, 30);
        } else {
          element.style.display = origDisplay;
        }
      })();
    });
  }

  // === Image Viewer ===
  (function setupImageViewer() {
    const viewer = document.getElementById("imageViewerWindow");
    if (!viewer) return;

    const closeBtn = viewer.querySelector(".close-button");
    const viewerImg = viewer.querySelector("#viewerImage");

    closeBtn.addEventListener("click", () => {
      if (isMobileOrTablet()) {
        viewer.classList.remove("active");
      } else {
        viewer.style.display = "none";
      }
    });

    if (!isMobileOrTablet()) {
      makeWindowDraggable(viewer);
    }

    function openImageViewer(src, alt = "") {
      viewerImg.src = src;
      viewerImg.alt = alt;
      if (isMobileOrTablet()) {
        viewer.style.display = "block";
        requestAnimationFrame(() =>
          requestAnimationFrame(() => viewer.classList.add("active")),
        );
      } else {
        viewer.style.display = "block";
        viewer.style.transform = "translate(-50%, -50%)";
        bringToFront(viewer);
      }
    }

    document
      .querySelectorAll(".gallery-image img, .portfolio-image img")
      .forEach((img) => {
        img.style.cursor = "zoom-in";
        img.addEventListener("click", (e) => {
          openImageViewer(e.currentTarget.src, e.currentTarget.alt || "");
        });
      });
  })();

  // === Init Windows ===
  setupWindow('a[href="portfolio.html"]', "portfolioWindow");
  setupWindow('a[href="about.html"]', "aboutWindow");
  setupWindow('a[href="other.html"]', "artWindow");
  setupWindow('a[href="another.html"]', "anotherWindow");
});
