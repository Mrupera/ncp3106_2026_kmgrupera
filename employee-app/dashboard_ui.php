<?php
if (PHP_SAPI !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(403); exit; }

function full_name(array $p): string { return trim(($p['first_name']??'').' '.($p['last_name']??'')); }
function photo_url(?array $p): string { return $p && isset($p['id']) ? 'photo.php?id='.(int)$p['id'] : 'assets/avatar-neutral.png'; }
function avatar(?array $p,string $class=''): void { ?><img class="employee-avatar <?php echo e($class); ?>" src="<?php echo e(photo_url($p)); ?>" alt="" loading="lazy"><?php }
function icon(string $key): string {
    $paths=['eye'=>'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>','edit'=>'<path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15l-1 6Z"/>','delete'=>'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>','photo'=>'<path d="M3 7h4l2-3h6l2 3h4v14H3Z"/><circle cx="12" cy="13" r="4"/>','office'=>'<path d="M4 21V7l8-4 8 4v14M2 21h20M8 8v13M12 8v13M16 8v13"/>','status'=>'<path d="M6 3h12v18H6ZM9 8h6M9 12h6M9 16h4"/>','salary'=>'<path d="M3 6h18v15H3ZM3 6l14-3v3M16 11h5v5h-5Z"/>'];
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'.($paths[$key]??$paths['eye']).'</svg>';
}
function badge(string $status): void { ?><span class="status <?php echo $status==='Regular'?'regular':'probationary'; ?>"><?php echo e($status); ?></span><?php }
function details_card(array $p,bool $personal=false): void { ?>
<div class="person-heading"><?php avatar($p); ?><div><h3><?php echo $personal?'My Employee Details':e(full_name($p)); ?></h3><p><?php echo e($p['department']); ?></p></div></div>
<dl class="profile-details"><div><dt>First name</dt><dd><?php echo e($p['first_name']); ?></dd></div><div><dt>Last name</dt><dd><?php echo e($p['last_name']); ?></dd></div><div><dt>Sex</dt><dd><?php echo e($p['sex']??'Not specified'); ?></dd></div><div><dt>Department</dt><dd><?php echo e($p['department']); ?></dd></div>
<?php if (array_key_exists('address',$p)): ?><div><dt>Address</dt><dd><?php echo e($p['address']); ?></dd></div><?php endif; ?>
<div><dt>Employment status</dt><dd><?php badge($p['status']); ?></dd></div>
<?php if (array_key_exists('salary',$p)): ?><div><dt>Salary</dt><dd>&#8369;<?php echo number_format((float)$p['salary'],2); ?></dd></div><?php endif; ?></dl>
<?php }
function action_link(int $id,string $action): void {
    $labels=['eye'=>'View','edit'=>'Edit','delete'=>'Delete','photo'=>'Change Photo'];
    $classes=['eye'=>'view','edit'=>'edit','delete'=>'delete','photo'=>'view'];
    $route=['eye'=>'read.php','edit'=>'update.php','delete'=>'delete.php'];
    if ($action==='photo') { ?><button type="button" class="record-action record-action-view" data-open-approval="photo-<?php echo $id; ?>" aria-label="Change Photo" title="Change Photo" data-label="Photo"><?php echo icon('photo'); ?></button><?php return; }
    ?><a class="record-action record-action-<?php echo $classes[$action]; ?>" href="<?php echo $route[$action]; ?>?id=<?php echo $id; ?>" aria-label="<?php echo $labels[$action]; ?>" title="<?php echo $labels[$action]; ?>" data-label="<?php echo $labels[$action]; ?>"><?php echo icon($action); ?></a><?php
}
