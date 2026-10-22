<?php  
require_once __DIR__ . "/auth.php";
require_admin(); 
require_once "config.php";
require_once __DIR__."/photo_helpers.php";

$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);
$error = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);

    if (!$id || $id < 1) {
        $error = "Invalid employee ID.";
    } else {
        $mysqli->begin_transaction();
        $photo_stmt=$mysqli->prepare('SELECT photo_file FROM demo2 WHERE id=? FOR UPDATE');
        $photo_stmt->bind_param('i',$id); $photo_stmt->execute();
        $photo_before=$photo_stmt->get_result()->fetch_assoc()['photo_file']??null;
        $sql = "DELETE FROM demo2 WHERE id = ?";
        $stmt = $mysqli->prepare($sql);

        if ($stmt) {
            $stmt->bind_param("i", $id);
            try { $deleted = $stmt->execute(); }
            catch (mysqli_sql_exception $ex) {
                if ((int)$ex->getCode() !== 1451) throw $ex;
                $deleted = false;
            }
            if ($deleted) {
                $mysqli->commit();
                if ($stmt->affected_rows > 0) {
                    $stmt->close();
                    delete_photo($photo_before);
                    header("Location: index.php");
                    exit();
                }
                $error = "Employee not found or already deleted.";
            } else {
                $mysqli->rollback();
                $error = "This employee is linked to an account. Revoke that account access before deleting the employee.";
            }
            $stmt->close();
        } else {
            $error = "Unable to prepare the delete query.";
        }
    }
} elseif (!$id || $id < 1) {
    header("Location: error.php");
    exit();
}
?>

<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <title>Delete Employee</title>

    <link rel="stylesheet"
          href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">

    <link rel="stylesheet" href="style.css?v=<?php echo filemtime(__DIR__ . "/style.css"); ?>">
    <script src="theme.js" defer></script>

    <link rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

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

    <div class="delete-wrapper">

        <div class="delete-card">

            <div class="delete-icon">
                <i class="bi bi-trash"></i>
            </div>

            <div class="delete-header">

                <h2>Delete Employee</h2>

                <p>
                    This action cannot be undone.
                </p>

            </div>

            <div class="delete-warning">
                Are you sure you want to delete this employee record?
            </div>

            <?php if ($error !== ""): ?>
                <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>"
                  method="post"><?php echo csrf_field(); ?>

                <input type="hidden"
                       name="id"
                       value="<?php echo htmlspecialchars((string)$id, ENT_QUOTES, 'UTF-8'); ?>">

                <input type="hidden"
                       name="confirm"
                       value="yes">

                <input type="submit"
                       class="delete-yes"
                       value="Yes, Delete">

                <a href="index.php"
                   class="delete-no">
                    Cancel
                </a>

            </form>

        </div>

    </div>

</body>

</html>