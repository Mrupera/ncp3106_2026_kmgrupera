document.addEventListener("DOMContentLoaded", () => {

    function setupDraggableCarousel(windowId, trackId, dotsContainerId) {
        const windowEl = document.getElementById(windowId);
        const trackEl = document.getElementById(trackId);
        const dotsContainer = document.getElementById(dotsContainerId);

        if (!windowEl || !trackEl) return;

        const dots = dotsContainer ? dotsContainer.querySelectorAll(".dot") : [];
        const totalSlides = trackEl.children.length;

        let currentIndex = 0;
        let isDragging = false;
        let startPosX = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let animationId = 0;

        function setSliderPosition() {
            trackEl.style.transform = `translateX(${currentTranslate}px)`;
        }

        function updateDots() {
            dots.forEach((dot, idx) => {
                dot.classList.toggle("active", idx === currentIndex);
            });
        }

        function goToSlide(index) {
            currentIndex = Math.max(0, Math.min(index, totalSlides - 1));
            currentTranslate = -currentIndex * windowEl.clientWidth;
            prevTranslate = currentTranslate;
            trackEl.style.transition = "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)";
            setSliderPosition();
            updateDots();
        }

        function getPositionX(event) {
            return event.type.includes("mouse") ? event.clientX : event.touches[0].clientX;
        }

        function animation() {
            setSliderPosition();
            if (isDragging) requestAnimationFrame(animation);
        }

        function touchStart(event) {
            isDragging = true;
            startPosX = getPositionX(event);
            animationId = requestAnimationFrame(animation);
            trackEl.style.transition = "none";
        }

        function touchMove(event) {
            if (!isDragging) return;
            const currentPosition = getPositionX(event);
            const diff = currentPosition - startPosX;
            currentTranslate = prevTranslate + diff;
        }

        function touchEnd() {
            if (!isDragging) return;
            isDragging = false;
            cancelAnimationFrame(animationId);

            const movedBy = currentTranslate - prevTranslate;

            if (movedBy < -80 && currentIndex < totalSlides - 1) {
                currentIndex += 1;
            } else if (movedBy > 80 && currentIndex > 0) {
                currentIndex -= 1;
            }

            goToSlide(currentIndex);
        }

        windowEl.addEventListener("mousedown", touchStart);
        windowEl.addEventListener("mousemove", touchMove);
        windowEl.addEventListener("mouseup", touchEnd);
        windowEl.addEventListener("mouseleave", touchEnd);

        windowEl.addEventListener("touchstart", touchStart);
        windowEl.addEventListener("touchmove", touchMove);
        windowEl.addEventListener("touchend", touchEnd);

        dots.forEach((dot, index) => {
            dot.addEventListener("click", () => goToSlide(index));
        });

        window.addEventListener("resize", () => goToSlide(currentIndex));
    }

    setupDraggableCarousel("textCarouselWindow", "textCarouselTrack", "textDots");
    setupDraggableCarousel("announcementWindow", "announcementTrack", "announcementDots");
    setupDraggableCarousel("aboutSliderWindow", "aboutSliderTrack", "aboutDots");

    const navbar = document.getElementById("navbar");
    const triggerZone = document.querySelector(".nav-trigger-zone");

    if (triggerZone && navbar) {
        triggerZone.addEventListener("mouseenter", () => {
            navbar.classList.add("show");
            document.body.classList.add("nav-active");
        });

        navbar.addEventListener("mouseleave", () => {
            navbar.classList.remove("show");
            document.body.classList.remove("nav-active");
        });
    }

    // ==========================================
    // DISCIPLINES SIDEBAR & BACK BUTTON LOGIC
    // ==========================================
    const allDiscLinks = document.querySelectorAll('.disc-link');
    const disciplineDefault = document.getElementById('disciplineDefault');
    const disciplineDynamic = document.getElementById('disciplineDynamic');

    if (allDiscLinks.length > 0) {
        allDiscLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const clickedLink = e.currentTarget;

                // 1. Handle "BACK TO OVERVIEW" Button Click
                if (clickedLink.id === 'backToOverviewBtn') {
                    // Hide dynamic view, show default overview
                    if (disciplineDynamic) disciplineDynamic.classList.remove('active');
                    if (disciplineDefault) disciplineDefault.classList.add('active');
                    
                    // Remove active highlight from all links
                    allDiscLinks.forEach(l => l.classList.remove('active'));
                    return; // Stop further execution
                }

                // 2. Handle standard Discipline Link Click
                // Remove active class from all links
                allDiscLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to the clicked link
                clickedLink.classList.add('active');

                // Hide default overview, show dynamic content
                if (disciplineDefault) disciplineDefault.classList.remove('active');
                if (disciplineDynamic) disciplineDynamic.classList.add('active');

                // Update title dynamically based on the clicked link text
                const dynTitle = document.getElementById('dynTitle');
                if (dynTitle) dynTitle.textContent = clickedLink.textContent;
            });
        });
    }
});