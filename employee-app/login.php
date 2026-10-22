<?php
require_once __DIR__.'/config.php';
if (isset($_SESSION['user_id'])) { header('Location: index.php'); exit; }
$error=''; $username=''; $lock_until=0; $account_error='';
if ($_SERVER['REQUEST_METHOD']==='POST') {
    rate_limit($mysqli,'login-ip:'.ip_key(),30,300);
    $username=input('username'); $password=input('password',false);
    // A normalized username bucket also covers accounts that do not exist.
    rate_limit($mysqli,'login-name:'.strtolower($username),30,300);
    $mysqli->begin_transaction();
    $s=$mysqli->prepare('SELECT u.id,u.username,u.password_hash,u.failed_attempts,u.locked_until,u.role,u.session_version,u.account_status,u.employee_id,d.department AS employee_department FROM users u LEFT JOIN demo2 d ON d.id=u.employee_id WHERE u.username=? FOR UPDATE');
    $s->bind_param('s',$username); $s->execute(); $user=$s->get_result()->fetch_assoc();
    $dummy='$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
    $valid=password_verify($password,$user['password_hash']??$dummy);
    $lock_until = $user && $user['locked_until'] ? strtotime($user['locked_until'].' UTC') : 0;
    $locked = $lock_until > time();
    if ($user && !$locked && $valid) {
        $s=$mysqli->prepare('UPDATE users SET failed_attempts=0,locked_until=NULL WHERE id=?');
        $s->bind_param('i',$user['id']); $s->execute(); $mysqli->commit();
        if ($user['account_status']==='pending') {
            $account_error='Your account is waiting for administrator approval.';
        } elseif ($user['account_status']==='rejected') {
            $account_error='Your account request was rejected or access was revoked. Please contact the administrator.';
        } elseif ($user['role']!=='admin' && (!$user['employee_id'] ||
            ($user['role']==='hr' && $user['employee_department']!=='HR') ||
            ($user['role']==='accounting' && $user['employee_department']!=='Accounting'))) {
            $account_error='Your account needs an administrator to review its employee link and access role.';
        } else {
        session_regenerate_id(true); $_SESSION=[];
        $_SESSION['user_id']=(int)$user['id']; $_SESSION['username']=$user['username'];
        $_SESSION['role']=$user['role']; $_SESSION['session_version']=(int)$user['session_version'];
        $_SESSION['signed_in_at']=$_SESSION['last_active']=time(); $_SESSION['csrf']=bin2hex(random_bytes(32));
        header('Location: index.php'); exit;
        }
    }
    // Mirror failure messages and lock timing for names without accounts.
    // Keep this within the current transaction; rate_limit() owns a separate one.
    $unknown_bucket=null;
    if (!$user) {
        $unknown_bucket=hash('sha256','login-unknown:'.strtolower($username));
        $s=$mysqli->prepare('INSERT IGNORE INTO security_limits (bucket,attempts,expires_at) VALUES (?,0,0)');
        $s->bind_param('s',$unknown_bucket); $s->execute();
        $s=$mysqli->prepare('SELECT attempts,expires_at FROM security_limits WHERE bucket=? FOR UPDATE');
        $s->bind_param('s',$unknown_bucket); $s->execute(); $state=$s->get_result()->fetch_assoc();
        $lock_until=(int)$state['expires_at']; $locked=$lock_until>time();
        $attempts=(int)$state['attempts'];
        if (!$locked) {
            $attempts=($lock_until>0?0:$attempts)+1;
            $lock_until=$attempts>=3?time()+300:0;
            $s=$mysqli->prepare('UPDATE security_limits SET attempts=?,expires_at=? WHERE bucket=?');
            $s->bind_param('iis',$attempts,$lock_until,$unknown_bucket); $s->execute();
        }
    }
    if ($user && !$locked && !$valid) {
        $attempts=($user['locked_until']?0:(int)$user['failed_attempts'])+1;
        $s=$mysqli->prepare('UPDATE users SET failed_attempts=?,locked_until=IF(? >= 3,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 5 MINUTE),NULL) WHERE id=?');
        $s->bind_param('iii',$attempts,$attempts,$user['id']); $s->execute();
    }
    if ($user) {
        // Read the actual database deadline; retries must never restart the timer.
        $s=$mysqli->prepare('SELECT UNIX_TIMESTAMP(locked_until) AS deadline FROM users WHERE id=?');
        $s->bind_param('i',$user['id']); $s->execute();
        $lock_until=(int)($s->get_result()->fetch_assoc()['deadline'] ?? 0);
    }
    $mysqli->commit();
    if ($account_error!=='') {
        $error=$account_error;
        unset($_SESSION['locked_account_id'],$_SESSION['locked_username'],$_SESSION['locked_unknown_bucket']);
    } elseif ($lock_until > time()) {
        $error='Your account is temporarily locked after 3 failed attempts. Even the correct password cannot be used until the timer expires.';
        unset($_SESSION['locked_account_id'],$_SESSION['locked_unknown_bucket']);
        if ($user) $_SESSION['locked_account_id']=(int)$user['id'];
        else $_SESSION['locked_unknown_bucket']=$unknown_bucket;
        $_SESSION['locked_username']=$username;
    } else {
        $remaining=max(0,3-($attempts ?? (int)$user['failed_attempts']));
        $error='Login failed. Invalid username or password. '.$remaining.' attempt'.($remaining===1?'':'s').' remaining.';
        unset($_SESSION['locked_account_id'],$_SESSION['locked_username'],$_SESSION['locked_unknown_bucket']);
    }
}
// Reloading the page keeps the countdown tied to the database, not the browser.
if ($_SERVER['REQUEST_METHOD']==='GET' && (isset($_SESSION['locked_account_id']) || isset($_SESSION['locked_unknown_bucket']))) {
    if (isset($_SESSION['locked_account_id'])) {
    $s=$mysqli->prepare('SELECT UNIX_TIMESTAMP(locked_until) AS deadline FROM users WHERE id=?');
    $s->bind_param('i',$_SESSION['locked_account_id']); $s->execute();
    $lock_until=(int)($s->get_result()->fetch_assoc()['deadline'] ?? 0);
    } else {
        $s=$mysqli->prepare('SELECT expires_at AS deadline FROM security_limits WHERE bucket=?');
        $s->bind_param('s',$_SESSION['locked_unknown_bucket']); $s->execute();
        $lock_until=(int)($s->get_result()->fetch_assoc()['deadline'] ?? 0);
    }
    if ($lock_until>time()) {
        $username=$_SESSION['locked_username']??'';
        $error='Your account is temporarily locked after 3 failed attempts. Even the correct password cannot be used until the timer expires.';
    } else {
        unset($_SESSION['locked_account_id'],$_SESSION['locked_username'],$_SESSION['locked_unknown_bucket']);
    }
}
$lock_seconds=max(0,$lock_until-time());

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1">

    <title>Login | University Employment Details</title>

    <link rel="stylesheet" href="style.css?v=<?php echo filemtime(__DIR__ . "/style.css"); ?>">
    <script src="theme.js" defer></script>
    <script src="login.js" defer></script>
</head>
<body>

<div class="theme-toggle">
    <span class="theme-icon sun">&#9728;</span>

    <label class="switch">
        <input type="checkbox" id="themeToggle">
        <span class="slider"></span>
    </label>

    <span class="theme-icon moon">&#9790;</span>
</div>

<div class="login-wrapper">
    <div class="login-card">

        <div class="login-banner">
            <span class="login-eyebrow">
                UNIVERSITY EMPLOYMENT SYSTEM
            </span>

            <h1>HELLO AGAIN!</h1>
            <p>Your workspace is waiting.</p>
        </div>

        <?php if ($error !== ""): ?>
            <div class="login-error" id="login-error" role="status">
                <?php echo htmlspecialchars(
                    $error,
                    ENT_QUOTES,
                    "UTF-8"
                ); ?>
                <?php if ($lock_seconds > 0): ?>
                    <p>Try again in <strong id="lock-countdown" role="timer"
                        aria-live="off" data-seconds="<?php echo (int)$lock_seconds; ?>"><?php
                        echo sprintf('%02d:%02d', intdiv($lock_seconds,60), $lock_seconds%60);
                    ?></strong>.</p>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <form method="post"><?php echo csrf_field(); ?>

            <div class="form-group">
                <label for="username">USERNAME</label>

                <input
                    type="text"
                    id="username"
                    name="username"
                    class="form-control"
                    placeholder="Enter your username"
                    value="<?php echo htmlspecialchars(
                        $username,
                        ENT_QUOTES,
                        'UTF-8'
                    ); ?>"
                    autocomplete="username"
                    required
                >
            </div>

            <div class="form-group">
                <label for="password">PASSWORD</label>

                <input
                    type="password"
                    id="password"
                    name="password"
                    class="form-control"
                    placeholder="Enter your password"
                    autocomplete="current-password"
                    required
                >
            </div>

            <button type="submit" class="login-btn">
                LOG IN &rarr;
            </button>

        </form>

        <p class="login-footer">
            Don't have an account?
            <a href="register.php">Create Account</a>
        </p>

        <p class="login-footer">
            <a href="forgot_password.php">
                Forgot Password?
            </a>
        </p>

        <p class="login-footer">
            Authorized university staff only
        </p>

    </div>
</div>

</body>
</html>
