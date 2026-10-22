"use strict";
const employeeSearch=document.querySelector('[data-employee-search]');
if(employeeSearch) employeeSearch.addEventListener('input',()=>{
    const query=employeeSearch.value.trim().toLocaleLowerCase();
    document.querySelectorAll('[data-employee-row]').forEach(row=>{row.hidden=!row.dataset.search.toLocaleLowerCase().includes(query);});
});

// Selecting an HR or Accounting row opens its employee review dialog.
document.querySelectorAll('[data-employee-row]').forEach(row=>{
    const link=row.querySelector('.employee-review-name');
    if(!link) return;
    row.classList.add('salary-selectable');
    row.addEventListener('click',event=>{
        if(event.target.closest('a,button,input,select,textarea,label')) return;
        if(window.getSelection().toString()) return;
        link.click();
    });
});
