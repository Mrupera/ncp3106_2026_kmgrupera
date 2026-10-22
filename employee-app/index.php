<?php
require_once __DIR__.'/auth.php'; require_once __DIR__.'/layout.php'; require_once __DIR__.'/dashboard_ui.php';
$role=$_SESSION['role']; $name=trim($_SESSION['first_name'].' '.$_SESSION['last_name'])?:$_SESSION['username'];
$own=own_employee($mysqli);
if ($role==='employee') $employees=$own?[$own]:[];
else $employees=$mysqli->query('SELECT '.employee_columns().' FROM demo2 ORDER BY id')->fetch_all(MYSQLI_ASSOC);
$pending=$available=$accounts=[];
if ($role==='admin') {
    $pending=$mysqli->query("SELECT id,first_name,last_name,username,created_at FROM users WHERE account_status='pending' AND role<>'admin' ORDER BY created_at,id")->fetch_all(MYSQLI_ASSOC);
    $available=$mysqli->query('SELECT d.id,d.first_name,d.last_name,d.department FROM demo2 d LEFT JOIN users u ON u.employee_id=d.id WHERE u.id IS NULL ORDER BY d.first_name,d.last_name,d.id')->fetch_all(MYSQLI_ASSOC);
    $accounts=$mysqli->query("SELECT u.id,u.username,u.role,u.account_status,d.first_name,d.last_name FROM users u LEFT JOIN demo2 d ON d.id=u.employee_id WHERE u.account_status<>'pending' AND u.role<>'admin' ORDER BY u.username")->fetch_all(MYSQLI_ASSOC);
}
$flash=($_SESSION['approval_flash']??'').' '.($_SESSION['employee_flash']??''); unset($_SESSION['approval_flash'],$_SESSION['employee_flash']);
$titles=['employee'=>'My Dashboard','admin'=>'Admin Dashboard','hr'=>'HR Dashboard','accounting'=>'Accounting Dashboard'];
page_header($titles[$role]);
if (trim($flash)!==''): ?><div class="portal-notice" role="status"><?php echo e(trim($flash)); ?></div><?php endif;
if ($role==='admin'): ?>
<section class="admin-welcome"><h3>Hi, <?php echo e($name); ?>!</h3><p>Manage employee records and account access.</p></section>
<?php elseif ($role==='employee' && $own): ?>
<section class="personal-welcome"><div><h3>Welcome, <?php echo e($name); ?>!</h3><p>Your employee information, all in one place.</p></div><div class="personal-identity"><?php avatar($own,'hero-avatar'); ?><div><strong><?php echo e(full_name($own)); ?></strong><p>Employee</p><?php badge($own['status']); ?></div></div></section>
<?php else: ?>
<section class="staff-welcome"><?php avatar($own); ?><div><button type="button" class="greeting-link" data-open-approval="my-record" aria-haspopup="dialog">Welcome, <?php echo e($name); ?>! <?php echo icon('eye'); ?></button><p><?php echo $role==='hr'?'Review and approve employee employment status.':'Review employee salaries and assign payroll amounts.'; ?></p><span class="profile-hint">Select your name to view your own employee record.</span></div>
<div class="status-counts"><span><?php echo count(array_filter($employees,fn($p)=>$p['status']==='Regular')); ?> Regular</span><span><?php echo count(array_filter($employees,fn($p)=>$p['status']==='Probationary')); ?> Probationary</span></div></section>
<?php if ($own): ?><dialog class="approval-dialog personal-record-dialog" id="my-record" aria-labelledby="my-record-title"><button type="button" class="approval-close" data-close-approval aria-label="Close my employee record">&times;</button><h3 id="my-record-title">My Employee Record</h3><?php details_card($own,true); ?><p class="profile-note">Your personal information is read-only.</p></dialog><?php endif; ?>
<?php endif; ?>
<?php if ($role==='employee'): ?>
<?php if ($own): ?><section class="personal-metrics"><article class="metric-card metric-butter"><?php echo icon('office'); ?><div><p>Department</p><strong><?php echo e($own['department']); ?></strong></div></article><article class="metric-card metric-pink"><?php echo icon('status'); ?><div><p>Employment status</p><strong><?php echo e($own['status']); ?></strong></div></article><article class="metric-card metric-sage"><?php echo icon('salary'); ?><div><p>Salary</p><strong>&#8369;<?php echo number_format((float)$own['salary'],2); ?></strong></div></article></section>
<section class="profile-card"><?php details_card($own,true); ?><p class="profile-note">Read-only information. Contact HR or Accounting for corrections.</p></section><?php endif; ?>
<?php else:
$selected=$employees[0]??null; $requested=filter_input(INPUT_GET,'employee',FILTER_VALIDATE_INT);
foreach ($employees as $person) if ((int)$person['id']===$requested) $selected=$person;
?>
<div class="<?php echo $role==='admin'?'admin-columns':'staff-columns'; ?>">
<section class="employee-panel"><div class="section-toolbar"><h3><?php echo $role==='admin'?'Employee Records':($role==='hr'?'Employment Status Review':'Salary Assignment'); ?></h3><label class="employee-search"><span class="sr-only">Search employees</span><input type="search" placeholder="Search employees..." data-employee-search></label></div>
<?php if (!$employees): ?><div class="portal-notice">No employee records found.</div><?php else: ?>
<div class="table-card"><table class="table staff-records" aria-label="Employee records"><thead><tr><th>Employee</th><th>Department</th><th>Sex</th><?php if (can_view_salary()): ?><th>Salary</th><?php endif; ?><th>Status</th><th>Action</th></tr></thead><tbody>
<?php foreach ($employees as $person): ?><tr data-employee-row data-search="<?php echo e(full_name($person).' '.$person['department']); ?>" class="<?php echo $role!=='admin' && $requested===(int)$person['id']?'selected-employee':''; ?>"><td data-label="Employee"><div class="table-person"><?php avatar($person); ?><?php if ($role!=='admin'): ?><button type="button" class="employee-review-name" data-open-approval="review-<?php echo (int)$person['id']; ?>" aria-haspopup="dialog"><?php echo e(full_name($person)); ?></button><?php else: ?><strong><?php echo e(full_name($person)); ?></strong><?php endif; ?></div></td><td data-label="Department"><?php echo e($person['department']); ?></td><td data-label="Sex"><?php echo e($person['sex']??'Not specified'); ?></td>
<?php if (can_view_salary()): ?><td class="salary-cell" data-label="Salary">&#8369;<?php echo number_format((float)$person['salary'],2); ?></td><?php endif; ?><td data-label="Status"><?php badge($person['status']); ?></td><td data-label="Action">
<?php if ($role==='admin'): ?><div class="record-actions" role="group" aria-label="Actions for <?php echo e(full_name($person)); ?>"><?php foreach (['eye','edit','delete'] as $action) action_link((int)$person['id'],$action); ?></div>
<?php else: ?><button type="button" class="review-link" data-open-approval="review-<?php echo (int)$person['id']; ?>" aria-haspopup="dialog"><?php echo $role==='hr'?'Review status':'Assign salary'; ?></button><?php endif; ?></td></tr><?php endforeach; ?></tbody></table></div><?php endif; ?>
</section>
<?php if ($role==='admin'): require __DIR__.'/account_panel.php'; else: ?>
<?php foreach ($employees as $selected): ?>
<dialog class="approval-dialog employee-review-dialog review-panel" id="review-<?php echo (int)$selected['id']; ?>" aria-labelledby="review-title-<?php echo (int)$selected['id']; ?>"><button type="button" class="approval-close" data-close-approval aria-label="Close employee review">&times;</button><h3 id="review-title-<?php echo (int)$selected['id']; ?>">Review employee</h3>
<?php if ($selected): ?><div class="review-person"><?php avatar($selected); ?><div><h4><?php echo e(full_name($selected)); ?></h4><p><?php echo e($selected['department']); ?></p></div></div><p>Current status</p><?php badge($selected['status']); ?>
<form action="employee_action.php" method="post" class="employee-role-form"><?php echo csrf_field(); ?><input type="hidden" name="employee_id" value="<?php echo (int)$selected['id']; ?>"><input type="hidden" name="return_to" value="dashboard"><input type="hidden" name="action" value="<?php echo $role==='hr'?'status':'salary'; ?>">
<?php if ($role==='hr'): ?><label for="status-<?php echo (int)$selected['id']; ?>">Approve employment status</label><select name="status" id="status-<?php echo (int)$selected['id']; ?>" required><?php foreach (['Probationary','Regular'] as $status): ?><option value="<?php echo e($status); ?>" <?php echo $status===$selected['status']?'selected':''; ?>><?php echo e($status); ?></option><?php endforeach; ?></select><button class="portal-button" type="submit">Approve Status</button>
<?php else: ?><label for="salary-<?php echo (int)$selected['id']; ?>">Assign salary</label><input type="number" name="salary" id="salary-<?php echo (int)$selected['id']; ?>" min="0" max="99999999.99" step="0.01" value="<?php echo e($selected['salary']); ?>" required><button class="portal-button" type="submit">Save Salary</button><?php endif; ?><button type="button" class="cancel-review" data-close-approval>Cancel</button></form><p class="profile-note">Changes affect <?php echo $role==='hr'?'employment status':'salary'; ?> only.</p>
<?php else: ?><p>No employee is available to review.</p><?php endif; ?></dialog><?php endforeach; ?>
<?php endif; ?></div>
<?php endif; ?>
<?php page_footer(); ?>
