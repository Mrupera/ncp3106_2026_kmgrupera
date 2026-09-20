document.addEventListener("DOMContentLoaded", () => {
    /* ==========================================
       1. NAVBAR HOVER / TRIGGER ZONE
       ========================================== */
    const navbar = document.getElementById("navbar");

    if (navbar) {
        navbar.addEventListener("mouseenter", () => {
            navbar.classList.add("show");
        });

        navbar.addEventListener("mouseleave", () => {
            navbar.classList.remove("show");
        });

        window.addEventListener("mousemove", (e) => {
            if (e.clientY <= 60) {
                navbar.classList.add("show");
            } else if (!navbar.matches(":hover")) {
                navbar.classList.remove("show");
            }
        });
    }

    /* ==========================================
       2. CAROUSEL ENGINE (FIXED BUGS & MOBILE SWIPE)
       ========================================== */
    function setupCarousel(windowId, trackId, dotsId, autoPlayMs = 5000) {
        const windowEl = document.getElementById(windowId);
        const trackEl = document.getElementById(trackId);
        const dotsContainer = document.getElementById(dotsId);

        if (!windowEl || !trackEl) return;

        const slides = Array.from(trackEl.children);
        if (slides.length === 0) return;

        let currentIndex = 0;
        let timer = null;

        // Drag & Touch Variables
        let isDragging = false;
        let startX = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let animationId = null;

        function updateCarousel(index) {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;
            currentIndex = index;

            const slideWidth = windowEl.clientWidth;
            currentTranslate = -currentIndex * slideWidth;
            prevTranslate = currentTranslate;

            trackEl.style.transition = "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)";
            trackEl.style.transform = `translateX(-${currentIndex * 100}%)`;

            if (dotsContainer) {
                const dots = Array.from(dotsContainer.children);
                dots.forEach((dot, idx) => {
                    dot.classList.toggle("active", idx === currentIndex);
                });
            }
        }

        if (dotsContainer) {
            const dots = Array.from(dotsContainer.children);
            dots.forEach((dot, idx) => {
                dot.addEventListener("click", () => {
                    updateCarousel(idx);
                    resetTimer();
                });
            });
        }

        function startTimer() {
            if (autoPlayMs && !timer) {
                timer = setInterval(() => updateCarousel(currentIndex + 1), autoPlayMs);
            }
        }

        function resetTimer() {
            clearInterval(timer);
            timer = null;
            startTimer();
        }

        // --- DRAG / TOUCH EVENTS ---
        windowEl.style.cursor = "grab";

        windowEl.addEventListener("mousedown", dragStart);
        windowEl.addEventListener("mouseup", dragEnd);
        windowEl.addEventListener("mouseleave", dragEnd);
        windowEl.addEventListener("mousemove", dragAction);

        // Passive: false upang maiwasan ang scrolling issues habang nagso-swipe sa mobile
        windowEl.addEventListener("touchstart", dragStart, { passive: true });
        windowEl.addEventListener("touchend", dragEnd);
        windowEl.addEventListener("touchmove", dragAction, { passive: true });

        function dragStart(e) {
            isDragging = true;
            startX = getPositionX(e);
            windowEl.style.cursor = "grabbing";
            trackEl.style.transition = "none";
            clearInterval(timer);
            timer = null;
            animationId = requestAnimationFrame(animation);
        }

        function dragAction(e) {
            if (!isDragging) return;
            const currentPosition = getPositionX(e);
            const diff = currentPosition - startX;
            currentTranslate = prevTranslate + diff;
        }

        function dragEnd() {
            if (!isDragging) return;
            isDragging = false;
            cancelAnimationFrame(animationId);
            windowEl.style.cursor = "grab";

            const movedBy = currentTranslate - prevTranslate;

            if (movedBy < -50 && currentIndex < slides.length - 1) {
                currentIndex += 1;
            } else if (movedBy > 50 && currentIndex > 0) {
                currentIndex -= 1;
            }

            updateCarousel(currentIndex);
            startTimer();
        }

        function getPositionX(e) {
            return e.type.includes("touch") ? (e.touches[0] ? e.touches[0].clientX : 0) : e.clientX;
        }

        function animation() {
            if (isDragging) {
                trackEl.style.transform = `translateX(${currentTranslate}px)`;
                requestAnimationFrame(animation);
            }
        }

        // Prevent layout break on screen resize
        window.addEventListener("resize", () => updateCarousel(currentIndex));

        // Initialize
        updateCarousel(0);
        startTimer();
    }

    // Attach Carousels
    setupCarousel("textCarouselWindow", "textCarouselTrack", "textDots", 6000);
    setupCarousel("announcementWindow", "announcementTrack", "announcementDots", 4000);
    setupCarousel("aboutSliderWindow", "aboutSliderTrack", "aboutDots", 7000);

    /* ==========================================
       3. EXCLUSIVE DISCIPLINES SIDEBAR TOGGLE & CONTENT SWITCH
       ========================================== */
    const disciplinesSec = document.getElementById("disciplines");
    const sidebar = document.getElementById("disciplinesSidebar");

    if (disciplinesSec) {
        let triggerZone = disciplinesSec.querySelector(".disciplines-trigger-zone");
        if (!triggerZone) {
            triggerZone = document.createElement("div");
            triggerZone.className = "disciplines-trigger-zone";
            disciplinesSec.appendChild(triggerZone);
        }

        if (triggerZone && sidebar) {
            triggerZone.addEventListener("mouseenter", () => {
                sidebar.classList.add("show-sidebar");
            });

            sidebar.addEventListener("mouseleave", () => {
                sidebar.classList.remove("show-sidebar");
            });
        }
    }

    // Dynamic Data for Disciplines
    const disciplineData = {
        embedded: {
            title: "EMBEDDED SYSTEMS",
            subtitle: "Computers hidden inside everyday devices.",
            desc: "Embedded systems combine hardware processors and microcontrollers with custom software to run specialized real-time operations in automotive, medical, and consumer electronics."
        },
        iot: {
            title: "INTERNET OF THINGS (IoT)",
            subtitle: "Connecting physical objects to the digital world.",
            desc: "IoT integrates embedded hardware, microcontrollers, wireless sensors, and cloud systems to collect and exchange real-time data across smart networks."
        },
        networks: {
            title: "COMPUTER NETWORKS",
            subtitle: "The infrastructure behind global communication.",
            desc: "Computer networks focus on designing, deploying, and maintaining secure data transmission protocols, router configurations, and enterprise network infrastructure."
        },
        cybersecurity: {
            title: "CYBERSECURITY",
            subtitle: "Defending systems and networks from digital threats.",
            desc: "Cybersecurity protects hardware, software, and communication channels against unauthorized access, data breaches, and malicious digital attacks."
        },
        software: {
            title: "SOFTWARE DEVELOPMENT",
            subtitle: "Crafting applications, logic, and system tools.",
            desc: "Software development encompasses system software, firmware, algorithms, and application logic that bridge raw hardware capabilities with human interaction."
        },
        ai: {
            title: "ARTIFICIAL INTELLIGENCE",
            subtitle: "Empowering machines to learn and reason.",
            desc: "AI in computer engineering focuses on machine learning, neural networks, computer vision, and hardware accelerators designed to process intelligent algorithms."
        },
        datascience: {
            title: "DATA SCIENCE",
            subtitle: "Extracting insight from massive datasets.",
            desc: "Data Science leverages computational models, statistical analytics, and distributed computing frameworks to process and interpret massive streams of information."
        },
        robotics: {
            title: "ROBOTICS & AUTOMATION",
            subtitle: "Merging mechanical design with autonomous code.",
            desc: "Robotics combines sensor integration, motor control, kinematics, and real-time computation to construct autonomous machines and industrial automation systems."
        },
        hardware: {
            title: "COMPUTER HARDWARE",
            subtitle: "Designing physical circuits, chips, and microprocessors.",
            desc: "Hardware engineering focuses on VLSI chip design, printed circuit board (PCB) layout, microarchitecture, logic gates, and physical component testing."
        },
        cloud: {
            title: "CLOUD & EDGE COMPUTING",
            subtitle: "Distributing computation across local and global nodes.",
            desc: "Cloud & Edge Computing pairs high-capacity remote servers with low-latency local processors to deliver efficient, scalable computing resources anywhere."
        }
    };

    const discLinks = document.querySelectorAll(".disc-link");
    const defaultView = document.getElementById("disciplineDefault");
    const dynamicView = document.getElementById("disciplineDynamic");
    const dynTitle = document.getElementById("dynTitle");
    const dynSubtitle = document.getElementById("dynSubtitle");
    const dynDesc = document.getElementById("dynDesc");
    const backBtn = document.getElementById("backToOverviewBtn");

    discLinks.forEach((link) => {
        link.addEventListener("click", function () {
            const target = this.getAttribute("data-target");

            discLinks.forEach((l) => l.classList.remove("active"));
            this.classList.add("active");

            if (target === "default") {
                if (dynamicView) dynamicView.classList.remove("active");
                if (defaultView) defaultView.classList.add("active");
            } else if (disciplineData[target]) {
                const info = disciplineData[target];
                if (dynTitle) dynTitle.textContent = info.title;
                if (dynSubtitle) dynSubtitle.textContent = info.subtitle;
                if (dynDesc) dynDesc.textContent = info.desc;

                if (defaultView) defaultView.classList.remove("active");
                if (dynamicView) dynamicView.classList.add("active");
            }
        });
    });

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            const defaultBtn = document.querySelector('.disc-link[data-target="default"]');
            if (defaultBtn) defaultBtn.click();
        });
    }

    /* ==========================================
       4. INTERACTIVE "ENGINEERED FOR EXCELLENCE" TABS
       ========================================== */
    const engData = {
        software: {
            title: "SOFTWARE & SYSTEMS",
            desc: "Software and systems engineering roles focus on designing, building, and integrating complex technological solutions. Software engineers develop applications and operating systems that drive user experiences.",
            tags: ["#SoftwareDev", "#DevOps", "#SystemsArchitecture", "#Scalability"],
            img1: "Assets/SH.jpg",
            img2: "Assets/ue.jpg"
        },
        hardware: {
            title: "HARDWARE & EMBEDDED",
            desc: "Hardware specialists design microprocessors, circuit boards, and embedded systems powering devices from microcontrollers to industrial automation.",
            tags: ["#ChipDesign", "#EmbeddedC", "#PCBLayout", "#VHDL"],
            img1: "Assets/BSCPE.jpg",
            img2: "Assets/admissions.jpg"
        },
        ai: {
            title: "AI DATA & ROBOTICS",
            desc: "Engineers in AI and robotics develop intelligent algorithms, autonomous systems, and data pipelines that learn from real-world sensor inputs.",
            tags: ["#MachineLearning", "#Robotics", "#ComputerVision", "#DataScience"],
            img1: "Assets/Scholarships.jpg",
            img2: "Assets/cpetext.png"
        },
        networks: {
            title: "NETWORKS & SECURITY",
            desc: "Network and security engineers protect critical infrastructure, design high-speed communication channels, and secure cloud ecosystems.",
            tags: ["#Cybersecurity", "#CloudArch", "#NetworkEng", "#Protocols"],
            img1: "Assets/hw-sw-diagram.png",
            img2: "Assets/logo.png"
        },
        research: {
            title: "RESEARCH & INNOVATION",
            desc: "Research engineers explore emergent computing paradigms, advanced materials, novel quantum hardware, and next-generation system architectures.",
            tags: ["#RND", "#Innovation", "#QuantumComputing", "#EmergingTech"],
            img1: "Assets/SH.jpg",
            img2: "Assets/BSCPE.jpg"
        }
    };

    const engTabs = document.querySelectorAll(".eng-tab-btn");
    const engTitle = document.getElementById("engTitle");
    const engDescription = document.getElementById("engDescription");
    const engTags = document.getElementById("engTags");
    const engImg1 = document.getElementById("engImg1");
    const engImg2 = document.getElementById("engImg2");

    engTabs.forEach((tab) => {
        tab.addEventListener("click", function () {
            const target = this.getAttribute("data-target");

            engTabs.forEach((t) => t.classList.remove("active"));
            this.classList.add("active");

            if (engData[target]) {
                const info = engData[target];
                if (engTitle) engTitle.textContent = info.title;
                if (engDescription) engDescription.textContent = info.desc;
                if (engImg1) engImg1.src = info.img1;
                if (engImg2) engImg2.src = info.img2;

                if (engTags) {
                    engTags.innerHTML = "";
                    info.tags.forEach((tag) => {
                        const span = document.createElement("span");
                        span.textContent = tag;
                        engTags.appendChild(span);
                    });
                }
            }
        });
    });
});