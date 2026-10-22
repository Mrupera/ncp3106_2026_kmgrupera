<?php
if (PHP_SAPI !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(403); exit; }

require_once __DIR__ . '/security.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
set_exception_handler(function (Throwable $error): void {
    error_log('CRUD application error: '.$error->getMessage());
    http_response_code(500);
    exit('The service is temporarily unavailable. Please try again later.');
});
require_once __DIR__.'/deployment.php';
$settings = require CRUD_PRIVATE_DIR.'/database.php';
$mysqli = new mysqli($settings['host'], $settings['username'], $settings['password'], $settings['database']);
$mysqli->set_charset('utf8mb4');
$mysqli->query("SET time_zone = '+00:00'");
