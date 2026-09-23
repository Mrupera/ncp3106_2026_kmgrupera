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

            const swipeMin = Math.max(24, Math.min(50, window.innerWidth * 0.08));

            if (movedBy < -swipeMin && currentIndex < slides.length - 1) {
                currentIndex += 1;
            } else if (movedBy > swipeMin && currentIndex > 0) {
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

    /* ==========================================
       2b. BOOK PAGE-TURN CAROUSEL (ABOUT SECTION)
       Rotation-based, so it can't share the translateX engine above.
       ========================================== */
    function setupBookCarousel(windowId, trackId, dotsId, autoPlayMs = 7000) {
        const windowEl = document.getElementById(windowId);
        const trackEl = document.getElementById(trackId);
        const dotsContainer = document.getElementById(dotsId);

        if (!windowEl || !trackEl) return;

        const pages = Array.from(trackEl.children);
        if (pages.length === 0) return;

        let currentIndex = 0;
        let isTurning = false;
        let timer = null;

        // Swipe tracking
        let startX = 0;
        let isPointerDown = false;

        function syncDots() {
            if (!dotsContainer) return;
            Array.from(dotsContainer.children).forEach((dot, idx) => {
                dot.classList.toggle("active", idx === currentIndex);
            });
        }

        function clearPageClasses(el) {
            el.classList.remove("turning", "turning-back");
        }

        // Re-run the staggered entrance on a spread's content
        function playReveal(slide) {
            if (!slide) return;
            slide.classList.remove("content-enter");
            void slide.offsetWidth; // reflow, so the animation restarts
            slide.classList.add("content-enter");
            setTimeout(() => slide.classList.remove("content-enter"), 1700);
        }

        function turnTo(nextIndex) {
            if (isTurning) return;

            // Wrap around
            if (nextIndex < 0) nextIndex = pages.length - 1;
            if (nextIndex >= pages.length) nextIndex = 0;
            if (nextIndex === currentIndex) return;

            const outgoing = pages[currentIndex];
            const incoming = pages[nextIndex];

            const forward =
                nextIndex > currentIndex ||
                (currentIndex === pages.length - 1 && nextIndex === 0);

            isTurning = true;

            // Content rises once the turning page has swung clear of it
            setTimeout(() => playReveal(incoming), 400);

            // Below 900px the turn animation is disabled, so animationend
            // never fires. Without a fallback the carousel locks on the
            // first swipe. settle() runs once, whichever path gets there.
            function watchTurn(el, onSettle) {
                const flipper = el.querySelector(".page-flipper");
                const watched = flipper || el;
                let settled = false;

                function settle() {
                    if (settled) return;
                    settled = true;
                    watched.removeEventListener("animationend", onEnd);
                    clearTimeout(guard);
                    onSettle();
                    isTurning = false;
                }

                function onEnd(e) {
                    if (e.target !== watched) return;
                    settle();
                }

                watched.addEventListener("animationend", onEnd);

                // Fires if the animation is absent, interrupted, or skipped
                const guard = setTimeout(settle, 1000);
            }

            if (forward) {
                // Next spread waits underneath; the current right page
                // swings left on the spine.
                incoming.classList.add("active");
                outgoing.classList.remove("active");
                outgoing.classList.add("turning");

                watchTurn(outgoing, () => clearPageClasses(outgoing));
            } else {
                // Reverse: the previous page lifts back off to the right
                outgoing.classList.remove("active");
                incoming.classList.add("turning-back");

                watchTurn(incoming, () => {
                    clearPageClasses(incoming);
                    incoming.classList.add("active");
                });
            }

            currentIndex = nextIndex;
            syncDots();
        }

        // --- Dots ---
        if (dotsContainer) {
            Array.from(dotsContainer.children).forEach((dot, idx) => {
                dot.addEventListener("click", () => {
                    turnTo(idx);
                    resetTimer();
                });
            });
        }

        // --- Autoplay ---
        function startTimer() {
            if (autoPlayMs && !timer) {
                timer = setInterval(() => turnTo(currentIndex + 1), autoPlayMs);
            }
        }

        function resetTimer() {
            clearInterval(timer);
            timer = null;
            startTimer();
        }

        // --- Swipe / drag: distance maps to direction, not to rotation ---
        function pointerStart(e) {
            isPointerDown = true;
            startX = e.type.includes("touch")
                ? (e.touches[0] ? e.touches[0].clientX : 0)
                : e.clientX;
            clearInterval(timer);
            timer = null;
        }

        function pointerEnd(e) {
            if (!isPointerDown) return;
            isPointerDown = false;

            const endX = e.type.includes("touch")
                ? (e.changedTouches[0] ? e.changedTouches[0].clientX : startX)
                : e.clientX;

            const moved = endX - startX;
            // Scale the swipe distance to the screen, so phones don't
            // need a 60px drag to turn a page.
            const threshold = Math.max(28, Math.min(60, window.innerWidth * 0.09));

            if (moved < -threshold) {
                turnTo(currentIndex + 1);
            } else if (moved > threshold) {
                turnTo(currentIndex - 1);
            }

            startTimer();
        }

        windowEl.style.cursor = "grab";
        windowEl.addEventListener("mousedown", pointerStart);
        windowEl.addEventListener("mouseup", pointerEnd);
        windowEl.addEventListener("mouseleave", () => { isPointerDown = false; });
        windowEl.addEventListener("touchstart", pointerStart, { passive: true });
        windowEl.addEventListener("touchend", pointerEnd);

        // --- Init ---
        pages.forEach((page, idx) => {
            clearPageClasses(page);
            page.classList.toggle("active", idx === 0);
        });
        syncDots();

        /* ---- Closed cover: hold everything until the book opens ---- */
        const cover = windowEl.querySelector(".book-cover");
        const startsClosed =
            cover && windowEl.classList.contains("book-closed");

        function openBook() {
            if (!windowEl.classList.contains("book-closed")) return;

            windowEl.classList.remove("book-closed");
            windowEl.classList.add("book-opening");

            // First spread rises as the cover lifts clear
            setTimeout(() => playReveal(pages[currentIndex]), 520);

            const settle = () => {
                windowEl.classList.remove("book-opening");
                windowEl.classList.add("book-open");
                startTimer();
            };

            cover.addEventListener("animationend", function done(e) {
                if (e.target !== cover) return;
                cover.removeEventListener("animationend", done);
                settle();
            });

            // Fallback in case the animation never reports back
            setTimeout(() => {
                if (!windowEl.classList.contains("book-open")) settle();
            }, 1600);
        }

        if (startsClosed) {
            cover.addEventListener("click", openBook);

            if ("IntersectionObserver" in window) {
                const watcher = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            watcher.disconnect();
                            setTimeout(openBook, 420);
                        }
                    });
                }, { threshold: 0.35 });

                watcher.observe(windowEl);
            } else {
                setTimeout(openBook, 900);
            }
        } else {
            windowEl.classList.add("book-open");
            startTimer();
        }
    }

    setupBookCarousel("aboutSliderWindow", "aboutSliderTrack", "aboutDots", 7000);

    /* ==========================================
       3. EXCLUSIVE SPECIALIZATION SIDEBAR TOGGLE & CONTENT SWITCH
       (section id renamed disciplines -> specialization to match
       the #specialization link already used on whatiscpe.html)
       ========================================== */
    const disciplinesSec = document.getElementById("specialization");
    const sidebar = document.getElementById("disciplinesSidebar");

    if (disciplinesSec) {
        let triggerZone = disciplinesSec.querySelector(".disciplines-trigger-zone");
        if (!triggerZone) {
            triggerZone = document.createElement("div");
            triggerZone.className = "disciplines-trigger-zone";
            disciplinesSec.appendChild(triggerZone);
        }

        if (triggerZone && sidebar) {
            // Hover-open only makes sense with a real pointer; on touch the
            // toggle button in section 6 drives the drawer instead.
            const hoverCapable = window.matchMedia("(hover: hover)").matches;

            if (hoverCapable) {
                triggerZone.addEventListener("mouseenter", () => {
                    sidebar.classList.add("show-sidebar");
                });

                sidebar.addEventListener("mouseleave", () => {
                    sidebar.classList.remove("show-sidebar");
                    disciplinesSec.classList.remove("sidebar-open");
                });
            }
        }
    }

    // Dynamic Data for Specializations
    const disciplineData = {
        embedded: {
            title: "EMBEDDED SYSTEMS",
            subtitle: "Computers hidden inside everyday devices.",
            desc: "Embedded systems combine hardware processors and microcontrollers with custom software to run specialized real-time operations in automotive, medical, and consumer electronics. Engineers in this field write firmware that talks directly to sensors, motors, and displays, balancing tight memory and power budgets against strict timing requirements — a missed deadline in an airbag controller or an insulin pump isn't a bug report, it's a safety issue. You'll find embedded systems anywhere a device needs to think for itself without a full computer attached: a car's anti-lock brakes, a washing machine's control board, a pacemaker.",
            gifs: [
                { src: "Assets/gifs/AEF.gif", caption: "Automotive ECU Firmware" },
                { src: "Assets/gifs/MDC.gif", caption: "Medical Device Control" },
                { src: "Assets/gifs/SAB.gif", caption: "Smart Appliance Board" }
            ]
        },
        iot: {
            title: "INTERNET OF THINGS (IoT)",
            subtitle: "Connecting physical objects to the digital world.",
            desc: "IoT integrates embedded hardware, microcontrollers, wireless sensors, and cloud systems to collect and exchange real-time data across smart networks. Engineers here design the low-power radios and communication protocols (Wi-Fi, Bluetooth Low Energy, LoRa, MQTT) that let a thousand small devices report back to a central system without draining their batteries in a week. It's the field behind smart homes, connected agriculture sensors, and factory floors where every machine reports its own health before it breaks down.",
            gifs: [
                { src: "Assets/gifs/SHSN.gif", caption: "Smart Home Sensor Network" },
                { src: "Assets/gifs/IIM.gif", caption: "Industrial IoT Monitoring" },
                { src: "Assets/gifs/WDS.gif", caption: "Wearable Device Sync" }
            ]
        },
        networks: {
            title: "COMPUTER NETWORKS",
            subtitle: "The infrastructure behind global communication.",
            desc: "Computer networks focus on designing, deploying, and maintaining the secure data-transmission protocols, router configurations, and enterprise infrastructure that keep information moving. Engineers here plan how thousands of devices share bandwidth without collision, build redundant paths so a single failed cable doesn't take down a building, and tune systems to keep latency low even under heavy load. This is the invisible backbone behind everything from a university's Wi-Fi to a bank's transaction network.",
            gifs: [
                { src: "Assets/gifs/END.gif", caption: "Enterprise Network Design" },
                { src: "Assets/gifs/RSC.gif", caption: "Router & Switch Config" },
                { src: "Assets/gifs/DCC.gif", caption: "Data Center Cabling" }
            ]
        },
        cybersecurity: {
            title: "CYBERSECURITY",
            subtitle: "Defending systems and networks from digital threats.",
            desc: "Cybersecurity protects hardware, software, and communication channels against unauthorized access, data breaches, and malicious attacks. The work spans finding weaknesses before attackers do (penetration testing), building the firewalls and intrusion-detection systems that stand guard around the clock, and responding when something does get through. It's a field that rewards paranoia in a healthy way — assuming every system will eventually be probed, and designing so that a single failure doesn't become a catastrophe.",
            gifs: [
                { src: "Assets/gifs/PT.gif", caption: "Penetration Testing" },
                { src: "Assets/gifs/FWID.gif", caption: "Firewall & IDS Setup" },
                { src: "Assets/gifs/SOC.gif", caption: "Security Operations Center" }
            ]
        },
        software: {
            title: "SOFTWARE DEVELOPMENT",
            subtitle: "Crafting applications, logic, and system tools.",
            desc: "Software development encompasses system software, firmware, algorithms, and application logic that bridge raw hardware capabilities with human interaction. Engineers here move across the full stack — databases, backend services, APIs, and the interfaces people actually touch — while keeping code maintainable as it grows past a few hundred lines into something a whole team has to work on together. In Computer Engineering specifically, this often means software that talks closely to hardware: drivers, operating systems, and the tools other engineers build on top of.",
            gifs: [
                { src: "Assets/gifs/FSWA.gif", caption: "Full-Stack Web App" },
                { src: "Assets/gifs/MAD.gif", caption: "Mobile App Development" },
                { src: "Assets/gifs/ABS.gif", caption: "API & Backend Services" }
            ]
        },
        ai: {
            title: "ARTIFICIAL INTELLIGENCE",
            subtitle: "Empowering machines to learn and reason.",
            desc: "AI in computer engineering focuses on machine learning, neural networks, computer vision, and the hardware accelerators built specifically to process intelligent algorithms fast. It's not just writing the models — it's understanding how they run on real silicon, why a network that trains fine on a workstation might be too slow or power-hungry to run on a phone, and how to compress or optimize it so it still works where it needs to. This field increasingly sits right at the hardware/software boundary that Computer Engineering is built around.",
            gifs: [
                { src: "Assets/gifs/CVD.gif", caption: "Computer Vision Demo" },
                { src: "Assets/gifs/NNT.gif", caption: "Neural Network Training" },
                { src: "Assets/gifs/NLP.gif", caption: "Natural Language Processing" }
            ]
        },
        datascience: {
            title: "DATA SCIENCE",
            subtitle: "Extracting insight from massive datasets.",
            desc: "Data Science leverages computational models, statistical analytics, and distributed computing frameworks to process and interpret massive streams of information. The work ranges from cleaning messy raw data into something usable, to building the pipelines that move it at scale, to the visualizations and predictive models that turn numbers into decisions other people can actually act on. In a computer engineering context, this often means caring as much about the infrastructure moving the data as the models analyzing it.",
            gifs: [
                { src: "Assets/gifs/DVD.gif", caption: "Data Visualization Dashboard" },
                { src: "Assets/gifs/PMO.gif", caption: "Predictive Model Output" },
                { src: "Assets/gifs/BDP.gif", caption: "Big Data Pipeline" }
            ]
        },
        robotics: {
            title: "ROBOTICS & AUTOMATION",
            subtitle: "Merging mechanical design with autonomous code.",
            desc: "Robotics combines sensor integration, motor control, kinematics, and real-time computation to construct autonomous machines and industrial automation systems. Engineers here have to make hardware and software agree with each other in real time — a robotic arm doesn't get to wait for a slow network request before it decides where to move next. The field spans everything from a single robotic arm on an assembly line to fleets of autonomous mobile robots navigating a warehouse floor together.",
            gifs: [
                { src: "Assets/gifs/ram.gif", caption: "Robotic Arm in Motion" },
                { src: "Assets/gifs/AN.gif", caption: "Autonomous Navigation" },
                { src: "Assets/gifs/IAL.gif", caption: "Industrial Automation Line" }
            ]
        },
        hardware: {
            title: "COMPUTER HARDWARE",
            subtitle: "Designing physical circuits, chips, and microprocessors.",
            desc: "Hardware engineering focuses on VLSI chip design, printed circuit board (PCB) layout, microarchitecture, logic gates, and the physical testing that confirms a design actually works once it's built. This is the discipline closest to the physics of computing itself — signal integrity, heat dissipation, and power delivery all become real constraints, not abstractions. Every processor, memory chip, and circuit board that every other specialization eventually runs on started here.",
            gifs: [
                { src: "Assets/gifs/pdl.gif", caption: "PCB Design Layout" },
                { src: "Assets/gifs/cfd.gif", caption: "Chip Fabrication Process" },
                { src: "Assets/gifs/ectd.gif", caption: "Circuit Testing & Debug" }
            ]
        },
        cloud: {
            title: "CLOUD & EDGE COMPUTING",
            subtitle: "Distributing computation across local and global nodes.",
            desc: "Cloud & Edge Computing pairs high-capacity remote servers with low-latency local processors to deliver efficient, scalable computing resources anywhere they're needed. Engineers here decide what should run close to the user (edge) versus in a distant data center (cloud), design for failures that are inevitable at scale, and build the load-balancing and orchestration systems that keep services running when traffic spikes. It's the layer that makes it possible for millions of devices to rely on services they never have to think about.",
            gifs: [
                { src: "Assets/gifs/csd.gif", caption: "Cloud Server Dashboard" },
                { src: "Assets/gifs/edp.gif", caption: "Edge Device Deployment" },
                { src: "Assets/gifs/lbv.gif", caption: "Load Balancing Visualization" }
            ]
        }
    };

    const discLinks = document.querySelectorAll(".disc-link");
    const defaultView = document.getElementById("disciplineDefault");
    const dynamicView = document.getElementById("disciplineDynamic");
    const dynTitle = document.getElementById("dynTitle");
    const dynSubtitle = document.getElementById("dynSubtitle");
    const dynDesc = document.getElementById("dynDesc");
    const backBtn = document.getElementById("backToOverviewBtn");

    function setSpecGif(index, gif) {
        const img = document.getElementById("specGif" + index);
        const caption = document.getElementById("specCaption" + index);
        if (img) img.src = gif ? gif.src : "";
        if (caption) caption.textContent = gif ? gif.caption : "";
    }

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

                setSpecGif(1, info.gifs[0]);
                setSpecGif(2, info.gifs[1]);
                setSpecGif(3, info.gifs[2]);

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

/* ==========================================
   5. HEADINGS YIELD TO THE OPEN NAVBAR
   While the navbar is showing, any heading whose box
   overlaps its strip fades out, then returns once the
   navbar hides or the heading scrolls clear.
   ========================================== */
document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    // Headings worth protecting from collision
    const SELECTOR = [
        ".site-heading h1",
        ".masthead-dateline",
        ".flip-section-title",
        ".discipline-title",
        ".discipline-subtitle",
        ".careers-main-title",
        ".subpage-title",
        ".about-header-box",
        ".career-card h3"
    ].join(", ");

    const headings = Array.from(document.querySelectorAll(SELECTOR));
    if (headings.length === 0) return;

    let ticking = false;

    function navIsOpen() {
        // The navbar slides in via .show or :hover — either counts as open
        return navbar.classList.contains("show") || navbar.matches(":hover");
    }

    function clearAll() {
        headings.forEach((el) => el.classList.remove("nav-colliding"));
    }

    function check() {
        ticking = false;

        if (!navIsOpen()) {
            clearAll();
            return;
        }

        const navBox = navbar.getBoundingClientRect();
        // A little breathing room so text fades just before it touches
        const navBottom = navBox.bottom + 8;

        headings.forEach((el) => {
            const box = el.getBoundingClientRect();

            // Skip anything not on screen at all
            if (box.bottom < 0 || box.top > window.innerHeight) {
                el.classList.remove("nav-colliding");
                return;
            }

            const overlaps = box.top < navBottom && box.bottom > navBox.top;
            el.classList.toggle("nav-colliding", overlaps);
        });
    }

    function request() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(check);
        }
    }

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    window.addEventListener("mousemove", request, { passive: true });
    navbar.addEventListener("mouseenter", request);
    navbar.addEventListener("mouseleave", () => {
        // Let the hide transition start before restoring
        setTimeout(() => { clearAll(); request(); }, 60);
    });

    request();
});

/* ==========================================
   6. TOUCH NAVIGATION
   The navbar and specialization drawer were both
   hover-only, which made them unreachable on phones.
   ========================================== */
document.addEventListener("DOMContentLoaded", () => {
    const canHover = window.matchMedia("(hover: hover)").matches;

    /* ---------- Navbar toggle ---------- */
    const navbar = document.getElementById("navbar");
    const navToggle = document.getElementById("navToggle");

    if (navbar && navToggle) {
        function setNav(open) {
            navbar.classList.toggle("show", open);
            navToggle.setAttribute("aria-expanded", open ? "true" : "false");
            navToggle.setAttribute(
                "aria-label",
                open ? "Close navigation menu" : "Open navigation menu"
            );
        }

        navToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            setNav(!navbar.classList.contains("show"));
        });

        // Tapping a link closes the menu
        navbar.querySelectorAll(".nav-link").forEach((link) => {
            link.addEventListener("click", () => setNav(false));
        });

        // Tapping anywhere else closes it
        document.addEventListener("click", (e) => {
            if (!navbar.classList.contains("show")) return;
            if (navbar.contains(e.target) || navToggle.contains(e.target)) return;
            setNav(false);
        });

        // Escape closes it
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") setNav(false);
        });
    }

    /* ---------- Specialization drawer ---------- */
    const section = document.getElementById("specialization");
    const sidebar = document.getElementById("disciplinesSidebar");
    const discToggle = document.getElementById("disciplinesToggle");

    if (section && sidebar && discToggle) {
        // Backdrop gives a tap-out target behind the drawer
        let backdrop = section.querySelector(".disciplines-backdrop");
        if (!backdrop) {
            backdrop = document.createElement("div");
            backdrop.className = "disciplines-backdrop";
            section.insertBefore(backdrop, section.firstChild);
        }

        function setDrawer(open) {
            sidebar.classList.toggle("show-sidebar", open);
            section.classList.toggle("sidebar-open", open);
            discToggle.setAttribute("aria-expanded", open ? "true" : "false");
        }

        discToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            setDrawer(!sidebar.classList.contains("show-sidebar"));
        });

        backdrop.addEventListener("click", () => setDrawer(false));

        // Choosing a specialization closes the drawer on touch
        sidebar.querySelectorAll(".disc-link").forEach((link) => {
            link.addEventListener("click", () => {
                if (!canHover) setDrawer(false);
            });
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") setDrawer(false);
        });
    }
});