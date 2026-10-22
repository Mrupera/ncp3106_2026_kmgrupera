<?php
require_once __DIR__.'/auth.php'; require_once __DIR__.'/photo_helpers.php';
$id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT); $person=$id?load_employee($mysqli,$id):null;
if (!$person) { http_response_code(404); exit('Photo not found.'); }
$path=photo_path($person['photo_file']);
if ($path && is_file($path)) { header('Content-Type: image/jpeg'); readfile($path); }
else {
    $avatar=['Male'=>'male','Female'=>'female'][$person['sex']??'']??'male';
    header('Content-Type: image/png'); readfile(__DIR__.'/assets/avatar-'.$avatar.'.png');
}
