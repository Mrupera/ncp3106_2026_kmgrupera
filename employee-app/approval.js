"use strict";
document.querySelectorAll(".approval-dialog").forEach(dialog => {
    dialog.querySelectorAll("[data-close-approval]").forEach(button => button.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("close", () => document.body.classList.remove("approval-open"));
    dialog.addEventListener("click", event => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    const form = dialog.querySelector(".approval-form");
    if (form) {
        const employee = form.querySelector("[name=employee_id]");
        const role = form.querySelector(".derived-role");
        const syncRole = () => {
            role.value = employee.selectedOptions[0]?.dataset.roleLabel || "Select an employee record first";
        };
        employee.addEventListener("change", syncRole);
        syncRole();
    }
});
document.querySelectorAll("[data-open-approval]").forEach(button => {
    button.addEventListener("click", () => {
        const dialog = document.getElementById(button.dataset.openApproval);
        if (!(dialog instanceof HTMLDialogElement)) return;
        const form = dialog.querySelector(".approval-form");
        if (form) {
            form.reset();
            form.querySelector("[name=employee_id]").dispatchEvent(new Event("change"));
        }
        dialog.showModal();
        document.body.classList.add("approval-open");
    });
});
