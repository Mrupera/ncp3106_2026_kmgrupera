<?php
if (PHP_SAPI !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(403); exit; }

require_once __DIR__.'/deployment.php';
function photo_directory(): string { return CRUD_PRIVATE_DIR.'/photos'; }
function photo_path(?string $name): ?string { return $name && preg_match('/\A[a-f0-9]{32}\.jpg\z/',$name) ? photo_directory().'/'.$name : null; }
function delete_photo(?string $name): void { $path=photo_path($name); if ($path && is_file($path)) unlink($path); }
function prepare_photo(array $file): string {
    if (($file['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK || !is_string($file['tmp_name']??null) || !is_uploaded_file($file['tmp_name'])) throw new InvalidArgumentException('Choose an image file to upload.');
    if (($file['size']??0)>2097152 || filesize($file['tmp_name'])>2097152) throw new InvalidArgumentException('Photo must be 2 MB or smaller.');
    $info=@getimagesize($file['tmp_name']); $mime=(new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!$info || !in_array($mime,['image/jpeg','image/png','image/webp'],true) || ($info['mime']??'')!==$mime) throw new InvalidArgumentException('Only valid JPG, PNG and WebP photos are accepted.');
    if ($info[0]>4096 || $info[1]>4096 || $info[0]*$info[1]>12000000) throw new InvalidArgumentException('Photo dimensions are too large. Use an image up to 4096 pixels per side.');
    if (!function_exists('imagecreatefromstring')) throw new DomainException('Photo processing is not enabled. Enable GD in your hosting PHP extensions.');
    $source=@imagecreatefromstring(file_get_contents($file['tmp_name']));
    if (!$source) throw new InvalidArgumentException('The photo could not be decoded.');
    $dest=imagecreatetruecolor(512,512); imagefill($dest,0,0,imagecolorallocate($dest,245,240,228));
    $side=min($info[0],$info[1]);
    imagecopyresampled($dest,$source,0,0,(int)(($info[0]-$side)/2),(int)(($info[1]-$side)/2),512,512,$side,$side);
    $name=bin2hex(random_bytes(16)).'.jpg';
    if (!is_dir(photo_directory()) || !imagejpeg($dest,photo_directory().'/'.$name,90)) throw new DomainException('Photo storage is unavailable.');
    imagedestroy($source); imagedestroy($dest); return $name;
}
