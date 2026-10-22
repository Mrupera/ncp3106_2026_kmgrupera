<?php
if (PHP_SAPI !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(403); exit; }

require_once __DIR__.'/config.php';
if (!isset($_SESSION['user_id'],$_SESSION['session_version'])) { header('Location: login.php'); exit; }
$s=$mysqli->prepare('SELECT u.username,u.first_name,u.last_name,u.role,u.session_version,u.account_status,u.employee_id,d.department AS employee_department FROM users u LEFT JOIN demo2 d ON d.id=u.employee_id WHERE u.id=?');
$s->bind_param('i',$_SESSION['user_id']); $s->execute(); $current=$s->get_result()->fetch_assoc();
if (!$current || (int)$current['session_version'] !== (int)$_SESSION['session_version'] || $current['account_status']!=='approved') {
    clear_session(); header('Location: login.php'); exit;
}
if ($current['role']!=='admin' && (!$current['employee_id'] ||
    ($current['role']==='hr' && $current['employee_department']!=='HR') ||
    ($current['role']==='accounting' && $current['employee_department']!=='Accounting'))) {
    clear_session(); http_response_code(403); exit('Your account needs administrator review before you can access employee records.');
}
$_SESSION['username']=$current['username']; $_SESSION['role']=$current['role']; $_SESSION['last_active']=time();
$_SESSION['first_name']=$current['first_name']; $_SESSION['last_name']=$current['last_name'];
$_SESSION['employee_id']=$current['employee_id']===null ? null : (int)$current['employee_id'];
require_once __DIR__.'/access.php';
