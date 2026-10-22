<?php
require_once __DIR__.'/auth.php'; require_admin(); require_once __DIR__.'/photo_helpers.php';
if ($_SERVER['REQUEST_METHOD']!=='POST') { http_response_code(405); header('Allow: POST'); exit('Use the photo form.'); }
rate_limit($mysqli,'photo-upload:'.$_SESSION['user_id'],20,300);
$id=filter_var(input('employee_id'),FILTER_VALIDATE_INT); $action=input('action');
if (!$id || $id<1 || !in_array($action,['upload','reset'],true)) { http_response_code(400); exit('Invalid photo action.'); }
$new=null;
try {
    if ($action==='upload') $new=prepare_photo($_FILES['photo']??[]);
    $mysqli->begin_transaction(); $s=$mysqli->prepare('SELECT photo_file FROM demo2 WHERE id=? FOR UPDATE'); $s->bind_param('i',$id); $s->execute(); $person=$s->get_result()->fetch_assoc();
    if (!$person) throw new InvalidArgumentException('Employee record not found.');
    $s=$mysqli->prepare('UPDATE demo2 SET photo_file=? WHERE id=?'); $s->bind_param('si',$new,$id); $s->execute(); $mysqli->commit(); delete_photo($person['photo_file']);
    $_SESSION['approval_flash']=$action==='upload'?'Employee photo saved.':'Demo cartoon restored.';
} catch (Throwable $ex) {
    $mysqli->rollback(); if ($new) delete_photo($new);
    if ($ex instanceof InvalidArgumentException || $ex instanceof DomainException) $_SESSION['approval_flash']=$ex->getMessage(); else throw $ex;
}
header('Location: index.php?employee='.$id); exit;
