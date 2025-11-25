// Wait until the page is ready to run the code
document.addEventListener("DOMContentLoaded", function () {
  // Detect if device is mobile/tablet
  function isMobileOrTablet() {
    return window.innerWidth <= 1024;
  }

  // Generic function to handle window events (open/close/drag)
  function setupWindow(linkSelector, windowId) {
    const link = document.querySelector(linkSelector);
    const windowEl = document.getElementById(windowId);
    const closeButton = windowEl.querySelector(".close-button");

    // Open window
    link.addEventListener("click", function (e) {
      e.preventDefault();
      
      if (isMobileOrTablet()) {
        // Mobile/Tablet: slide up from bottom
        windowEl.classList.add("active");
        applyTypewriterEffect(windowId);
      } else {
        // Desktop: centered with drag
        windowEl.style.display = "block";
        const randomOffsetX = Math.floor(Math.random() * 61) - 30;
        const randomOffsetY = Math.floor(Math.random() * 61) - 30;
        windowEl.style.transform = `translate(calc(-50% + ${randomOffsetX}px), calc(-50% + ${randomOffsetY}px))`;
        applyTypewriterEffect(windowId);
      }
    });

    // Close window
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

  function bringToFront(windowBox) {
    const allWindows = document.querySelectorAll(".window-box");
    let maxZIndex = 0;
    allWindows.forEach((win) => {
      maxZIndex = Math.max(
        maxZIndex,
        parseInt(window.getComputedStyle(win).zIndex) || 0
      );
    });
    windowBox.style.zIndex = maxZIndex + 1;
  }

  /* helper: get current computed translation in pixels (robust against % transforms) */
  function getCurrentTranslation(el) {
    const style = window.getComputedStyle(el).transform;
    if (style && style !== "none") {
      try {
        const m = new DOMMatrix(style);
        if (Number.isFinite(m.m41) && Number.isFinite(m.m42)) {
          return {
            x: m.m41,
            y: m.m42,
          };
        }
      } catch (e) {
        // continue to fallback
      }
    }
    // Fallback: compute position relative to offsetParent
    const rect = el.getBoundingClientRect();
    const parentRect = el.offsetParent
      ? el.offsetParent.getBoundingClientRect()
      : {
          left: 0,
          top: 0,
        };
    return {
      x: rect.left - parentRect.left,
      y: rect.top - parentRect.top,
    };
  }

  /* safer draggable implementation */
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

      if (e.target === closeButton || closeButton.contains(e.target)) {
        return;
      }

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

  function applyTypewriterEffect(windowId) {
    const windowElement = document.getElementById(windowId);
    if (!windowElement) return;
    const contentElements = windowElement.querySelectorAll(
      ".window-content h2, .window-content h3, .window-content h4, .window-content p, .window-content a"
    );

    function measureTextHeight(el, fullText) {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const clone = document.createElement(el.tagName);
      clone.textContent = fullText;
      clone.style.position = "absolute";
      clone.style.visibility = "hidden";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = Math.max(0, rect.width) + "px";
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

  // Setup each window
  setupWindow('a[href="portfolio.html"]', "portfolioWindow");
  setupWindow('a[href="about.html"]', "aboutWindow");
  setupWindow('a[href="other.html"]', "artWindow");
  setupWindow('a[href="another.html"]', "anotherWindow");

  // Special setup for chicken window to handle game initialization
  const chickenLink = document.querySelector("#chickenButton");
  const chickenWindow = document.getElementById("chickenWindow");
  const chickenCloseButton = chickenWindow.querySelector(".close-button");

  chickenLink.addEventListener("click", function (e) {
    e.preventDefault();
    
    if (isMobileOrTablet()) {
      chickenWindow.classList.add("active");
    } else {
      chickenWindow.style.display = "block";
      const randomOffsetX = Math.floor(Math.random() * 61) - 30;
      const randomOffsetY = Math.floor(Math.random() * 61) - 30;
      chickenWindow.style.transform = `translate(calc(-50% + ${randomOffsetX}px), calc(-50% + ${randomOffsetY}px))`;
    }

    setTimeout(() => {
      if (window.startGame) {
        window.startGame("chickenGameContainer");
      }
    }, 100);
  });

  chickenCloseButton.addEventListener("click", () => {
    if (window.destroyGame) {
      window.destroyGame();
    }
    if (isMobileOrTablet()) {
      chickenWindow.classList.remove("active");
    } else {
      chickenWindow.style.display = "none";
    }
  });

  if (!isMobileOrTablet()) {
    makeWindowDraggable(chickenWindow);
  }

  // Add image viewer open/close and attach click listeners to gallery images
  (function setupImageViewer() {
    const viewer = document.getElementById("imageViewerWindow");
    if (!viewer) return;

    const closeBtn = viewer.querySelector(".close-button");
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

    const viewerImg = viewer.querySelector("#viewerImage");

    function openImageViewer(src, alt = "") {
      viewerImg.src = src;
      viewerImg.alt = alt;
      
      if (isMobileOrTablet()) {
        viewer.classList.add("active");
      } else {
        viewer.style.display = "block";
        viewer.style.transform = "translate(-50%, -50%)";
        bringToFront(viewer);
      }
    }

    const thumbs = document.querySelectorAll(
      ".gallery-image img, .portfolio-image img"
    );
    thumbs.forEach((img) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", (e) => {
        openImageViewer(e.currentTarget.src, e.currentTarget.alt || "");
      });
    });
  })();

  // Handle window resize to switch between mobile and desktop modes
  window.addEventListener("resize", () => {
    const allWindows = document.querySelectorAll(".window-box");
    allWindows.forEach((w) => {
      if (isMobileOrTablet()) {
        w.style.display = "";
        w.classList.remove("active");
      } else {
        w.classList.remove("active");
        w.style.display = "none";
      }
    });
  });
});
