document.addEventListener("DOMContentLoaded", () => {

    // Cards now enter diagonally whenever they first come into view while
    // navigating down the page, not only after pressing carousel controls.
    function initSlantedCardEntrances() {
        const cards = document.querySelectorAll(".announcement-carousel, .about-slider-window, .topic-grid-card, .cpe-flip-card");
        if (!("IntersectionObserver" in window)) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting || entry.target.dataset.hasEntered) return;
                entry.target.dataset.hasEntered = "true";
                entry.target.animate([
                    { opacity: 0.12, transform: "translate(70px, 110px) rotate(8deg) scale(0.9)" },
                    { opacity: 1, transform: "translate(-12px, -16px) rotate(-1.8deg) scale(1.025)", offset: 0.7 },
                    { opacity: 1, transform: "translate(0, 0) rotate(0deg) scale(1)" }
                ], {
                    duration: 1000,
                    easing: "cubic-bezier(0.16, 1, 0.3, 1)"
                });
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.18 });

        cards.forEach(card => observer.observe(card));
    }

    // --- CAROUSEL ENGINE ---
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

            // The text carousel intentionally only slides horizontally.
            // Its text must stay still inside the card.
            if (windowId === "textCarouselWindow") return;

            // Give the other selected cards a tactile, diagonal lift.
            const activeSlide = trackEl.children[currentIndex];
            if (activeSlide) {
                activeSlide.classList.remove("slide-arriving");
                void activeSlide.offsetWidth; // restart the animation on repeat navigation
                activeSlide.classList.add("slide-arriving");

                // Web Animations runs directly on the selected slide, so the
                // motion remains visible even with the older !important paper rules.
                if (activeSlide.arrivalAnimation) activeSlide.arrivalAnimation.cancel();
                activeSlide.arrivalAnimation = activeSlide.animate([
                    { opacity: 0.1, transform: "translate(90px, 115px) rotate(9deg) scale(0.9)" },
                    { opacity: 1, transform: "translate(-14px, -18px) rotate(-2deg) scale(1.03)", offset: 0.68 },
                    { opacity: 1, transform: "translate(0, 0) rotate(0deg) scale(1)" }
                ], {
                    duration: 1050,
                    easing: "cubic-bezier(0.16, 1, 0.3, 1)"
                });

                // Remove the class after the motion ends, keeping the slide's
                // resting layout clean before the next navigation.
                window.setTimeout(() => activeSlide.classList.remove("slide-arriving"), 1050);
            }
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
    initSlantedCardEntrances();

    // --- NAVBAR TRIGGER HOVER ---
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

    // --- DYNAMIC DISCIPLINES MAPPING DATA ---
    const disciplineData = {
        embedded: {
            title: "Embedded Systems",
            subtitle: "Computers hidden inside everyday devices.",
            desc: "Specialized systems combining microcontrollers, firmware, and custom circuits to control appliances, medical equipment, and automotive electronics."
        },
        iot: {
            title: "Internet of Things",
            subtitle: "Connecting physical objects to global digital networks.",
            desc: "Networks of smart sensors, hardware nodes, and software tools that gather, exchange, and act on real-time environmental data."
        },
        networks: {
            title: "Computer Networks",
            subtitle: "The digital infrastructure powering global communication.",
            desc: "Designing protocols, routing architectures, and hardware connections that enable fast, reliable, and secure data transmission."
        },
        cybersecurity: {
            title: "Cybersecurity",
            subtitle: "Defending hardware, software, and network infrastructure.",
            desc: "Protecting digital assets against vulnerabilities, breaches, and cyber threats through encryption, firewalls, and secure hardware architecture."
        },
        software: {
            title: "Software Development",
            subtitle: "Building applications, tools, and system platforms.",
            desc: "Writing, testing, and optimizing code ranging from low-level drivers and operating systems to full-stack desktop and web applications."
        },
        ai: {
            title: "Artificial Intelligence",
            subtitle: "Giving hardware the ability to learn, reason, and adapt.",
            desc: "Implementing machine learning algorithms, computer vision, and neural networks directly on processing hardware for smart decision-making."
        },
        datascience: {
            title: "Data Science",
            subtitle: "Extracting actionable insights from complex datasets.",
            desc: "Processing massive streams of raw hardware and system data to discover patterns, optimize efficiency, and train predictive models."
        },
        robotics: {
            title: "Robotics & Automation",
            subtitle: "Systems engineered to interact with the physical world.",
            desc: "Integrating mechanical design, sensors, microcontrollers, and control software to create autonomous machines and industrial tools."
        },
        hardware: {
            title: "Computer Hardware",
            subtitle: "Designing the physical foundations of computing technology.",
            desc: "Developing microprocessors, circuit boards, logic gates, and memory architectures that drive high-performance processing equipment."
        },
        cloud: {
            title: "Cloud & Edge Computing",
            subtitle: "Distributed processing from local sensors to distant servers.",
            desc: "Managing computational workloads between edge-side hardware devices and remote server clusters to reduce latency and enhance scaling."
        }
    };

    // --- DISCIPLINES NAVIGATION LOGIC ---
    const allDiscLinks = document.querySelectorAll('.disc-link');
    const disciplineDefault = document.getElementById('disciplineDefault');
    const disciplineDynamic = document.getElementById('disciplineDynamic');

    if (allDiscLinks.length > 0) {
        allDiscLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const clickedLink = e.currentTarget;

                // Paper tactile click trigger
                clickedLink.classList.add('paper-wiggle');
                setTimeout(() => clickedLink.classList.remove('paper-wiggle'), 250);

                if (clickedLink.id === 'backToOverviewBtn') {
                    if (disciplineDynamic) disciplineDynamic.classList.remove('active');
                    if (disciplineDefault) disciplineDefault.classList.add('active');
                    allDiscLinks.forEach(l => l.classList.remove('active'));
                    return; 
                }

                allDiscLinks.forEach(l => l.classList.remove('active'));
                clickedLink.classList.add('active');

                if (disciplineDefault) disciplineDefault.classList.remove('active');
                if (disciplineDynamic) disciplineDynamic.classList.add('active');

                const targetKey = clickedLink.getAttribute('data-target');
                const content = disciplineData[targetKey];

                const dynTitle = document.getElementById('dynTitle');
                const dynSubtitle = document.getElementById('dynSubtitle');
                const dynDesc = document.getElementById('dynDesc');

                if (content) {
                    if (dynTitle) dynTitle.textContent = content.title;
                    if (dynSubtitle) dynSubtitle.textContent = content.subtitle;
                    if (dynDesc) dynDesc.textContent = content.desc;
                }
            });
        });
    }

    // --- ORGANIC JS PAPER BENDING ENGINE ---
    function initPaperBendingEngine() {
        const paperContainers = document.querySelectorAll('.info-card, .paper-container, .white-container');
        if (!paperContainers.length) return;

        let startTime = null;
        const duration = 2000; // 2-second cycle

        function renderFrame(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = (elapsed % duration) / duration; // Normalize to 0 -> 1

            // Mathematical sine wave math for continuous organic flexing
            const wave = Math.sin(progress * Math.PI * 2);
            const cosWave = Math.cos(progress * Math.PI * 2);

            // 3D paper tilt & bend calculations
            const rotateX = wave * 4.5;       // Tilts top/bottom forward & back
            const rotateY = cosWave * -3.5;    // Tilts left/right
            const translateY = wave * -4;      // Elevates center off the table

            // Soft paper corner curling (fakes pliability)
            const trCorner = 12 + wave * 10;   // Top-right corner flexes
            const blCorner = 10 + cosWave * 8; // Bottom-left corner flexes

            // Dynamic light wash & shadow offsets
            const shadowX = rotateY * 2.5;
            const shadowY = 14 + Math.abs(wave) * 6;
            const brightness = 1 + wave * 0.035;

            paperContainers.forEach(container => {
                container.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${translateY}px)`;
                container.style.borderRadius = `0px ${trCorner}px 0px ${blCorner}px`;
                container.style.boxShadow = `${shadowX}px ${shadowY}px 28px rgba(0, 0, 0, 0.15)`;
                container.style.filter = `brightness(${brightness})`;
            });

            requestAnimationFrame(renderFrame);
        }

        requestAnimationFrame(renderFrame);
    }

    // Initialize JS paper bending engine
    initPaperBendingEngine();
});
