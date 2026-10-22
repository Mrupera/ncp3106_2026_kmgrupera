<?php
if (PHP_SAPI !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(403); exit; }
 require_admin(); ?>
<aside class="approvals-panel" aria-labelledby="approval-heading"><div class="section-heading"><h3 id="approval-heading">Accounts Waiting for Approval <span class="count-badge"><?php echo count($pending); ?></span></h3><p>Select a name to review the account request.</p></div>
<?php if (!$pending): ?><div class="portal-notice">No accounts are waiting for approval.</div><?php else: ?>
<ul class="pending-people" aria-label="Pending account requests">
<?php foreach ($pending as $account): ?><li><button type="button" class="pending-person" data-open-approval="approval-<?php echo (int)$account['id']; ?>" aria-haspopup="dialog">
<span class="pending-person-info"><strong><?php echo e(trim($account['first_name'].' '.$account['last_name'])?:$account['username']); ?></strong><span><?php echo e($account['username']); ?></span></span><span class="pending-chip">Pending</span>
</button></li><?php endforeach; ?></ul><?php endif; ?>
<?php foreach ($pending as $account):
    $matches=array_values(array_filter($available,fn($person)=>strcasecmp(trim($person['first_name']),trim($account['first_name']))===0 && strcasecmp(trim($person['last_name']),trim($account['last_name']))===0));
    $suggested=count($matches)===1?$matches[0]:null;
?>
<dialog class="approval-dialog" id="approval-<?php echo (int)$account['id']; ?>" aria-labelledby="approval-title-<?php echo (int)$account['id']; ?>">
<button type="button" class="approval-close" data-close-approval aria-label="Close account request">&times;</button>
<h3 id="approval-title-<?php echo (int)$account['id']; ?>"><?php echo e(trim($account['first_name'].' '.$account['last_name'])?:$account['username']); ?></h3>
<p class="account-meta">Username: <strong><?php echo e($account['username']); ?></strong><br>Requested: <?php echo e($account['created_at']); ?> UTC</p>
<form action="account_action.php" method="post" class="approval-form"><?php echo csrf_field(); ?><input type="hidden" name="account_id" value="<?php echo (int)$account['id']; ?>"><input type="hidden" name="action" value="approve">
<label for="employee-<?php echo (int)$account['id']; ?>">Employee record</label>
<select id="employee-<?php echo (int)$account['id']; ?>" name="employee_id" required><option value="">Select a verified employee</option>
<?php foreach ($available as $person): $match=strcasecmp(trim($person['first_name']),trim($account['first_name']))===0 && strcasecmp(trim($person['last_name']),trim($account['last_name']))===0; ?>
<option value="<?php echo (int)$person['id']; ?>" data-role-label="<?php echo e(role_label(role_for_department($person['department']))); ?>" <?php echo $suggested && $suggested['id']===$person['id']?'selected':''; ?>><?php echo e($person['first_name'].' '.$person['last_name'].' | '.$person['department'].' | ID '.$person['id'].($match?' | Name match':'')); ?></option>
<?php endforeach; ?></select>
<label for="role-<?php echo (int)$account['id']; ?>">Access role (from department)</label>
<input id="role-<?php echo (int)$account['id']; ?>" class="derived-role" type="text" readonly value="<?php echo $suggested?e(role_label(role_for_department($suggested['department']))):'Select an employee record first'; ?>">
<p class="account-meta"><?php echo $suggested?'A single name match was selected. Verify the person before approving.':(count($matches)>1?'Multiple name matches exist. Select and verify the correct employee.':'Select and verify the correct employee record.'); ?> HR department gets HR access; Accounting gets Accounting access; other departments get Employee access.</p>
<button type="submit" class="portal-button">Approve Account</button></form>
<form action="account_action.php" method="post" class="reject-form"><?php echo csrf_field(); ?><input type="hidden" name="account_id" value="<?php echo (int)$account['id']; ?>"><input type="hidden" name="action" value="reject"><button type="submit" class="portal-button portal-button-secondary">Reject Account</button></form>
<p class="account-meta dialog-footnote">Rejecting blocks account access and keeps the employee record. Closing this box makes no changes.</p>
</dialog><?php endforeach; ?>
<?php if ($accounts): ?><details class="account-management"><summary>Manage reviewed accounts (<?php echo count($accounts); ?>)</summary>
<?php foreach ($accounts as $account): ?><div class="reviewed-account"><p><strong><?php echo e($account['username']); ?></strong><br><?php echo e(role_label($account['role']).' | '.ucfirst($account['account_status'])); ?></p>
<div class="reviewed-account-actions"><?php if ($account['account_status']==='approved'): ?><a class="portal-button portal-button-secondary" href="admin_recovery.php?id=<?php echo (int)$account['id']; ?>">Help Reset Password</a><?php endif; ?><form action="account_action.php" method="post"><?php echo csrf_field(); ?><input type="hidden" name="account_id" value="<?php echo (int)$account['id']; ?>"><input type="hidden" name="action" value="<?php echo $account['account_status']==='approved'?'revoke':'reopen'; ?>"><button class="portal-button portal-button-secondary" type="submit"><?php echo $account['account_status']==='approved'?'Revoke Access':'Return to Pending'; ?></button></form>
<?php if ($account['account_status']==='rejected'): ?><button type="button" class="portal-button portal-button-remove" data-open-approval="remove-account-<?php echo (int)$account['id']; ?>" aria-haspopup="dialog">Remove</button><?php endif; ?></div>
<?php if ($account['account_status']==='rejected'): ?>
<dialog class="approval-dialog" id="remove-account-<?php echo (int)$account['id']; ?>" aria-labelledby="remove-title-<?php echo (int)$account['id']; ?>">
<button type="button" class="approval-close" data-close-approval aria-label="Close removal confirmation">&times;</button>
<h3 id="remove-title-<?php echo (int)$account['id']; ?>">Remove rejected account?</h3>
<p>This permanently deletes the login account <strong><?php echo e($account['username']); ?></strong>. The employee record will be kept.</p>
<p>Use Return to Pending instead if you want to review this request again.</p>
<div class="reviewed-account-actions"><button type="button" class="portal-button portal-button-secondary" data-close-approval>Cancel</button>
<form action="account_action.php" method="post"><?php echo csrf_field(); ?><input type="hidden" name="account_id" value="<?php echo (int)$account['id']; ?>"><input type="hidden" name="action" value="remove"><input type="hidden" name="confirm_remove" value="yes"><button type="submit" class="portal-button portal-button-remove">Remove Account</button></form></div>
</dialog><?php endif; ?></div><?php endforeach; ?></details><?php endif; ?>
</aside>
