<?php
require_once __DIR__.'/auth.php';
if ($_SERVER['REQUEST_METHOD']!=='POST') { http_response_code(405); header('Allow: POST'); exit('Use the employee action form.'); }
$action=input('action'); $role=$_SESSION['role'];
if (!(($action==='status' && $role==='hr') || ($action==='salary' && $role==='accounting'))) { http_response_code(403); exit('Your role cannot perform this action.'); }
rate_limit($mysqli,'employee-actions:'.$_SESSION['user_id'],100,300);
$id=filter_var(input('employee_id'),FILTER_VALIDATE_INT);
if (!$id || $id<1) { http_response_code(400); exit('Invalid employee record.'); }
$allowed=['csrf','employee_id','action','return_to',$action==='status'?'status':'salary'];
if (array_diff(array_keys($_POST),$allowed)) { http_response_code(400); exit('Unexpected fields in this request.'); }
if ($action==='status') {
    $value=input('status');
    if (!in_array($value,['Regular','Probationary'],true)) { http_response_code(400); exit('Invalid employment status.'); }
    $s=$mysqli->prepare('UPDATE demo2 SET status=? WHERE id=?');
} else {
    $value=input('salary');
    if (!preg_match('/\A\d{1,8}(?:\.\d{1,2})?\z/',$value)) { http_response_code(400); exit('Enter a valid salary from 0 to 99999999.99.'); }
    $s=$mysqli->prepare('UPDATE demo2 SET salary=? WHERE id=?');
}
if (!load_employee($mysqli,$id)) { http_response_code(404); exit('Employee record not found.'); }
$s->bind_param('si',$value,$id); $s->execute();
$_SESSION['employee_flash']=$action==='status'?'Employment status approved.':'Salary saved.';
header('Location: '.(input('return_to')==='dashboard'?'index.php?employee='.$id.'#review-panel':'read.php?id='.$id)); exit;
