// Wait until the page is ready to run the code
document.addEventListener('DOMContentLoaded', function () {

    // Generic function to handle window events (open/close/drag)
    function setupWindow(linkSelector, windowId) {
        const link = document.querySelector(linkSelector);
        const windowEl = document.getElementById(windowId);
        const closeButton = windowEl.querySelector('.close-button');
        const windowHeader = windowEl.querySelector('.window-header');

        // Open window
        link.addEventListener('click', function (e) {
            e.preventDefault();
            windowEl.style.display = 'block';
            windowEl.style.transform = 'translate(-50%, -50%)'; // Center
            applyTypewriterEffect(windowId);
        });

        // Close window
        closeButton.addEventListener('click', () => {
            windowEl.style.display = 'none';
        });

        makeWindowDraggable(windowEl); // Make draggable
    }

    function bringToFront(windowBox) {
        const allWindows = document.querySelectorAll('.window-box');
        let maxZIndex = 0;
        allWindows.forEach(win => {
            maxZIndex = Math.max(maxZIndex, parseInt(window.getComputedStyle(win).zIndex) || 0);
        });
        windowBox.style.zIndex = maxZIndex + 1;
    }

    /* helper: get current computed translation in pixels (robust against % transforms) */
    function getCurrentTranslation(el) {
        const style = window.getComputedStyle(el).transform;
        if (style && style !== 'none') {
            try {
                const m = new DOMMatrix(style);
                if (Number.isFinite(m.m41) && Number.isFinite(m.m42)) {
                    return {
                        x: m.m41,
                        y: m.m42
                    };
                }
            } catch (e) {
                // continue to fallback
            }
        }
        // Fallback: compute position relative to offsetParent
        const rect = el.getBoundingClientRect();
        const parentRect = el.offsetParent ? el.offsetParent.getBoundingClientRect() : {
            left: 0,
            top: 0
        };
        return {
            x: rect.left - parentRect.left,
            y: rect.top - parentRect.top
        };
    }

    /* safer draggable implementation */
    function makeWindowDraggable(windowBox) {
        const header = windowBox.querySelector('.window-header');
        let initialX = 0,
            initialY = 0,
            xOffset = 0,
            yOffset = 0;
        let isDragging = false;

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            // only start when header (not internal controls) is used
            if (e.button !== 0) return; // left button only
            // bring to front immediately
            bringToFront(windowBox);

            // read current translation in pixels (robust)
            const t = getCurrentTranslation(windowBox);
            xOffset = t.x || 0;
            yOffset = t.y || 0;

            // compute initial mouse offset so element follows pointer without jumping
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            isDragging = true;
            document.body.classList.add('dragging');
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
            document.body.classList.remove('dragging');
        }
    }

    // REMOVE THE FOLLOWING FUNCTION IF IT IS NOT USED ELSEWHERE
    function applyTypewriterEffect(windowId) {
        const windowElement = document.getElementById(windowId);
        if (!windowElement) return;
        const contentElements = windowElement.querySelectorAll('.window-content h2, .window-content h3, .window-content h4, .window-content p, .window-content a');

        // helper: measure final height of text without affecting layout
        function measureTextHeight(el, fullText) {
            const style = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            const clone = document.createElement(el.tagName);
            clone.textContent = fullText;
            // make clone invisible and off-document flow
            clone.style.position = 'absolute';
            clone.style.visibility = 'hidden';
            clone.style.left = '-9999px';
            clone.style.top = '0';
            // ensure same width as original so wrapping matches
            clone.style.width = Math.max(0, rect.width) + 'px';
            // copy font/spacing/box properties that affect height/wrapping
            const props = ['font', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'wordSpacing', 'whiteSpace', 'wordBreak', 'wordWrap', 'boxSizing', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'];
            props.forEach(p => {
                try {
                    clone.style[p] = style[p];
                } catch (e) {}
            });
            document.body.appendChild(clone);
            const h = clone.getBoundingClientRect().height;
            document.body.removeChild(clone);
            return h;
        }

        contentElements.forEach(element => {
            const fullText = element.textContent || '';
            // precompute final height and lock min-height to that value so layout doesn't move
            const finalH = measureTextHeight(element, fullText);
            // preserve original display to not change layout unexpectedly
            const origDisplay = getComputedStyle(element).display || 'block';
            element.style.display = origDisplay === 'inline' ? 'inline-block' : origDisplay;
            element.style.whiteSpace = 'normal';
            element.style.minHeight = finalH + 'px';
            element.textContent = ''; // clear visible text

            // typewriter: reveal characters while reserved space prevents jumps
            let i = 0;
            (function step() {
                if (i <= fullText.length) {
                    element.textContent = fullText.slice(0, i++);
                    setTimeout(step, 30);
                } else {
                    // typing finished — keep layout stable, remove minHeight if you prefer auto behavior
                    // element.style.minHeight = ''; // optionally remove
                    element.style.display = origDisplay;
                }
            })();
        });
    }

    // Setup each window
    setupWindow('a[href="portfolio.html"]', 'portfolioWindow');
    setupWindow('a[href="about.html"]', 'aboutWindow');
    setupWindow('a[href="other.html"]', 'artWindow');
    setupWindow('a[href="another.html"]', 'anotherWindow');
    // FIX: Change '#chickenLauncher' to '#chickenButton' to match your HTML
    setupWindow('#chickenButton', 'chickenWindow');


    // Add image viewer open/close and attach click listeners to gallery images
    (function setupImageViewer() {
        const viewer = document.getElementById('imageViewerWindow');
        if (!viewer) return;

        // ensure draggable & close button work (makeWindowDraggable exists earlier)
        const closeBtn = viewer.querySelector('.close-button');
        closeBtn.addEventListener('click', () => viewer.style.display = 'none');
        makeWindowDraggable(viewer);

        const viewerImg = viewer.querySelector('#viewerImage');

        function openImageViewer(src, alt = '') {
            viewerImg.src = src;
            viewerImg.alt = alt;
            // show and center using same transform approach used elsewhere
            viewer.style.display = 'block';
            viewer.style.transform = 'translate(-50%, -50%)';
            bringToFront(viewer);
        }

        // attach to gallery images (art gallery and portfolio thumbnails)
        const thumbs = document.querySelectorAll('.gallery-image img, .portfolio-image img');
        thumbs.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', (e) => {
                openImageViewer(e.currentTarget.src, e.currentTarget.alt || '');
            });
        });
    })();
});