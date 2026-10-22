<?php
require_once __DIR__.'/config.php';
if (!isset($_SESSION['reset_user_id'],$_SESSION['reset_token'],$_SESSION['reset_expires']) || time()>$_SESSION['reset_expires']) {
    unset($_SESSION['reset_user_id'],$_SESSION['reset_token'],$_SESSION['reset_expires']);
    header('Location: forgot_password.php'); exit;
}
$error='';
if ($_SERVER['REQUEST_METHOD']==='POST') {
    $password=input('password',false); $confirm_password=input('confirm_password',false);
    if (strlen($password)<12 || strlen($password)>72) $error='Password must be between 12 and 72 bytes.';
    elseif ($password!==$confirm_password) $error='Passwords do not match.';
    else {
        $hash=password_hash($password,PASSWORD_DEFAULT); $digest=hash('sha256',$_SESSION['reset_token']);
        $s=$mysqli->prepare('UPDATE users SET password_hash=?,recovery_code_hash=NULL,failed_attempts=0,locked_until=NULL,session_version=session_version+1,reset_token_hash=NULL,reset_token_expires=NULL WHERE id=? AND reset_token_hash=? AND reset_token_expires>UTC_TIMESTAMP()');
        $s->bind_param('sis',$hash,$_SESSION['reset_user_id'],$digest); $s->execute();
        if ($s->affected_rows===1) { clear_session(); header('Location: login.php?reset=success'); exit; }
        unset($_SESSION['reset_user_id'],$_SESSION['reset_token'],$_SESSION['reset_expires']);
        $error='Reset authorization expired or was already used. Verify your recovery code again.';
    }
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1">

    <title>Reset Password | University Employment Details</title>
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
            <h1>NEW PASSWORD</h1>
            <p>Set a new password for your account.</p>
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
                <label for="password">NEW PASSWORD</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    class="form-control"
                    placeholder="At least 12 characters"
                    minlength="12"
                    autocomplete="new-password"
                    required
                >
            </div>

            <div class="form-group">
                <label for="confirm_password">
                    CONFIRM NEW PASSWORD
                </label>
                <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    class="form-control"
                    placeholder="Confirm your new password"
                    autocomplete="new-password"
                    required
                >
            </div>

            <button type="submit" class="login-btn">
                RESET PASSWORD →
            </button>
        </form>

        <p class="login-footer">
            <a href="login.php">← Back to Login</a>
        </p>

    </div>
</div>

</body>
</html>
