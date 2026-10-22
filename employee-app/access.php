<?php
if (PHP_SAPI !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(403); exit; }

// Scope database reads before rendering; hidden columns are not sent to the browser.
function can_view_salary(): bool { return in_array($_SESSION['role'],['admin','accounting','employee'],true); }
function can_view_address(): bool { return in_array($_SESSION['role'],['admin','employee'],true); }
function employee_columns(): string {
    $columns='id,first_name,last_name,sex,department,status,photo_file';
    if (can_view_salary()) $columns.=',salary';
    if (can_view_address()) $columns.=',address';
    return $columns;
}
function load_employee(mysqli $db,int $id): ?array {
    if ($_SESSION['role']==='employee' && $id!==$_SESSION['employee_id']) return null;
    $s=$db->prepare('SELECT '.employee_columns().' FROM demo2 WHERE id=?');
    $s->bind_param('i',$id); $s->execute();
    return $s->get_result()->fetch_assoc();
}
function role_label(string $role): string {
    return ['admin'=>'Administrator','hr'=>'HR','accounting'=>'Accounting','employee'=>'Employee'][$role]??'Employee';
}

function role_for_department(string $department): string {
    return ['HR'=>'hr','Accounting'=>'accounting'][$department]??'employee';
}

function own_employee(mysqli $db): ?array {
    if (!$_SESSION['employee_id']) return null;
    $s=$db->prepare('SELECT id,first_name,last_name,sex,address,department,salary,status,photo_file FROM demo2 WHERE id=?');
    $s->bind_param('i',$_SESSION['employee_id']); $s->execute();
    return $s->get_result()->fetch_assoc();
}
