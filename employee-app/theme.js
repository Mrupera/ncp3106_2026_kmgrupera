const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
}

if (themeToggle) {
    themeToggle.checked = savedTheme === "dark";

    themeToggle.addEventListener("change", function () {
        const isDarkMode = this.checked;

        document.body.classList.toggle("dark-mode", isDarkMode);
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    });
}
