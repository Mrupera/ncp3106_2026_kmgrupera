<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(403); exit; }

ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'self'; script-src 'self' https://code.jquery.com https://cdn.jsdelivr.net https://stackpath.bootstrapcdn.com; style-src 'self' 'unsafe-inline' https://stackpath.bootstrapcdn.com https://maxcdn.bootstrapcdn.com https://cdn.jsdelivr.net; font-src 'self' https://maxcdn.bootstrapcdn.com https://cdn.jsdelivr.net data:; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
$https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
$remote = $_SERVER['REMOTE_ADDR'] ?? '';
if (PHP_SAPI !== 'cli' && !$https && !in_array($remote, ['127.0.0.1','::1'], true)) {
    http_response_code(403); exit('HTTPS is required outside localhost.');
}
if ($https) header('Strict-Transport-Security: max-age=31536000');
// Derive the cookie scope for domain-root or subfolder deployment.
$cookiePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/') . '/';
session_set_cookie_params(['lifetime'=>0,'path'=>$cookiePath,'secure'=>$https,'httponly'=>true,'samesite'=>'Lax']);
if (session_status() !== PHP_SESSION_ACTIVE) session_start();
function clear_session(): void {
    $_SESSION=[];
    if (ini_get('session.use_cookies')) {
        $p=session_get_cookie_params();
        setcookie(session_name(), '', ['expires'=>time()-3600,'path'=>$p['path'],'secure'=>$p['secure'],'httponly'=>true,'samesite'=>'Lax']);
    }
    session_destroy();
}
if (isset($_SESSION['user_id']) && (time()-($_SESSION['last_active']??0)>1800 || time()-($_SESSION['signed_in_at']??0)>28800)) {
    clear_session(); header('Location: login.php'); exit;
}
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
function csrf_field(): string { return '<input type="hidden" name="csrf" value="'.htmlspecialchars($_SESSION['csrf'], ENT_QUOTES, 'UTF-8').'">'; }
function input(string $name, bool $trim=true): string {
    $value=$_POST[$name]??'';
    if (!is_string($value) || strlen($value)>8192) { http_response_code(400); exit('Invalid input.'); }
    return $trim ? trim($value) : $value;
}
if (($_SERVER['REQUEST_METHOD']??'GET') === 'POST') {
    $token=$_POST['csrf']??null;
    if (!is_string($token) || !hash_equals($_SESSION['csrf'], $token)) { http_response_code(403); exit('Form expired. Reload the page and try again.'); }
    foreach ($_POST as $value) {
        if (!is_string($value) || strlen($value)>8192) { http_response_code(400); exit('Invalid input.'); }
    }
}
function e($value): string { return htmlspecialchars((string)$value, ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8'); }
function require_admin(): void {
    if (($_SESSION['role']??'')!=='admin') { http_response_code(403); exit('Employee management requires administrator access.'); }
}
// Durable rate limits. Row locks serialize simultaneous requests.
function rate_limit(mysqli $db, string $key, int $limit, int $seconds): void {
    $key=hash('sha256',$key);
    $db->begin_transaction();
    try {
        $s=$db->prepare('INSERT IGNORE INTO security_limits (bucket,attempts,expires_at) VALUES (?,0,0)');
        $s->bind_param('s',$key); $s->execute();
        $s=$db->prepare('SELECT attempts,expires_at FROM security_limits WHERE bucket=? FOR UPDATE');
        $s->bind_param('s',$key); $s->execute(); $r=$s->get_result()->fetch_assoc();
        $count=(int)$r['attempts']; $expires=(int)$r['expires_at'];
        if ($expires<=time()) { $count=0; $expires=time()+$seconds; }
        if ($count >= $limit) { $db->commit(); header('Retry-After: '.max(1,$expires-time())); http_response_code(429); exit('Too many attempts. Please try again later.'); }
        $count++;
        $s=$db->prepare('UPDATE security_limits SET attempts=?,expires_at=? WHERE bucket=?');
        $s->bind_param('iis',$count,$expires,$key); $s->execute(); $db->commit();
    } catch (Throwable $ex) { $db->rollback(); throw $ex; }
}
function ip_key(): string { return $_SERVER['REMOTE_ADDR']??'cli'; }
