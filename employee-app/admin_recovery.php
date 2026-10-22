<?php
require_once __DIR__.'/auth.php'; require_admin(); require_once __DIR__.'/layout.php';
$id=filter_var($_POST['account_id']??$_GET['id']??'',FILTER_VALIDATE_INT);
if (!$id || $id<1) { http_response_code(400); exit('Invalid account.'); }
$s=$mysqli->prepare("SELECT id,username,role,account_status FROM users WHERE id=?");
$s->bind_param('i',$id); $s->execute(); $target=$s->get_result()->fetch_assoc();
if (!$target || $target['role']==='admin' || $target['account_status']!=='approved') { http_response_code(403); exit('Recovery here is only available for approved non-administrator accounts.'); }
$error=''; $temporary_code='';
if ($_SERVER['REQUEST_METHOD']==='POST') {
    rate_limit($mysqli,'assisted-recovery:'.$_SESSION['user_id'],5,300);
    $s=$mysqli->prepare('SELECT password_hash FROM users WHERE id=?');
    $s->bind_param('i',$_SESSION['user_id']); $s->execute(); $admin=$s->get_result()->fetch_assoc();
    if (!password_verify(input('password',false),$admin['password_hash'])) $error='Incorrect administrator password.';
    elseif (input('verified')!=='yes') $error='Verify the person before generating a reset code.';
    else {
        $temporary_code=bin2hex(random_bytes(24)); $digest=hash('sha256',$temporary_code);
        $s=$mysqli->prepare("UPDATE users SET reset_token_hash=?,reset_token_expires=DATE_ADD(UTC_TIMESTAMP(),INTERVAL 10 MINUTE),recovery_code_hash=NULL,session_version=session_version+1 WHERE id=? AND role<>'admin' AND account_status='approved'");
        $s->bind_param('si',$digest,$id); $s->execute();
        if ($s->affected_rows!==1) { $temporary_code=''; $error='Account changed. Refresh and review it again.'; }
        else error_log('Assisted recovery issued by user '.(int)$_SESSION['user_id'].' for user '.$id);
    }
}
page_header('Account Recovery',true); ?>
<section class="profile-card"><h3>Help <?php echo e($target['username']); ?> recover access</h3>
<?php if ($temporary_code!==''): ?>
<p>Give this one-use code privately to the verified account owner. It expires in 10 minutes. It is shown only in this response.</p>
<p><code style="overflow-wrap:anywhere;font-size:1.2rem"><?php echo e($temporary_code); ?></code></p>
<p>They should open Forgot Password, enter their username and this code. The code type is recognized automatically. After choosing a new password, sign in and generate a new recovery key in Recovery Settings.</p>
<p>Previous recovery keys, reset authorizations and signed-in sessions have been invalidated. Their account approval and role have not changed.</p>
<a class="portal-button" href="index.php">Back to Dashboard</a>
<?php else: ?>
<p>First verify the person's identity through your normal school or workplace process. Knowing their name or username alone is not enough.</p>
<?php if ($error!==''): ?><p class="portal-notice" role="alert"><?php echo e($error); ?></p><?php endif; ?>
<form method="post" class="employee-role-form"><?php echo csrf_field(); ?><input type="hidden" name="account_id" value="<?php echo $id; ?>">
<label>Confirm your administrator password<input type="password" name="password" autocomplete="current-password" required></label>
<label><input type="checkbox" name="verified" value="yes" required> I verified that this person owns this account.</label>
<button type="submit" class="portal-button">Generate Temporary Reset Code</button></form>
<?php endif; ?></section><?php page_footer(); ?>
