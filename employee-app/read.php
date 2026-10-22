<?php
require_once __DIR__.'/auth.php';
require_once __DIR__.'/layout.php';
require_once __DIR__.'/dashboard_ui.php';
$id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT);
$row=$id && $id>0 ? load_employee($mysqli,$id) : null;
if (!$row) { http_response_code(404); exit('Employee record not found or unavailable to your account.'); }
$notice=$_SESSION['employee_flash']??''; unset($_SESSION['employee_flash']);
page_header('Employee Record', true); ?>
<div class="record-detail table-card"><?php details_card($row); ?>
<?php if ($notice!==''): ?><div class="portal-notice" role="status"><?php echo e($notice); ?></div><?php endif; ?>
<?php if ($_SESSION['role']==='hr'): ?>
<form action="employee_action.php" method="post" class="employee-role-form"><?php echo csrf_field(); ?><input type="hidden" name="employee_id" value="<?php echo (int)$row['id']; ?>"><input type="hidden" name="action" value="status">
<label for="status">Approve employment status</label><select name="status" id="status" required><?php foreach (['Probationary','Regular'] as $status): ?><option value="<?php echo e($status); ?>" <?php echo $status===$row['status']?'selected':''; ?>><?php echo e($status); ?></option><?php endforeach; ?></select><button type="submit" class="portal-button">Approve Status</button></form>
<?php elseif ($_SESSION['role']==='accounting'): ?>
<form action="employee_action.php" method="post" class="employee-role-form"><?php echo csrf_field(); ?><input type="hidden" name="employee_id" value="<?php echo (int)$row['id']; ?>"><input type="hidden" name="action" value="salary">
<label for="salary">Assign salary</label><input name="salary" id="salary" type="number" min="0" max="99999999.99" step="0.01" value="<?php echo e($row['salary']); ?>" required><button type="submit" class="portal-button">Save Salary</button></form>
<?php endif; ?></div>
<?php page_footer(); ?>
