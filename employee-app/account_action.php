<?php
require_once __DIR__.'/auth.php';
require_admin();
if ($_SERVER['REQUEST_METHOD']!=='POST') { http_response_code(405); header('Allow: POST'); exit('Use the account approval form.'); }
rate_limit($mysqli,'account-actions:'.$_SESSION['user_id'],100,300);
$id=filter_var(input('account_id'),FILTER_VALIDATE_INT);
$action=input('action');
if (!$id || $id<1 || !in_array($action,['approve','reject','revoke','reopen','remove'],true)) { http_response_code(400); exit('Invalid account action.'); }
function account_error(string $message): never {
    global $mysqli; $mysqli->rollback(); $_SESSION['approval_flash']=$message; header('Location: index.php'); exit;
}
$mysqli->begin_transaction();
try {
    $s=$mysqli->prepare('SELECT id,role,account_status FROM users WHERE id=? FOR UPDATE');
    $s->bind_param('i',$id); $s->execute(); $account=$s->get_result()->fetch_assoc();
    if (!$account || $account['role']==='admin' || $id===$_SESSION['user_id']) account_error('This account cannot be changed here.');
    $reviewer=(int)$_SESSION['user_id'];
    if ($action==='approve') {
        if ($account['account_status']!=='pending') account_error('This request was already reviewed. Refresh the dashboard.');
        $employee=filter_var(input('employee_id'),FILTER_VALIDATE_INT);
        if (!$employee || $employee<1) account_error('Select a valid employee record.');
        $s=$mysqli->prepare('SELECT id,department FROM demo2 WHERE id=? FOR UPDATE');
        $s->bind_param('i',$employee); $s->execute(); $person=$s->get_result()->fetch_assoc();
        if (!$person) account_error('The employee record does not exist.');
        // Ignore client-supplied roles: the current database department is authoritative.
        $role=role_for_department($person['department']);
        $s=$mysqli->prepare('SELECT id FROM users WHERE employee_id=?');
        $s->bind_param('i',$employee); $s->execute();
        if ($s->get_result()->num_rows) account_error('That employee record is already linked to an account.');
        $s=$mysqli->prepare("UPDATE users SET account_status='approved',role=?,employee_id=?,reviewed_by=?,reviewed_at=UTC_TIMESTAMP(),session_version=session_version+1 WHERE id=?");
        $s->bind_param('siii',$role,$employee,$reviewer,$id); $s->execute();
        $message='Account approved. The employee can now log in.';
    } elseif ($action==='remove') {
        if ($account['account_status']!=='rejected') account_error('Only rejected accounts can be removed. Revoke active access first.');
        if (input('confirm_remove')!=='yes') account_error('Confirm account removal before continuing.');
        // Shared-hosting variant: authorization above and a conditional DELETE
        // enforce rejection/admin restrictions without a DEFINER routine.
        $s=$mysqli->prepare("DELETE FROM users WHERE id=? AND account_status='rejected' AND role<>'admin' AND id<>?");
        $s->bind_param('ii',$id,$reviewer); $s->execute();
        if ($s->affected_rows!==1) account_error('Account changed. Refresh the dashboard before trying again.');
        $s->close();
        $message='Rejected account removed. The employee record was kept.';
    } else {
        $expected=['reject'=>'pending','revoke'=>'approved','reopen'=>'rejected'][$action];
        if ($account['account_status']!==$expected) account_error('This account has changed. Refresh the dashboard before trying again.');
        $state=$action==='reopen'?'pending':'rejected';
        $s=$mysqli->prepare("UPDATE users SET account_status=?,role='employee',employee_id=NULL,reviewed_by=?,reviewed_at=UTC_TIMESTAMP(),session_version=session_version+1,reset_token_hash=NULL,reset_token_expires=NULL WHERE id=?");
        $s->bind_param('sii',$state,$reviewer,$id); $s->execute();
        $message=['reject'=>'Account request rejected.','revoke'=>'Account access revoked. Existing sessions are invalidated.','reopen'=>'Account returned to the pending queue.'][$action];
    }
    $mysqli->commit(); $_SESSION['approval_flash']=$message;
} catch (mysqli_sql_exception $ex) {
    $mysqli->rollback();
    if ((int)$ex->getCode()===1062) $_SESSION['approval_flash']='This employee record was just linked to another account. Please review again.';
    else throw $ex;
}
header('Location: index.php'); exit;
