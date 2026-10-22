<?php
if (PHP_SAPI !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(403); exit; }

function page_header(string $title,bool $record_page=false): void { ?>
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title><?php echo e($title); ?> | University Employment Details</title>
<link rel="stylesheet" href="style.css?v=<?php echo (int)filemtime(__DIR__.'/style.css'); ?>">
<script src="theme.js" defer></script><script src="approval.js" defer></script><script src="dashboard.js" defer></script></head><body>
<main class="wrapper portal-wrapper oat-dashboard<?php echo $record_page?' record-page':''; ?>"><div class="dashboard-topbar"><p class="eyebrow">UNIVERSITY EMPLOYMENT SYSTEM</p><div class="theme-toggle"><span class="theme-icon sun" aria-hidden="true">&#9728;</span><label class="switch"><input type="checkbox" id="themeToggle" aria-label="Dark mode"><span class="slider"></span></label><span class="theme-icon moon" aria-hidden="true">&#9790;</span></div></div><header class="header"><div><h2><?php echo e($title); ?></h2><span class="access-tag"><?php echo e(role_label($_SESSION['role'])); ?> access</span></div><div class="header-actions">
<?php if ($record_page): ?><a href="index.php" class="recovery-btn">&larr; Back</a><?php else: ?>
<?php if ($_SESSION['role']==='admin'): ?><a href="create.php" class="btn-add">+ Add Employee</a><?php endif; ?>
<a href="recovery_settings.php" class="recovery-btn">Recovery Settings</a><form action="logout.php" method="post"><?php echo csrf_field(); ?><button class="logout-btn" type="submit">Logout</button></form>
<?php endif; ?></div></header>
<?php }
function page_footer(): void { echo '</main></body></html>'; }
