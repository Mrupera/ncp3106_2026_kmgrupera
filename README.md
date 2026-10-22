# University Employment System

A PHP and MySQL school project for managing employee records, account requests, employment status, and salaries.

**Live website:** [Open the University Employment System](https://rupera.alwaysdata.net/login.php)

**Source branch:** [employee-system](https://github.com/Mrupera/ncp3106_2026_kmgrupera/tree/employee-system)

**Deployment history:** [GitHub Actions](https://github.com/Mrupera/ncp3106_2026_kmgrupera/actions)

## Features

- Registration with first name, last name, username, and password confirmation.
- Administrator approval before a new account can sign in.
- Account linking to a verified employee record, with roles derived from department.
- Three unsuccessful login attempts trigger a five-minute lockout with a countdown.
- Password recovery using a saved recovery key or a temporary administrator-issued code.
- Employee records with department, sex, address, salary, employment status, and profile photo.
- Optional photo uploads with image validation and cartoon fallback portraits.
- Search, review dialogs, light/dark themes, and responsive layouts.
- Deployment from GitHub to Alwaysdata using HTTPS WebDAV.

## Access roles

| Role | Main permissions |
| --- | --- |
| Visitor | Login, register, or start account recovery; no employee records. |
| Employee | View their own employee information. |
| HR | Review employee information permitted to HR and update employment status; other employees' salaries and addresses are excluded. |
| Accounting | Review salary information and assign salaries; other employees' addresses are excluded. |
| Administrator | Manage employee records, review account requests, revoke access, remove rejected accounts, and assist with account recovery. |

Pending and rejected accounts cannot sign in. Registering does not automatically grant employee access. Account approval requires an administrator to verify and link the correct employee record; matching a name is not proof of identity.

## Technology

- PHP with MySQLi, GD, and Fileinfo.
- MySQL/MariaDB with InnoDB tables.
- HTML, CSS, and JavaScript.
- Apache-compatible hosting, developed locally with XAMPP.
- Alwaysdata for the hosted website and database.
- GitHub Actions for PHP syntax checks and source deployment.

## Repository structure

```text
.github/
  workflows/
    deploy-employee.yml       # Deployment workflow
employee-app/                # Public application source
  assets/                    # Demo illustrations and portraits
  config.php                 # Loads private database settings
  deployment.php             # Private-directory location
  security.php               # Session, CSRF, headers, and rate limits
  auth.php                   # Current account authentication
  access.php                 # Role and employee-record permissions
  index.php                  # Dashboard for the signed-in role
  login.php
  register.php
  account_action.php         # Approval, revocation, and rejected-account removal
  employee_action.php        # HR and Accounting updates
  photo.php                  # Permission-checked photo responses
  photo_helpers.php          # Image processing and private storage
  forgot_password.php
  reset_password.php
  recovery_settings.php
  admin_recovery.php
  create.php
  read.php
  update.php
  delete.php
  style.css
README.md
```

Database exports, real database credentials, uploaded employee photos, and the private emergency recovery script are intentionally not included in the repository.

## Running a separate local copy

1. Install XAMPP and start Apache and MySQL.
2. Place the contents of `employee-app` in your chosen Apache application directory.
3. Create a dedicated database and import the project SQL export obtained privately from the project owner. The repository alone does not contain the database schema/data needed to initialize the application.
4. Create a database user for this application. The shared-hosting version needs SELECT, INSERT, UPDATE, and DELETE permissions. Import/schema permissions should be handled separately where the host supports it.
5. Create a private directory outside Apache's document root, containing `database.php` and a writable `photos` directory. Restore authorized photo files privately if migrating existing records.
6. Edit `employee-app/deployment.php` (or its copied equivalent) to point to that private directory. The default path expects `crud-private` beside the public application directory; this must be adjusted if that would place private data inside a public document root.
7. Create the private `database.php` with your own settings:

```php
<?php
return [
    'host' => 'YOUR_DATABASE_HOST',
    'username' => 'YOUR_APPLICATION_DATABASE_USER',
    'password' => 'YOUR_DATABASE_PASSWORD',
    'database' => 'YOUR_DATABASE_NAME',
];
```

8. Enable GD and Fileinfo, then open `login.php` through Apache. Access from outside localhost requires HTTPS. The application needs PHP 8.1+; use a currently supported PHP release.

Use a trusted, private setup process to provision the first administrator. Public registration creates a pending employee account and cannot create an administrator. No administrator credentials are published here.

## Hosted deployment

The hosted application uses this layout:

```text
/home/<hosting-account>/
  www/                       # Contents of employee-app
  crud-private/              # Outside the public website
    database.php
    photos/
    recover_admin.php        # Private CLI-only emergency tool
```

The database is managed separately from the website code. Deploying a commit does not import SQL or synchronize database records.

The workflow runs when a push to `employee-system` changes `employee-app/**` or the deployment workflow itself. It:

1. Checks out the triggering commit.
2. Checks PHP syntax.
3. Uploads permitted application source and assets over HTTPS WebDAV.

It uses the restricted WebDAV user `rupera_deploy`, rooted at the public `www` directory, and the GitHub Actions secret `ALWAYSDATA_WEBDAV_PASSWORD`. Never paste that secret into source files or commit messages. The workflow does not delete remote files, upload the database, or upload private photos. Deployments replace files individually rather than switching the entire site atomically; removed source files require a separate reviewed cleanup.

This workflow targets Alwaysdata. It does not change GitHub Pages or deploy the `main` and `CPEWeb` branches. Those branches contain separate projects.

## Security measures and limits

- Prepared SQL statements for application queries.
- Password and saved recovery-key hashing.
- Server-side authentication, role checks, and own-record restrictions.
- CSRF validation on POST forms.
- Session regeneration, expiry, and version-based revocation.
- Login/recovery rate limits and temporary lockouts.
- Escaped HTML output and security response headers.
- Validated and re-encoded uploaded photos, stored outside the public folder and served through authorization checks.

The shared-hosting version removes rejected accounts through an administrator-only conditional DELETE. Unlike the original local stored procedure, the application database user's DELETE permission is not independently limited to rejected accounts. Protecting database credentials and enforcing application authorization remain essential.

The prepared deployment copy passed 202 local integration checks and syntax checks for 27 public PHP files. These checks do not prove that every vulnerability is absent or replace testing on the actual host. The deployment workflow checks syntax and uploads files; it does not run the database integration suite.

This is an educational project. Do not treat it as a production-ready HR/payroll system without further review, operational monitoring, backup/restore testing, and privacy controls. Public demonstrations should use authorized sample data. No system can guarantee that a breach will never occur.

## Trying the demo

Open the [live login page](https://rupera.alwaysdata.net/login.php). Ask the project owner privately for approved demonstration access. New registrations require administrator approval. Do not submit real personal information or publish passwords/recovery keys in GitHub issues.
