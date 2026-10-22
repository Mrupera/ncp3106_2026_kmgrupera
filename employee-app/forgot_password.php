<?php
require_once __DIR__.'/config.php';
$error=''; $username='';
if ($_SERVER['REQUEST_METHOD']==='POST') {
    rate_limit($mysqli,'recovery-ip:'.ip_key(),10,300);
    $username=input('username'); $recovery_code=input('recovery_code');
    rate_limit($mysqli,'recovery-name:'.strtolower($username),5,300);
    // Try an unexpired temporary code, then the saved recovery key.
        // Consume the temporary code by replacing its digest with a session-bound grant.
        $presented=hash('sha256',$recovery_code); $token=bin2hex(random_bytes(32)); $digest=hash('sha256',$token);
        $s=$mysqli->prepare("UPDATE users SET reset_token_hash=?,reset_token_expires=DATE_ADD(UTC_TIMESTAMP(),INTERVAL 10 MINUTE) WHERE username=? AND reset_token_hash=? AND reset_token_expires>UTC_TIMESTAMP() AND account_status='approved'");
        $s->bind_param('sss',$digest,$username,$presented); $s->execute();
        if ($s->affected_rows===1) {
            $s=$mysqli->prepare('SELECT id FROM users WHERE username=? AND reset_token_hash=?');
            $s->bind_param('ss',$username,$digest); $s->execute(); $grant=$s->get_result()->fetch_assoc();
            if ($grant) {
                session_regenerate_id(true); $_SESSION['reset_user_id']=(int)$grant['id'];
                $_SESSION['reset_token']=$token; $_SESSION['reset_expires']=time()+600; $_SESSION['csrf']=bin2hex(random_bytes(32));
                header('Location: reset_password.php'); exit;
            }
        }

    $s=$mysqli->prepare('SELECT id,recovery_code_hash FROM users WHERE username=?');
    $s->bind_param('s',$username); $s->execute(); $user=$s->get_result()->fetch_assoc();
    $dummy='$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
    if (password_verify($recovery_code,$user['recovery_code_hash']??$dummy) && $user && $user['recovery_code_hash']) {
        // Replace previous reset grants; the reset endpoint checks this stored digest.
        $token=bin2hex(random_bytes(32)); $digest=hash('sha256',$token);
        $s=$mysqli->prepare('UPDATE users SET reset_token_hash=?,reset_token_expires=DATE_ADD(UTC_TIMESTAMP(),INTERVAL 10 MINUTE) WHERE id=? AND recovery_code_hash=?');
        $s->bind_param('sis',$digest,$user['id'],$user['recovery_code_hash']); $s->execute();
        if ($s->affected_rows===1) {
            session_regenerate_id(true);
            $_SESSION['reset_user_id']=(int)$user['id']; $_SESSION['reset_token']=$token;
            $_SESSION['reset_expires']=time()+600; $_SESSION['csrf']=bin2hex(random_bytes(32));
            header('Location: reset_password.php'); exit;
        }
    }
    $error='Invalid username or recovery code, or the temporary code has expired.';
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1">

    <title>Forgot Password | University Employment Details</title>
    <link rel="stylesheet" href="style.css?v=<?php echo filemtime(__DIR__ . "/style.css"); ?>">
    <script src="theme.js" defer></script>
</head>
<body>

<div class="theme-toggle">
    <span class="theme-icon sun">☀</span>
    <label class="switch">
        <input type="checkbox" id="themeToggle">
        <span class="slider"></span>
    </label>
    <span class="theme-icon moon">☾</span>
</div>

<div class="login-wrapper">
    <div class="login-card">

        <div class="login-banner">
            <span class="login-eyebrow">
                UNIVERSITY EMPLOYMENT SYSTEM
            </span>
            <h1>FORGOT PASSWORD?</h1>
            <p>Recover access to your account.</p>
        </div>

        <?php if ($error !== ""): ?>
            <div class="login-error">
                <?php echo htmlspecialchars(
                    $error, ENT_QUOTES, "UTF-8"
                ); ?>
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
                        $username, ENT_QUOTES, 'UTF-8'
                    ); ?>"
                    required
                >
            </div>

            <div class="form-group">
                <label for="recovery_code">RECOVERY CODE</label>
                <input
                    type="text"
                    id="recovery_code"
                    name="recovery_code"
                    class="form-control"
                    placeholder="Enter your recovery code"
                    autocomplete="off"
                    required
                >
            </div>

            <p>Enter your saved recovery key or a temporary code given by your administrator.</p>
            <button type="submit" class="login-btn">
                VERIFY ACCOUNT →
            </button>
        </form>

        <p class="login-footer">
            <a href="login.php">← Back to Login</a>
        </p>

    </div>
</div>

</body>
</html>
