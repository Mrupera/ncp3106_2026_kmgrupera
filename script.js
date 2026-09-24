document.addEventListener("DOMContentLoaded", () => {
    /* ==========================================
       1. NAVBAR HOVER / TRIGGER ZONE
       ========================================== */
    const navbar = document.getElementById("navbar");

    if (navbar) {
        // Hover logic is for a real mouse on wide screens only. Where the menu
        // button is shown (touch / narrow screens) the button alone opens the menu.
        const buttonMode = window.matchMedia("(hover: none), (max-width: 900px)");
        const isMouse = (e) => e.pointerType === "mouse" && !buttonMode.matches;

        navbar.addEventListener("pointerenter", (e) => {
            if (isMouse(e)) navbar.classList.add("show");
        });

        navbar.addEventListener("pointerleave", (e) => {
            if (isMouse(e)) navbar.classList.remove("show");
        });

        window.addEventListener("pointermove", (e) => {
            if (!isMouse(e)) return;
            if (e.clientY <= 60) {
                navbar.classList.add("show");
            } else if (!navbar.matches(":hover")) {
                navbar.classList.remove("show");
            }
        });

        // Visible while the page is at the top; hides once the user scrolls down
        const TOP_ZONE = 40;
        const syncTop = () => navbar.classList.toggle("at-top", window.scrollY <= TOP_ZONE);
        window.addEventListener("scroll", syncTop, { passive: true });
        syncTop();
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
        return navbar.classList.contains("show") || navbar.classList.contains("at-top") || navbar.matches(":hover");
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
/* ==========================================
   7. FACULTY SECTION
   Dots switch the four Faculty slides (no autoplay).
   The professor index on slide 3 only swaps the
   featured portrait + nameplate; it never changes
   the active slide.
   ========================================== */
document.addEventListener("DOMContentLoaded", () => {
    const facWindow = document.getElementById("facWindow");
    if (!facWindow) return;

    /* ---------- Slide dots ---------- */
    const slides = Array.from(facWindow.querySelectorAll(".fac-slide"));
    const dots = Array.from(document.querySelectorAll("#facDots .dot"));

    const prevBtn = document.getElementById("facPrev");
    const nextBtn = document.getElementById("facNext");
    const count = document.getElementById("facCount");
    let currentSlide = 0;

    function goToSlide(index) {
        if (index < 0 || index >= slides.length) return;
        currentSlide = index;
        slides.forEach((slide, i) => {
            const on = i === index;
            slide.classList.toggle("active", on);
            slide.setAttribute("aria-hidden", on ? "false" : "true");
        });
        dots.forEach((dot, i) => {
            const on = i === index;
            dot.classList.toggle("active", on);
            dot.setAttribute("aria-current", on ? "true" : "false");
        });
        // Boundaries disable (not wrap) so the four-slide sequence stays obvious.
        // aria-disabled keeps the button focusable, so keyboard focus is never lost.
        if (prevBtn) prevBtn.setAttribute("aria-disabled", index === 0 ? "true" : "false");
        if (nextBtn) nextBtn.setAttribute("aria-disabled", index === slides.length - 1 ? "true" : "false");
        if (count) count.textContent =
            String(index + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
    }

    // Phones: slides differ in height, so keep the top of the new slide in view
    function keepSlideInView() {
        if (!window.matchMedia("(max-width: 900px)").matches) return;
        const top = facWindow.getBoundingClientRect().top;
        if (top < 0) facWindow.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function step(delta) {
        const target = currentSlide + delta;
        if (target < 0 || target >= slides.length) return;
        goToSlide(target);
        keepSlideInView();
    }

    dots.forEach((dot, i) => dot.addEventListener("click", () => { goToSlide(i); keepSlideInView(); }));
    if (prevBtn) prevBtn.addEventListener("click", () => step(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => step(1));

    /* ---------- Professor index ----------
       Exactly three professors. Entries in [brackets]
       are placeholders awaiting verified information;
       an empty photo shows the "Photo to be added" panel. */
    const professors = [
        { name: "Engr. Mary Ann Limkian, PCpE", role: "CpE Faculty", photo: "Assets/faculty/mamlim.jpg" },
        { name: "Engr. Onofre Corpuz",          role: "CpE Faculty", photo: "Assets/faculty/corpuz.jpg" },
        { name: "Engr. Joehmel Coral",          role: "CpE Faculty", photo: "Assets/faculty/coral.jpg" }
    ];

    const rows = Array.from(document.querySelectorAll("#facIndex .fac-row"));
    const feature = document.getElementById("facFeature");
    const portrait = document.getElementById("facPortrait");
    const plateNum = document.getElementById("facPlateNum");
    const plateName = document.getElementById("facPlateName");
    const plateRole = document.getElementById("facPlateRole");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;
    let swapTimer = null;

    function applyProfessor(index) {
        const p = professors[index];
        plateNum.textContent = String(index + 1).padStart(2, "0");
        plateName.textContent = p.name;
        plateRole.textContent = p.role;
        feature.classList.toggle("no-photo", !p.photo);
        if (p.photo) {
            portrait.src = p.photo;
            portrait.alt = "Portrait of " + p.name;
        } else {
            portrait.removeAttribute("src");
            portrait.alt = "";
        }
    }

    function selectProfessor(index) {
        if (index === current || !professors[index]) return;
        current = index;

        rows.forEach((row, i) => {
            const on = i === index;
            row.classList.toggle("is-current", on);
            row.setAttribute("aria-pressed", on ? "true" : "false");
        });

        clearTimeout(swapTimer);
        if (reduceMotion) {
            applyProfessor(index);
        } else {
            feature.classList.add("is-swapping");
            swapTimer = setTimeout(() => {
                applyProfessor(index);
                feature.classList.remove("is-swapping");
            }, 180);
        }

        // Phones: the portrait sits above the list, so bring it back into view
        if (window.matchMedia("(max-width: 900px)").matches) {
            const top = feature.getBoundingClientRect().top;
            if (top < 0 || top > window.innerHeight * 0.5) {
                feature.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
            }
        }
    }

    rows.forEach((row) => {
        row.addEventListener("click", () => selectProfessor(Number(row.dataset.prof)));
    });

    goToSlide(0);
});

/* ==========================================
   8. SCPES WORLD
   Threshold reveal, Meet the Officers (looping 3D strip + spotlight)
   and Gatherings (one story at a time, 5 s each, only while in view).
   Names/positions are exactly as printed on Assets/Officers cards;
   [bracketed] values are placeholders awaiting verification.
   ========================================== */
document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("scpes")) return;
    const data = {
            officers: [
                { name: "Charlize Baldovino", role: "President",                              img: "baldovino" },
                { name: "Jawad Macawadib",    role: "VP for Internal Affairs",                img: "macawadib" },
                { name: "Joshua Madriaga",    role: "VP for External Affairs",                img: "madriaga" },
                { name: "Ghenny Manabat",     role: "VP for Secretariat",                     img: "manabat" },
                { name: "Jessica Apostol",    role: "VP for Business and Finance",            img: "apostol" },
                { name: "Mei Rupera",         role: "VP for Technical Operations",            img: "rupera" },
                { name: "Roselle Landayan",   role: "VP for Events and Programs",             img: "landayan" },
                { name: "Jian Cruz",          role: "VP for Creatives & Communication",       img: "cruz" },
                { name: "Joe Cornita",        role: "VP for Media",                           img: "cornita" },
                { name: "Joshua Purificacion",role: "VP for Career Development",              img: "purificacion" },
                { name: "Earl Lorenzo",       role: "VP for Community & Social Responsibility", img: "lorenzo" },
                { name: "Felix Adriano",      role: "VP for Recreation and Wellness",         img: "adriano" },
                { name: "Bench Paed",         role: "VP for Logistics & Volunteer's Coordination", img: "paed" }
            ],
            gatherings: [
                { kind: "Competition", title: "Packet Hacks 2025", deck: "First Runner-Up",
                  img: "iotcon", pos: "50% 45%",
                  facts: [["Result", "First Runner-Up"], ["Date", "[To confirm]"], ["Team", "[To confirm]"]],
                  caption: "On stage after the “First Runner-Up” announcement." },
                { kind: "Research", title: "1st Computer Engineering Research Colloquium-Forum", deck: null,
                  img: "researchcolloqium", pos: "50% 40%",
                  facts: [["Date", "[To confirm]"], ["Venue", "[To confirm]"]],
                  caption: "Participants with their certificates." },
                { kind: "Projects", title: "Project Exhibit", deck: "CalamiTech · Doze · SIBOLTech · TheraFlow",
                  img: "research", pos: "50% 60%",
                  facts: [["Projects shown", "CalamiTech, Doze, SIBOLTech, TheraFlow"], ["Date", "[To confirm]"]],
                  gallery: ["calamitech", "dozen", "siboltech", "theraflow", "smoki"],
                  caption: "Project posters lined up for the exhibit." },
                { kind: "Outreach", title: "SHS Work Immersion", deck: null,
                  img: "workimmersionshs", pos: "50% 40%",
                  facts: [["Date", "[To confirm]"]],
                  caption: "Senior high school work immersion participants with SCPES." },
                { kind: "Community", title: "Free Coffee & Bread", deck: "July 28 · 2/F LB · 8AM",
                  img: "bread1", pos: "50% 50%",
                  facts: [["When", "July 28, 8AM (until supplies last)"], ["Where", "2/F LB"], ["Open to", "The whole CENG’G community and UE support staff"]],
                  gallery: ["bread2"],
                  caption: "Open to students, faculty, admin & staff, security guards and janitors." },
                { kind: "Community", title: "Freshman Huddle", deck: null,
                  img: "freshmenhuddle", pos: "50% 45%",
                  facts: [["Date", "[To confirm]"]],
                  caption: "A tradition every year to welcome new the batch of computer engineering students." },
                { kind: "Organization", title: "SCPES A.Y. 26–27", deck: "#AllOutCPE",
                  img: "org1", pos: "50% 35%",
                  facts: [["Academic year", "2026–27"]],
                  caption: "Society of Computer Engineering Students." },
                { kind: "Organization", title: "SCPES A.Y. 25–26", deck: "#CpENonStop",
                  img: "org2", pos: "50% 45%",
                  facts: [["Academic year", "2025–26"]],
                  caption: "Society of Computer Engineering Students." }
            ]
        };
    const OFF = (k, alt) => "Assets/Officers/portraits/" + k + (alt ? "-2" : "") + ".jpg";
    // Photos are sorted into Assets/SCPE/Projects, /Events and /Orgpic
    const FOLDER = {
        iotcon: "Projects", researchcolloqium: "Projects", research: "Projects",
        calamitech: "Projects", dozen: "Projects", siboltech: "Projects", theraflow: "Projects", smoki: "Projects",
        workimmersionshs: "Events", bread1: "Events", bread2: "Events", freshmenhuddle: "Events",
        org1: "Orgpic", org2: "Orgpic", org3: "Orgpic"
    };
    const EV = (k) => "Assets/SCPE/" + FOLDER[k] + "/" + ({ calamitech: "Calamitech" }[k] || k) + ".jpg";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isNarrow = () => window.matchMedia("(max-width: 900px)").matches;
    const pad = (n) => String(n).padStart(2, "0");
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const isPh = (s) => /^\[.*\]$/.test(s);

    /* ---------- A · threshold reveal ---------- */
    const core = document.querySelector(".sw-thr-core");
    if (core && "IntersectionObserver" in window) {
        new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { core.classList.add("is-in"); o.disconnect(); } }), { threshold: 0.25 }).observe(core);
    } else if (core) core.classList.add("is-in");

    /* ---------- B/D · collection stage ---------- */
    function Stage(el) {
        const kind = el.dataset.collection;               // "officers" | "gatherings"
        const items = data[kind];
        const n = items.length;
        const track = el.querySelector(".sw-track");
        const ruler = el.querySelector(".sw-ruler");
        const count = el.querySelector(".sw-count");
        const prev = el.querySelector(".sw-prev");
        const next = el.querySelector(".sw-next");
        const openBtn = el.querySelector(".sw-open");
        const spot = el.querySelector(".sw-spot");
        const idImg = el.querySelector(".sw-id-img");
        const idNum = el.querySelector(".sw-id-num");
        const idRole = el.querySelector(".sw-id-role");
        const src = (it, alt) => kind === "officers" ? OFF(it.img, alt) : EV(it.img);

        // cards
        const cards = items.map((it, i) => {
            const b = document.createElement("button");
            b.type = "button"; b.className = "sw-card";
            b.setAttribute("aria-label", kind === "officers" ? `${pad(i + 1)}, ${it.role}, ${it.name}` : `${pad(i + 1)}, ${it.kind}, ${it.title}`);
            b.innerHTML = `<span class="sw-card-img"><img src="${src(it)}" alt="" style="object-position:${it.pos || "50% 20%"}" draggable="false" loading="lazy"></span>
                <span class="sw-card-meta">
                    <span class="sw-card-num">${pad(i + 1)} / ${kind === "officers" ? "Officer" : esc(it.kind)}</span>
                    <span class="sw-card-name">${esc(kind === "officers" ? it.name : it.title)}</span>
                    <span class="sw-card-role">${esc(kind === "officers" ? it.role : (it.deck || "&nbsp;"))}</span>
                </span>`;
            if (kind !== "officers" && !it.deck) b.querySelector(".sw-card-role").innerHTML = "&nbsp;";
            track.appendChild(b);
            return b;
        });
        const ticks = items.map((_, i) => {
            const t = document.createElement("button");
            t.type = "button"; t.className = "sw-tick"; t.tabIndex = -1;
            t.addEventListener("click", () => go(i));
            ruler.appendChild(t); return t;
        });

        let target = 0, pos = 0, raf = null, index = 0;
        const gap = () => (isNarrow() ? window.innerWidth * 0.62 + 24 : Math.min(Math.max(window.innerWidth * 0.19, 230), 290) + 56);

        function layout() {
            const g = gap();
            cards.forEach((c, i) => {
                let d = i - pos; d = ((d % n) + n + n / 2) % n - n / 2;   // loop: neighbours on both sides
                const ad = Math.abs(d);
                const scale = Math.max(0.78, 1.08 - ad * 0.2);
                const x = d * g + Math.sign(d) * Math.min(ad, 1) * g * 0.14;   // centre card gets a little breathing room
                const rot = Math.max(-26, Math.min(26, -d * 9));                  // filmstrip curve
                const z = -Math.min(ad, 3) * 60;
                c.style.transform = `translate(-50%, -54%) translate3d(${x}px,0,${z}px) rotateY(${reduce ? 0 : rot}deg) scale(${scale})`;
                c.style.opacity = ad > 3.2 ? 0 : String(1 - Math.min(ad, 3) * 0.16);
                c.style.zIndex = String(100 - Math.round(ad * 10));
                c.classList.toggle("is-center", ad < 0.5);
                c.tabIndex = ad < 0.5 ? 0 : -1;
                c.setAttribute("aria-current", ad < 0.5 ? "true" : "false");
            });
        }
        function tick() {
            pos += (target - pos) * (reduce ? 1 : 0.14);
            if (Math.abs(target - pos) < 0.001) pos = target;
            layout();
            raf = pos === target ? null : requestAnimationFrame(tick);
        }
        function kick() { if (!raf) raf = requestAnimationFrame(tick); }
        function sync() {
            index = ((Math.round(target) % n) + n) % n;
            const it = items[index];
            count.textContent = `${pad(index + 1)} / ${pad(n)}`;
            ticks.forEach((t, i) => t.classList.toggle("is-on", i === index));
            idImg.src = src(it); idNum.textContent = `${pad(index + 1)} / ${pad(n)}`;
            idRole.textContent = kind === "officers" ? `${it.role} · ${it.name}` : it.title;
        }
        // the strip loops (like a carousel of people, not a finite list); target is unbounded,
        // index is target wrapped into 0..n-1, and we always travel the short way round
        function go(i) {
            const cur = Math.round(target), curIdx = ((cur % n) + n) % n;
            let delta = (((i - curIdx) % n) + n) % n; if (delta > n / 2) delta -= n;
            target = cur + delta; sync(); kick();
        }

        prev.addEventListener("click", () => { target = Math.round(target) - 1; sync(); kick(); });
        next.addEventListener("click", () => { target = Math.round(target) + 1; sync(); kick(); });
        openBtn.addEventListener("click", () => open(index));
        cards.forEach((c, i) => c.addEventListener("click", () => {
            if (moved) return;
            if (i === index) open(i); else go(i);
        }));

        // drag / swipe
        let down = false, sx = 0, sy = 0, sp = 0, moved = false, horiz = null;
        track.addEventListener("pointerdown", (e) => { down = true; moved = false; horiz = null; sx = e.clientX; sy = e.clientY; sp = target; });
        window.addEventListener("pointermove", (e) => {
            if (!down) return;
            const dx = e.clientX - sx, dy = e.clientY - sy;
            if (horiz === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) horiz = Math.abs(dx) > Math.abs(dy);
            if (!horiz) return;
            moved = true; track.classList.add("is-dragging");
            target = sp - dx / gap(); kick();
        });
        window.addEventListener("pointerup", () => {
            if (!down) return; down = false; track.classList.remove("is-dragging");
            if (moved) { target = Math.round(target); sync(); kick(); setTimeout(() => (moved = false), 0); }
        });
        // horizontal wheel / trackpad only; vertical scrolling is never hijacked
        let wheelLock = 0;
        track.addEventListener("wheel", (e) => {
            if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) && !e.shiftKey) return;
            e.preventDefault();
            const now = Date.now(); if (now - wheelLock < 260) return; wheelLock = now;
            ((e.deltaX || e.deltaY) > 0 ? next : prev).click();
        }, { passive: false });
        el.addEventListener("keydown", (e) => {
            if (spot.classList.contains("is-open")) { if (e.key === "Escape") close(); return; }
            if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
            if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); }
            if (e.key === "Home") go(0);
            if (e.key === "End") go(n - 1);
        });
        window.addEventListener("resize", layout);

        /* ---------- C/E · spotlight ---------- */
        let spotIndex = -1;
        function officerMarkup(i) {
            const it = items[i], nx = items[(i + 1) % n];
            const parts = it.name.split(" "); const last = parts.pop();
            return `<div class="sw-spot-top"><button type="button" class="sw-spot-btn sw-back"><span aria-hidden="true">&larr;</span> All officers</button>
                    <button type="button" class="sw-spot-btn sw-close">Close <span aria-hidden="true">&times;</span></button></div>
                <div class="sw-sp-text sw-spot-in">
                    <span class="sw-sp-num">${pad(i + 1)}</span>
                    <p class="sw-sp-kicker">SCPES Officer &nbsp;/&nbsp; ${pad(i + 1)} of ${pad(n)}</p>
                    <h4 class="sw-sp-name"><span>${esc(parts.join(" "))}</span><span>${esc(last)}</span></h4>
                    <dl class="sw-sp-table">
                        <div><dt>Position</dt><dd>${esc(it.role)}</dd></div>
                        <div><dt>Organization</dt><dd>Society of Computer Engineering Students</dd></div>
                        <div><dt>Term</dt><dd class="is-ph">[To confirm]</dd></div>
                    </dl>
                </div>
                <figure class="sw-sp-photo"><img src="${src(it)}" alt="${esc(it.name)}, ${esc(it.role)}"></figure>
                <div class="sw-sp-side sw-spot-in">
                    <p class="sw-sp-label">From the officer card</p>
                    <figure class="sw-sp-alt"><img src="${src(it, true)}" alt="${esc(it.name)} in the SCPES varsity jacket"></figure>
                    <button type="button" class="sw-sp-next"><img src="${src(nx)}" alt=""><span><b>Next officer</b>${esc(nx.name)}</span></button>
                </div>`;
        }
        function storyMarkup(i) {
            const it = items[i], nx = items[(i + 1) % n];
            const gal = [it.img].concat(it.gallery || []);
            return `<figure class="sw-st-photo"><img src="${EV(it.img)}" alt="${esc(it.caption)}"></figure>

                <div class="sw-st-text sw-spot-in">
                    <span class="sw-sp-num">${pad(i + 1)}</span>
                    <p class="sw-sp-kicker">SCPES in action &nbsp;/&nbsp; ${esc(it.kind)}</p>
                    <h4 class="sw-st-title">${esc(it.title)}</h4>
                    ${it.deck ? `<p class="sw-st-deck">${esc(it.deck)}</p>` : ""}
                    <p class="sw-st-cap">${esc(it.caption)}</p>
                </div>
                <div class="sw-st-side sw-spot-in">
                    ${gal.length > 1 ? `<p class="sw-sp-label">In this story</p><div class="sw-st-thumbs">${gal.map((g, k) => `<button type="button" class="sw-st-thumb${k ? "" : " is-on"}" data-img="${g}" aria-label="Show photo ${k + 1}"><img src="${EV(g)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
                    <button type="button" class="sw-sp-next"><img src="${EV(nx.img)}" alt="" loading="lazy"><span><b>Next story</b>${esc(nx.title)}</span></button>
                </div>`;
        }
        function fill(i) {
            spotIndex = i;
            spot.className = "sw-spot" + (kind === "officers" ? "" : " sw-spot--story");
            spot.innerHTML = kind === "officers" ? officerMarkup(i) : storyMarkup(i);
            spot.setAttribute("aria-label", kind === "officers" ? `${items[i].name}, ${items[i].role}` : items[i].title);
            if (storyMode) {
                spot.querySelector(".sw-sp-next").addEventListener("click", () => { show(i + 1); restart(); });
            } else {
                spot.querySelector(".sw-close").addEventListener("click", close);
                spot.querySelector(".sw-back").addEventListener("click", close);
                spot.querySelector(".sw-sp-next").addEventListener("click", () => { const j = (i + 1) % n; go(j); fill(j); spot.classList.add("is-open"); spot.querySelector(".sw-close").focus(); });
            }
            spot.querySelectorAll(".sw-st-thumb").forEach((t) => t.addEventListener("click", () => {
                const main = spot.querySelector(".sw-st-photo img");
                main.style.opacity = 0;
                setTimeout(() => { main.src = EV(t.dataset.img); main.style.opacity = 1; }, reduce ? 0 : 200);
                spot.querySelectorAll(".sw-st-thumb").forEach((x) => x.classList.toggle("is-on", x === t));
            }));
        }
        function flip(fromEl, toEl, imgSrc, done) {
            if (reduce || !fromEl || !toEl) { done(); return; }
            const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
            const g = document.createElement("figure"); g.className = "sw-ghost";
            g.innerHTML = `<img src="${imgSrc}" alt="">`;
            Object.assign(g.style, { left: b.left + "px", top: b.top + "px", width: b.width + "px", height: b.height + "px" });
            document.body.appendChild(g);
            g.animate([
                { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})` },
                { transform: "none" }
            ], { duration: 650, easing: "cubic-bezier(0.7, 0, 0.2, 1)" }).onfinish = () => { done(); requestAnimationFrame(() => g.remove()); };
            g.querySelector("img").style.objectPosition = "50% 20%";
            return g;
        }
        function open(i) {
            if (i !== index) go(i);
            fill(i);
            spot.hidden = false;
            el.classList.add("has-spot");
            const target = spot.querySelector(kind === "officers" ? ".sw-sp-photo" : ".sw-st-photo");
            target.style.visibility = "hidden";
            requestAnimationFrame(() => {
                flip(cards[i].querySelector(".sw-card-img"), target, src(items[i]), () => { target.style.visibility = ""; });
                spot.classList.add("is-open");
                spot.querySelector(".sw-close").focus({ preventScroll: true });
                if (isNarrow()) document.documentElement.style.overflow = "hidden";
            });
        }
        function close() {
            if (spot.hidden || storyMode) return;
            const i = spotIndex;
            const from = spot.querySelector(kind === "officers" ? ".sw-sp-photo" : ".sw-st-photo");
            spot.classList.remove("is-open");
            el.classList.remove("has-spot");
            document.documentElement.style.overflow = "";
            flip(from, cards[i].querySelector(".sw-card-img"), src(items[i]), () => {});
            setTimeout(() => { spot.hidden = true; spot.innerHTML = ""; cards[i].focus({ preventScroll: true }); }, reduce ? 0 : 450);
        }
        document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !spot.hidden) close(); });

        sync(); pos = target; layout();

        /* ---------- STORY MODE: one full-frame story at a time, advancing on its own ---------- */
        const storyMode = el.dataset.mode === "story";
        let timer = null, paused = false, hovering = false, inView = false;
        const DWELL = 5000;
        const pauseBtn = document.createElement("button");
        function show(i) {
            i = ((i % n) + n) % n;
            go(i);
            if (reduce) { fill(i); spot.classList.add("is-open"); return; }
            spot.classList.remove("is-open");
            setTimeout(() => { fill(i); requestAnimationFrame(() => spot.classList.add("is-open")); }, 280);
        }
        function running() { return inView && !paused && !hovering && !reduce && !document.hidden; }
        function restart() {
            clearTimeout(timer);
            el.classList.toggle("is-playing", running());
            // restart the progress fill on the current segment
            ticks.forEach((t) => t.classList.remove("is-run"));
            if (running()) { void ruler.offsetWidth; ticks[index].classList.add("is-run"); timer = setTimeout(() => { show(index + 1); restart(); }, DWELL); }
        }
        if (storyMode) {
            el.classList.add("is-story-mode");
            el.style.setProperty("--sw-dwell", DWELL + "ms");
            fill(0); spot.hidden = false; spot.classList.add("is-open");
            spot.setAttribute("aria-modal", "false"); spot.removeAttribute("role");
            spot.setAttribute("aria-live", "polite");
            // Prev / Next / ticks step one story and keep the rhythm going
            prev.addEventListener("click", () => { show(index); restart(); });
            next.addEventListener("click", () => { show(index); restart(); });
            ticks.forEach((t, i) => t.addEventListener("click", () => { show(i); restart(); }));
            // pause control (required for moving content)
            pauseBtn.type = "button"; pauseBtn.className = "sw-step sw-pause";
            const setLabel = () => { pauseBtn.innerHTML = paused ? '<span aria-hidden="true">&#9654;</span> Play' : '<span aria-hidden="true">&#10074;&#10074;</span> Pause'; pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false"); };
            setLabel();
            pauseBtn.addEventListener("click", () => { paused = !paused; setLabel(); restart(); });
            el.querySelector(".sw-controls").appendChild(pauseBtn);
            // keyboard users: hold still while focus is inside (mouse users get the Pause button)
            el.addEventListener("focusin", (e) => { if (e.target.matches(":focus-visible")) { hovering = true; restart(); } });
            el.addEventListener("focusout", () => { hovering = false; restart(); });
            document.addEventListener("visibilitychange", restart);
            if ("IntersectionObserver" in window) {
                new IntersectionObserver((es) => es.forEach((e) => { inView = e.isIntersecting; restart(); }), { threshold: 0.5 }).observe(el);
            }
            // phones: stories differ in height, so reserve the tallest one to stop the page jumping
            const lockHeight = () => {
                spot.style.minHeight = "";
                if (!isNarrow()) return;
                const cur = index; let max = 0;
                for (let k = 0; k < n; k++) { fill(k); max = Math.max(max, spot.scrollHeight); }
                fill(cur); spot.classList.add("is-open");
                spot.style.minHeight = max + "px";
            };
            lockHeight();
            let rz = null;
            window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(lockHeight, 200); });
            // arrow keys go through the same stepping
            el.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); next.click(); } if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); } });
        }
        return { go, open, close, get index() { return index; } };
    }

    document.querySelectorAll(".sw-stage").forEach((el) => Stage(el));
});


/* ==========================================
   9. UE FOOTER · FAQ ACCORDION
   One answer open at a time; + becomes −.
   ========================================== */
document.addEventListener("DOMContentLoaded", () => {
    const qs = Array.from(document.querySelectorAll(".uf-q"));
    qs.forEach((q) => {
        q.addEventListener("click", () => {
            const willOpen = q.getAttribute("aria-expanded") !== "true";
            qs.forEach((other) => {
                const on = other === q && willOpen;
                other.setAttribute("aria-expanded", on ? "true" : "false");
                document.getElementById(other.getAttribute("aria-controls")).hidden = !on;
            });
        });
    });
});