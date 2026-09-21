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
            triggerZone.addEventListener("mouseenter", () => {
                sidebar.classList.add("show-sidebar");
            });

            sidebar.addEventListener("mouseleave", () => {
                sidebar.classList.remove("show-sidebar");
            });
        }
    }

    // Dynamic Data for Specializations
    const disciplineData = {
        embedded: {
            title: "EMBEDDED SYSTEMS",
            subtitle: "Computers hidden inside everyday devices.",
            desc: "Embedded systems combine hardware processors and microcontrollers with custom software to run specialized real-time operations in automotive, medical, and consumer electronics. Engineers in this field write firmware that talks directly to sensors, motors, and displays, balancing tight memory and power budgets against strict timing requirements — a missed deadline in an airbag controller or an insulin pump isn't a bug report, it's a safety issue. You'll find embedded systems anywhere a device needs to think for itself without a full computer attached: a car's anti-lock brakes, a washing machine's control board, a pacemaker.",
            gifs: [
                { src: "Assets/specialization/embedded-1.gif", caption: "Automotive ECU Firmware" },
                { src: "Assets/specialization/embedded-2.gif", caption: "Medical Device Control" },
                { src: "Assets/specialization/embedded-3.gif", caption: "Smart Appliance Board" }
            ]
        },
        iot: {
            title: "INTERNET OF THINGS (IoT)",
            subtitle: "Connecting physical objects to the digital world.",
            desc: "IoT integrates embedded hardware, microcontrollers, wireless sensors, and cloud systems to collect and exchange real-time data across smart networks. Engineers here design the low-power radios and communication protocols (Wi-Fi, Bluetooth Low Energy, LoRa, MQTT) that let a thousand small devices report back to a central system without draining their batteries in a week. It's the field behind smart homes, connected agriculture sensors, and factory floors where every machine reports its own health before it breaks down.",
            gifs: [
                { src: "Assets/specialization/iot-1.gif", caption: "Smart Home Sensor Network" },
                { src: "Assets/specialization/iot-2.gif", caption: "Industrial IoT Monitoring" },
                { src: "Assets/specialization/iot-3.gif", caption: "Wearable Device Sync" }
            ]
        },
        networks: {
            title: "COMPUTER NETWORKS",
            subtitle: "The infrastructure behind global communication.",
            desc: "Computer networks focus on designing, deploying, and maintaining the secure data-transmission protocols, router configurations, and enterprise infrastructure that keep information moving. Engineers here plan how thousands of devices share bandwidth without collision, build redundant paths so a single failed cable doesn't take down a building, and tune systems to keep latency low even under heavy load. This is the invisible backbone behind everything from a university's Wi-Fi to a bank's transaction network.",
            gifs: [
                { src: "Assets/specialization/networks-1.gif", caption: "Enterprise Network Design" },
                { src: "Assets/specialization/networks-2.gif", caption: "Router & Switch Config" },
                { src: "Assets/specialization/networks-3.gif", caption: "Data Center Cabling" }
            ]
        },
        cybersecurity: {
            title: "CYBERSECURITY",
            subtitle: "Defending systems and networks from digital threats.",
            desc: "Cybersecurity protects hardware, software, and communication channels against unauthorized access, data breaches, and malicious attacks. The work spans finding weaknesses before attackers do (penetration testing), building the firewalls and intrusion-detection systems that stand guard around the clock, and responding when something does get through. It's a field that rewards paranoia in a healthy way — assuming every system will eventually be probed, and designing so that a single failure doesn't become a catastrophe.",
            gifs: [
                { src: "Assets/specialization/cybersecurity-1.gif", caption: "Penetration Testing" },
                { src: "Assets/specialization/cybersecurity-2.gif", caption: "Firewall & IDS Setup" },
                { src: "Assets/specialization/cybersecurity-3.gif", caption: "Security Operations Center" }
            ]
        },
        software: {
            title: "SOFTWARE DEVELOPMENT",
            subtitle: "Crafting applications, logic, and system tools.",
            desc: "Software development encompasses system software, firmware, algorithms, and application logic that bridge raw hardware capabilities with human interaction. Engineers here move across the full stack — databases, backend services, APIs, and the interfaces people actually touch — while keeping code maintainable as it grows past a few hundred lines into something a whole team has to work on together. In Computer Engineering specifically, this often means software that talks closely to hardware: drivers, operating systems, and the tools other engineers build on top of.",
            gifs: [
                { src: "Assets/specialization/software-1.gif", caption: "Full-Stack Web App" },
                { src: "Assets/specialization/software-2.gif", caption: "Mobile App Development" },
                { src: "Assets/specialization/software-3.gif", caption: "API & Backend Services" }
            ]
        },
        ai: {
            title: "ARTIFICIAL INTELLIGENCE",
            subtitle: "Empowering machines to learn and reason.",
            desc: "AI in computer engineering focuses on machine learning, neural networks, computer vision, and the hardware accelerators built specifically to process intelligent algorithms fast. It's not just writing the models — it's understanding how they run on real silicon, why a network that trains fine on a workstation might be too slow or power-hungry to run on a phone, and how to compress or optimize it so it still works where it needs to. This field increasingly sits right at the hardware/software boundary that Computer Engineering is built around.",
            gifs: [
                { src: "Assets/specialization/ai-1.gif", caption: "Computer Vision Demo" },
                { src: "Assets/specialization/ai-2.gif", caption: "Neural Network Training" },
                { src: "Assets/specialization/ai-3.gif", caption: "Natural Language Processing" }
            ]
        },
        datascience: {
            title: "DATA SCIENCE",
            subtitle: "Extracting insight from massive datasets.",
            desc: "Data Science leverages computational models, statistical analytics, and distributed computing frameworks to process and interpret massive streams of information. The work ranges from cleaning messy raw data into something usable, to building the pipelines that move it at scale, to the visualizations and predictive models that turn numbers into decisions other people can actually act on. In a computer engineering context, this often means caring as much about the infrastructure moving the data as the models analyzing it.",
            gifs: [
                { src: "Assets/specialization/datascience-1.gif", caption: "Data Visualization Dashboard" },
                { src: "Assets/specialization/datascience-2.gif", caption: "Predictive Model Output" },
                { src: "Assets/specialization/datascience-3.gif", caption: "Big Data Pipeline" }
            ]
        },
        robotics: {
            title: "ROBOTICS & AUTOMATION",
            subtitle: "Merging mechanical design with autonomous code.",
            desc: "Robotics combines sensor integration, motor control, kinematics, and real-time computation to construct autonomous machines and industrial automation systems. Engineers here have to make hardware and software agree with each other in real time — a robotic arm doesn't get to wait for a slow network request before it decides where to move next. The field spans everything from a single robotic arm on an assembly line to fleets of autonomous mobile robots navigating a warehouse floor together.",
            gifs: [
                { src: "Assets/specialization/robotics-1.gif", caption: "Robotic Arm in Motion" },
                { src: "Assets/specialization/robotics-2.gif", caption: "Autonomous Navigation" },
                { src: "Assets/specialization/robotics-3.gif", caption: "Industrial Automation Line" }
            ]
        },
        hardware: {
            title: "COMPUTER HARDWARE",
            subtitle: "Designing physical circuits, chips, and microprocessors.",
            desc: "Hardware engineering focuses on VLSI chip design, printed circuit board (PCB) layout, microarchitecture, logic gates, and the physical testing that confirms a design actually works once it's built. This is the discipline closest to the physics of computing itself — signal integrity, heat dissipation, and power delivery all become real constraints, not abstractions. Every processor, memory chip, and circuit board that every other specialization eventually runs on started here.",
            gifs: [
                { src: "Assets/specialization/hardware-1.gif", caption: "PCB Design Layout" },
                { src: "Assets/specialization/hardware-2.gif", caption: "Chip Fabrication Process" },
                { src: "Assets/specialization/hardware-3.gif", caption: "Circuit Testing & Debug" }
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