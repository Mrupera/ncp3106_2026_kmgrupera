<?php
require_once __DIR__ . "/auth.php";
require_once __DIR__ . "/config.php";

$error = "";
$recovery_code = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    rate_limit($mysqli, "settings-user:".$_SESSION["user_id"], 5, 300);
    rate_limit($mysqli, "settings-ip:".ip_key(), 10, 300);
    $password = $_POST["password"] ?? "";
    $user_id = (int) $_SESSION["user_id"];

    $stmt = $mysqli->prepare(
        "SELECT password_hash FROM users WHERE id = ?"
    );
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user || !password_verify($password, $user["password_hash"])) {
        $error = "Incorrect password.";
    } else {
        $recovery_code = bin2hex(random_bytes(16));
        $recovery_hash = password_hash(
            $recovery_code,
            PASSWORD_DEFAULT
        );

        $stmt = $mysqli->prepare(
            "UPDATE users
             SET recovery_code_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL
             WHERE id = ? AND password_hash = ? AND session_version = ? AND account_status = 'approved'"
        );
        // Match the authority that admitted this request, even if revocation
        // committed after auth.php or while this update waited for a row lock.
        $session_version = (int) $_SESSION['session_version'];
        $stmt->bind_param("sisi", $recovery_hash, $user_id, $user['password_hash'], $session_version);

        if (!$stmt->execute() || $stmt->affected_rows !== 1) {
            $error = "Authorization changed. Sign in again before generating a recovery key.";
            $recovery_code = "";
        }

        $stmt->close();
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Recovery Settings | University Employment Details</title>
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
            <h1>RECOVERY SETTINGS</h1>
            <p>Generate a recovery code for your account.</p>
        </div>

        <?php if ($error !== ""): ?>
            <div class="login-error">
                <?php echo htmlspecialchars($error, ENT_QUOTES, "UTF-8"); ?>
            </div>
        <?php endif; ?>

        <?php if ($recovery_code !== ""): ?>
            <div class="recovery-notice">
                <h2>Your New Recovery Code</h2>
                <p>Save this code securely. It will only be shown once.</p>

                <strong>
                    <?php echo htmlspecialchars(
                        $recovery_code,
                        ENT_QUOTES,
                        "UTF-8"
                    ); ?>
                </strong>

                <p>Your previous recovery code is no longer valid.</p>
            </div>
        <?php else: ?>
            <form method="post"><?php echo csrf_field(); ?>
                <div class="form-group">
                    <label for="password">CURRENT PASSWORD</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        class="form-control"
                        autocomplete="current-password"
                        required
                    >
                </div>

                <button type="submit" class="login-btn">
                    GENERATE RECOVERY CODE →
                </button>
            </form>
        <?php endif; ?>

        <p class="login-footer">
            <a href="index.php">← Back to Employment Dashboard</a>
        </p>
    </div>
</div>

</body>
</html>
