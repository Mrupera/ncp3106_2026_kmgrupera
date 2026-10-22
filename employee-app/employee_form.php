<?php
if (PHP_SAPI !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(403); exit; }

require_once __DIR__.'/auth.php'; require_admin(); require_once __DIR__.'/layout.php'; require_once __DIR__.'/photo_helpers.php';
$id=$editing?filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT):null;
$departments=['IT','HR','Engineering','Accounting','Basic Ed','Registrar','Admissions','Library','Guidance','Administration','Faculty','Basic Education','College Education','Research','Student Affairs','Maintenance','Security','Clinic','Cashier','Scholarship','Marketing'];
$data=['first_name'=>'','last_name'=>'','sex'=>'','address'=>'','department'=>'','salary'=>'','status'=>'Probationary']; $error='';
if ($editing && $_SERVER['REQUEST_METHOD']!=='POST') {
    $person=$id?load_employee($mysqli,$id):null; if (!$person) { http_response_code(404); exit('Employee record not found.'); }
    foreach ($data as $key=>$_) $data[$key]=$person[$key]??'';
}
if ($_SERVER['REQUEST_METHOD']==='POST') {
    if ($editing) $id=filter_var(input('id'),FILTER_VALIDATE_INT);
    foreach ($data as $key=>$_) $data[$key]=input($key);
    foreach (['first_name','last_name'] as $key) if (!preg_match("/\A[\p{L}\p{M}][\p{L}\p{M} .’'\-]{0,99}\z/u",$data[$key])) $error='Enter valid first and last names of up to 100 characters.';
    if ($data['address']==='' || strlen($data['address'])>4000) $error='Enter an address up to 4000 bytes.';
    if (!in_array($data['department'],$departments,true) || !in_array($data['status'],['Regular','Probationary'],true)) $error='Select a valid department and status.';
    if (!preg_match('/\A\d{1,8}(?:\.\d{1,2})?\z/',$data['salary'])) $error='Enter a salary from 0 to 99999999.99.';
    if (!in_array($data['sex'],['Male','Female'],true) && !($editing && $data['sex']==='')) $error='Select Male or Female.';
    if ($editing && (!$id || !load_employee($mysqli,$id))) $error='Employee record not found.';
    $new=null;
    if ($error==='') {
        try {
            if (isset($_FILES['photo']) && ($_FILES['photo']['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_NO_FILE) $new=prepare_photo($_FILES['photo']);
            $sex=$data['sex']===''?null:$data['sex']; $mysqli->begin_transaction();
            if ($editing) {
                $s=$mysqli->prepare('SELECT photo_file FROM demo2 WHERE id=? FOR UPDATE'); $s->bind_param('i',$id); $s->execute(); $old=$s->get_result()->fetch_assoc();
                if (!$old) throw new InvalidArgumentException('Employee record no longer exists.');
                $photo=$new??$old['photo_file'];
                $s=$mysqli->prepare('UPDATE demo2 SET first_name=?,last_name=?,sex=?,address=?,department=?,salary=?,status=?,photo_file=? WHERE id=?');
                $s->bind_param('ssssssssi',$data['first_name'],$data['last_name'],$sex,$data['address'],$data['department'],$data['salary'],$data['status'],$photo,$id);
            } else {
                $s=$mysqli->prepare('INSERT INTO demo2(first_name,last_name,sex,address,department,salary,status,photo_file) VALUES(?,?,?,?,?,?,?,?)');
                $s->bind_param('ssssssss',$data['first_name'],$data['last_name'],$sex,$data['address'],$data['department'],$data['salary'],$data['status'],$new);
            }
            $s->execute(); $mysqli->commit(); if ($editing && $new) delete_photo($old['photo_file']);
            $_SESSION['approval_flash']=$editing?'Employee record updated.':'Employee record created.'; header('Location: index.php'); exit;
        } catch (Throwable $ex) {
            $mysqli->rollback(); if ($new) delete_photo($new);
            if ($ex instanceof InvalidArgumentException || $ex instanceof DomainException) $error=$ex->getMessage(); else throw $ex;
        }
    }
}
page_header($editing?'Edit Employee':'Add Employee',true); ?>
<section class="profile-card"><h3><?php echo $editing?'Update employee information':'Create an employee record'; ?></h3>
<?php if ($error!==''): ?><div class="portal-notice" role="alert"><?php echo e($error); ?></div><?php endif; ?>
<form method="post" enctype="multipart/form-data" class="employee-edit-form"><?php echo csrf_field(); ?><?php if ($editing): ?><input type="hidden" name="id" value="<?php echo (int)$id; ?>"><?php endif; ?>
<?php foreach (['first_name'=>'First name','last_name'=>'Last name'] as $key=>$label): ?><label><?php echo $label; ?><input type="text" name="<?php echo $key; ?>" maxlength="100" value="<?php echo e($data[$key]); ?>" required></label><?php endforeach; ?>
<label>Sex<select name="sex" <?php echo $editing?'':'required'; ?>><option value=""><?php echo $editing?'Not specified':'Select Male or Female'; ?></option><?php foreach (['Male','Female'] as $value): ?><option <?php echo $data['sex']===$value?'selected':''; ?>><?php echo $value; ?></option><?php endforeach; ?></select></label>
<label>Department<select name="department" required><option value="">Select department</option><?php foreach ($departments as $value): ?><option value="<?php echo e($value); ?>" <?php echo $data['department']===$value?'selected':''; ?>><?php echo e($value); ?></option><?php endforeach; ?></select></label>
<label class="form-full">Address<textarea name="address" rows="3" required><?php echo e($data['address']); ?></textarea></label>
<label>Salary<input type="number" name="salary" min="0" max="99999999.99" step="0.01" value="<?php echo e($data['salary']); ?>" required></label><label>Employment status<select name="status"><?php foreach (['Probationary','Regular'] as $value): ?><option <?php echo $data['status']===$value?'selected':''; ?>><?php echo $value; ?></option><?php endforeach; ?></select></label>
<label class="form-full">Employee photo (optional)<input type="file" name="photo" accept="image/jpeg,image/png,image/webp"><span class="profile-hint">Leave empty to use the demo cartoon. JPG, PNG or WebP, up to 2 MB.</span></label>
<div class="form-full record-actions"><button class="portal-button" type="submit"><?php echo $editing?'Save Changes':'Add Employee'; ?></button><a class="cancel-review" href="index.php">Cancel</a></div></form></section><?php page_footer(); ?>
