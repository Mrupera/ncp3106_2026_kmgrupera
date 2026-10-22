<?php
require_once __DIR__ . "/config.php";

$first_name = $last_name = $username = "";
$error = "";
$recovery_code = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    rate_limit($mysqli, "register:".ip_key(), 10, 3600);

    // Names identify the account holder; username remains the login identifier.
    $first_name = input("first_name");
    $last_name = input("last_name");
    $username = input("username");
    $password = $_POST["password"] ?? "";
    $confirm_password = $_POST["confirm_password"] ?? "";

    // Validate registration fields
    if (
        $first_name === "" ||
        $last_name === "" ||
        $username === "" ||
        $password === "" ||
        $confirm_password === ""
    ) {
        $error = "Please complete all fields.";

    } elseif (
        !preg_match("/\A[\p{L}\p{M}][\p{L}\p{M} .’'\-]{0,99}\z/u", $first_name) ||
        !preg_match("/\A[\p{L}\p{M}][\p{L}\p{M} .’'\-]{0,99}\z/u", $last_name)
    ) {
        $error = "Names must be 1 to 100 characters and contain letters, spaces, periods, apostrophes, or hyphens.";

    } elseif (strlen($username) < 3 || strlen($username) > 100) {
        $error = "Username must be between 3 and 100 characters.";

    } elseif (!preg_match("/^[a-zA-Z0-9_]+$/", $username)) {
        $error = "Username can only contain letters, numbers, and underscores.";

    } elseif (strlen($password) < 12 || strlen($password) > 72) {
        $error = "Password must be between 12 and 72 bytes.";

    } elseif ($password !== $confirm_password) {
        $error = "Passwords do not match.";

    } else {

        // Check if username already exists
        $stmt = $mysqli->prepare(
            "SELECT id FROM users WHERE username = ?"
        );

        $stmt->bind_param("s", $username);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            $error = "Username is already registered.";
        }

        $stmt->close();

        if ($error === "") {

            // Hash password before storing
            $password_hash = password_hash(
                $password,
                PASSWORD_DEFAULT
            );

            // Generate a secure recovery code
            $recovery_code = bin2hex(random_bytes(16));

            // Store only the recovery code hash
            $recovery_hash = password_hash(
                $recovery_code,
                PASSWORD_DEFAULT
            );

            // Insert new user into database
            $stmt = $mysqli->prepare(
                "INSERT INTO users
                (first_name, last_name, username, password_hash, recovery_code_hash)
                VALUES (?, ?, ?, ?, ?)"
            );

            $stmt->bind_param(
                "sssss",
                $first_name,
                $last_name,
                $username,
                $password_hash,
                $recovery_hash
            );

            try { $stmt->execute(); } catch (mysqli_sql_exception $ex) {

                $error = (int)$ex->getCode() === 1062
                    ? "Username is already registered."
                    : "Registration failed. Please try again.";

                $recovery_code = "";
            }

            $stmt->close();
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>Register | University Employment Details</title>
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

            <h1>CREATE ACCOUNT</h1>
            <p>Join the employment workspace.</p>
        </div>

        <!-- Display registration errors -->
        <?php if ($error !== ""): ?>
            <div class="login-error">
                <?php echo htmlspecialchars(
                    $error,
                    ENT_QUOTES,
                    "UTF-8"
                ); ?>
            </div>
        <?php endif; ?>

        <!-- Display recovery code after registration -->
        <?php if ($recovery_code !== ""): ?>

            <div class="recovery-notice">

                <h2>Account Request Submitted!</h2>

                <p>
                    Your account is waiting for administrator approval. Save this recovery code securely.
                    It will only be shown once.
                </p>

                <strong>
                    <?php echo htmlspecialchars(
                        $recovery_code,
                        ENT_QUOTES,
                        "UTF-8"
                    ); ?>
                </strong>

                <p>
                    You will need this code if
                    you forget your password.
                </p>

                <a href="login.php">Go to Login →</a>

            </div>

        <?php else: ?>

            <!-- Registration form -->
            <form action="register.php" method="post"><?php echo csrf_field(); ?>

                <div class="form-group">
                    <label for="first_name">FIRST NAME</label>
                    <input type="text" id="first_name" name="first_name"
                           class="form-control" placeholder="Enter your first name"
                           value="<?php echo e($first_name); ?>"
                           maxlength="100" autocomplete="given-name" required>
                </div>

                <div class="form-group">
                    <label for="last_name">LAST NAME</label>
                    <input type="text" id="last_name" name="last_name"
                           class="form-control" placeholder="Enter your last name"
                           value="<?php echo e($last_name); ?>"
                           maxlength="100" autocomplete="family-name" required>
                </div>

                <div class="form-group">
                    <label for="username">USERNAME</label>

                    <input
                        type="text"
                        id="username"
                        name="username"
                        class="form-control"
                        placeholder="Letters, numbers, and underscores"
                        value="<?php echo htmlspecialchars(
                            $username,
                            ENT_QUOTES,
                            'UTF-8'
                        ); ?>"
                        minlength="3"
                        maxlength="100"
                        pattern="[a-zA-Z0-9_]+"
                        title="Letters, numbers, and underscores only"
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
                        placeholder="At least 12 characters"
                        minlength="12"
                        autocomplete="new-password"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="confirm_password">CONFIRM PASSWORD</label>

                    <input
                        type="password"
                        id="confirm_password"
                        name="confirm_password"
                        class="form-control"
                        placeholder="Re-enter your password"
                        minlength="12"
                        autocomplete="new-password"
                        required
                    >
                </div>

                <button type="submit" class="login-btn">
                    CREATE ACCOUNT →
                </button>

            </form>

            <p class="login-footer">
                Already have an account?
                <a href="login.php">Login here</a>
            </p>

        <?php endif; ?>

    </div>
</div>

</body>
</html>
