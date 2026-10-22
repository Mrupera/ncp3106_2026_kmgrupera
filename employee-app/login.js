"use strict";
const countdown = document.getElementById("lock-countdown");
if (countdown) {
    // Measure elapsed time rather than subtracting one per tick: background tabs throttle timers.
    const duration = Number(countdown.dataset.seconds) * 1000;
    const started = performance.now();
    let interval;
    function updateCountdown() {
        const seconds = Math.max(0, Math.ceil((duration - (performance.now() - started)) / 1000));
        countdown.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
        if (seconds === 0) {
            clearInterval(interval);
            document.getElementById("login-error").textContent = "The lock has expired. You can try logging in again.";
        }
    }
    interval = setInterval(updateCountdown, 250);
    document.addEventListener("visibilitychange", updateCountdown);
    updateCountdown();
}
