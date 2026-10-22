<?php
require_once __DIR__.'/security.php';
if ($_SERVER['REQUEST_METHOD']!=='POST') { http_response_code(405); header('Allow: POST'); exit('Use the Logout button.'); }
clear_session(); header('Location: login.php'); exit;
