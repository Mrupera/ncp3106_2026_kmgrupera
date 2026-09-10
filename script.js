document.addEventListener("DOMContentLoaded", () => {

    const navbar = document.querySelector(".navbar");
    const navTriggerZone = document.querySelector(".nav-trigger-zone");
    let hideTimeout;

    if (navbar && navTriggerZone) {
        function showNavbar() {
            clearTimeout(hideTimeout);
            navbar.classList.add("show");
            document.body.classList.add("nav-active");
        }

        function hideNavbar() {
            hideTimeout = setTimeout(() => {
                if (!navbar.matches(":hover") && !navTriggerZone.matches(":hover")) {
                    navbar.classList.remove("show");
                    document.body.classList.remove("nav-active");
                }
            }, 150);
        }

        navTriggerZone.addEventListener("mouseenter", showNavbar);
        navbar.addEventListener("mouseenter", showNavbar);

        navTriggerZone.addEventListener("mouseleave", hideNavbar);
        navbar.addEventListener("mouseleave", hideNavbar);
    }

    function setupDraggableCarousel({ windowEl, trackEl, slides, dots, intervalTime }) {
        if (!windowEl || !trackEl || !slides.length) return;

        let currentIndex = 0;
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        let dragOffset = 0;
        let timer = null;

        function updateSlide(index) {
            currentIndex = index;
            trackEl.style.transition = "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)";
            trackEl.style.transform = `translateX(-${currentIndex * 100}%)`;

            dots.forEach(dot => dot.classList.remove("active"));
            if (dots[currentIndex]) {
                dots[currentIndex].classList.add("active");
            }
        }

        function startAutoplay() {
            stopAutoplay();
            timer = setInterval(() => {
                let nextIndex = (currentIndex + 1) % slides.length;
                updateSlide(nextIndex);
            }, intervalTime);
        }

        function stopAutoplay() {
            if (timer) clearInterval(timer);
        }

        function getPosX(e) {
            return e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
        }

        function dragStart(e) {
            if (e.type === "mousedown" && !e.target.closest("a")) {
                e.preventDefault();
            }
            isDragging = true;
            startX = getPosX(e);
            dragOffset = 0;
            stopAutoplay();
            trackEl.style.transition = "none";
        }

        function dragMove(e) {
            if (!isDragging) return;
            currentX = getPosX(e);
            dragOffset = currentX - startX;
            
            const containerWidth = windowEl.clientWidth;
            const baseTranslation = -currentIndex * containerWidth;
            trackEl.style.transform = `translateX(${baseTranslation + dragOffset}px)`;
        }

        function dragEnd() {
            if (!isDragging) return;
            isDragging = false;

            const threshold = 40;
            if (dragOffset < -threshold) {
                currentIndex = (currentIndex + 1) % slides.length;
            } else if (dragOffset > threshold) {
                currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            }

            updateSlide(currentIndex);
            startAutoplay();
        }

        windowEl.addEventListener("touchstart", dragStart, { passive: true });
        windowEl.addEventListener("touchmove", dragMove, { passive: true });
        windowEl.addEventListener("touchend", dragEnd);

        windowEl.addEventListener("mousedown", dragStart);
        window.addEventListener("mousemove", dragMove);
        window.addEventListener("mouseup", dragEnd);

        dots.forEach((dot, index) => {
            dot.addEventListener("click", () => {
                stopAutoplay();
                updateSlide(index);
                startAutoplay();
            });
        });

        startAutoplay();
    }

    setupDraggableCarousel({
        windowEl: document.querySelector(".text-carousel-window"),
        trackEl: document.querySelector(".text-track"),
        slides: document.querySelectorAll(".text-slide"),
        dots: document.querySelectorAll(".text-dots .dot"),
        intervalTime: 5000
    });

    setupDraggableCarousel({
        windowEl: document.querySelector(".announcement-window"),
        trackEl: document.querySelector(".announcement-track"),
        slides: document.querySelectorAll(".announcement-image"),
        dots: document.querySelectorAll(".announcement-dots .dot"),
        intervalTime: 2500
    });

});