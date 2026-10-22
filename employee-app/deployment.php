<?php
if (PHP_SAPI !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(403); exit; }

// Place crud-private beside public_html, never inside it.
// Adjust this path to an allowed private directory if your account layout differs.
define('CRUD_PRIVATE_DIR', dirname(__DIR__).'/crud-private');
