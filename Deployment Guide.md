# Deployment Guide

This guide covers deploying the Chuka Student Services website to various hosting platforms.

## 🌐 Hosting Options

### 1. Shared Hosting (Recommended for Beginners)

**Platforms**: Bluehost, SiteGround, HostGator, Namecheap, etc.

**Steps:**
1. Purchase hosting plan with PHP 7.4+ and MySQL support
2. Access cPanel or similar control panel
3. Create MySQL database and user
4. Upload files via FTP/SFTP:
   - Use FileZilla or similar FTP client
   - Connect with provided credentials
   - Upload all files to `public_html` directory
5. Update database credentials in `process.php`
6. Change admin password in `admin.php`
7. Access your site at your domain

**FTP Upload:**
```bash
ftp your-hosting-server.com
# Enter username and password
cd public_html
put index.html
put process.php
put admin.php
put .htaccess
put README.md
put DEPLOYMENT.md
```

### 2. VPS (Virtual Private Server)

**Platforms**: DigitalOcean, Linode, Vultr, AWS Lightsail

**Steps:**
1. Create VPS instance (Ubuntu 20.04 or 22.04 recommended)
2. Connect via SSH:
```bash
ssh root@your-server-ip
```

3. Install required packages:
```bash
apt update
apt install -y apache2 mysql-server php php-mysql php-curl php-json
```

4. Enable Apache modules:
```bash
a2enmod rewrite
a2enmod headers
a2enmod deflate
systemctl restart apache2
```

5. Create MySQL database:
```bash
mysql -u root -p
CREATE DATABASE chuka_student_services;
CREATE USER 'chuka_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON chuka_student_services.* TO 'chuka_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

6. Upload files:
```bash
scp -r /path/to/chuka_student_services root@your-server-ip:/var/www/html/
```

7. Set permissions:
```bash
chown -R www-data:www-data /var/www/html/chuka_student_services
chmod -R 755 /var/www/html/chuka_student_services
mkdir -p /var/www/html/chuka_student_services/uploads
chmod 755 /var/www/html/chuka_student_services/uploads
```

8. Configure Apache virtual host:
```bash
nano /etc/apache2/sites-available/chuka.conf
```

Add:
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot /var/www/html/chuka_student_services
    
    <Directory /var/www/html/chuka_student_services>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/chuka_error.log
    CustomLog ${APACHE_LOG_DIR}/chuka_access.log combined
</VirtualHost>
```

9. Enable site and restart:
```bash
a2ensite chuka.conf
systemctl restart apache2
```

10. Install SSL certificate (Let's Encrypt):
```bash
apt install -y certbot python3-certbot-apache
certbot --apache -d yourdomain.com -d www.yourdomain.com
```

### 3. cPanel Hosting

**Platforms**: Any hosting with cPanel

**Steps:**
1. Log in to cPanel
2. Create MySQL database:
   - Go to MySQL Databases
   - Create database: `chuka_student_services`
   - Create user with password
   - Add user to database with all privileges

3. Upload files:
   - Use File Manager or FTP
   - Upload to `public_html` directory

4. Update `process.php` with database credentials:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'cpanel_username_chuka');
define('DB_PASS', 'your_password');
define('DB_NAME', 'cpanel_username_chuka_student_services');
```

5. Set file permissions:
   - Right-click files in File Manager
   - Change permissions to 644 for files, 755 for directories

6. Configure email:
   - Use cPanel's email accounts
   - Configure SMTP in `process.php`

### 4. Docker Deployment

**For containerized deployment:**

Create `Dockerfile`:
```dockerfile
FROM php:7.4-apache

RUN docker-php-ext-install mysqli pdo pdo_mysql

RUN a2enmod rewrite headers deflate

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

CMD ["apache2-foreground"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "80:80"
    environment:
      - DB_HOST=db
      - DB_USER=chuka_user
      - DB_PASS=secure_password
      - DB_NAME=chuka_student_services
    depends_on:
      - db
    volumes:
      - ./:/var/www/html

  db:
    image: mysql:5.7
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=chuka_student_services
      - MYSQL_USER=chuka_user
      - MYSQL_PASSWORD=secure_password
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

Deploy:
```bash
docker-compose up -d
```

## 🔐 SSL/HTTPS Setup

### Using Let's Encrypt (Free)

**On VPS:**
```bash
apt install certbot python3-certbot-apache
certbot --apache -d yourdomain.com
```

**On Shared Hosting:**
- Use cPanel's AutoSSL feature
- Or purchase SSL certificate from hosting provider

**Update .htaccess to redirect HTTP to HTTPS:**
```apache
<IfModule mod_rewrite.c>
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

## 📧 Email Configuration

### Using Gmail SMTP

Install PHPMailer:
```bash
composer require phpmailer/phpmailer
```

Update `process.php`:
```php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

function sendEmail($to, $subject, $message) {
    $mail = new PHPMailer(true);
    
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'your-email@gmail.com';
        $mail->Password = 'your-app-password'; // Use app password, not Gmail password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        
        $mail->setFrom('your-email@gmail.com', 'Chuka Student Services');
        $mail->addAddress($to);
        $mail->Subject = $subject;
        $mail->Body = $message;
        $mail->isHTML(true);
        
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Email error: " . $mail->ErrorInfo);
        return false;
    }
}
```

### Using SendGrid

```php
$sendgrid = new \SendGrid(getenv('SENDGRID_API_KEY'));

$email = new \SendGrid\Mail\Mail();
$email->setFrom("noreply@chukastudentservices.com", "Chuka Student Services");
$email->setSubject($subject);
$email->addTo($to);
$email->addContent("text/html", $message);

$sendgrid->send($email);
```

## 💬 WhatsApp Integration

### Using Twilio

1. Sign up for Twilio account
2. Get WhatsApp Business number
3. Install Twilio SDK:
```bash
composer require twilio/sdk
```

4. Update `process.php`:
```php
require_once 'vendor/autoload.php';
use Twilio\Rest\Client;

function sendWhatsAppMessage($phoneNumber, $message) {
    $accountSid = getenv('TWILIO_ACCOUNT_SID');
    $authToken = getenv('TWILIO_AUTH_TOKEN');
    $client = new Client($accountSid, $authToken);
    
    $message = $client->messages->create(
        "whatsapp:+254XXXXXXXXX", // Your WhatsApp number
        array(
            "from" => "whatsapp:+254XXXXXXXXX",
            "body" => $message
        )
    );
    
    return $message->sid;
}
```

### Using WhatsApp Business API

1. Apply for WhatsApp Business API access
2. Get approved business account
3. Configure webhook for incoming messages
4. Send messages via API

## 🗄️ Database Backup

### Automated Backups

**Create backup script** (`backup.sh`):
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/chuka"
mkdir -p $BACKUP_DIR

mysqldump -u chuka_user -p'secure_password' chuka_student_services > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

**Schedule with cron** (daily at 2 AM):
```bash
0 2 * * * /path/to/backup.sh
```

### Manual Backup

```bash
mysqldump -u chuka_user -p chuka_student_services > backup.sql
```

## 📊 Monitoring & Maintenance

### Set Up Monitoring

1. **Uptime Monitoring**: Use UptimeRobot or Pingdom
2. **Error Monitoring**: Use Sentry or Rollbar
3. **Performance Monitoring**: Use New Relic or DataDog

### Regular Maintenance Tasks

- Check error logs daily
- Review new submissions
- Respond to applications within 30 minutes
- Back up database weekly
- Update contact information
- Monitor server resources
- Test form submission monthly

## 🚨 Troubleshooting

### 500 Internal Server Error
- Check PHP error logs
- Verify database connection
- Check file permissions
- Review .htaccess syntax

### Database Connection Failed
- Verify credentials in `process.php`
- Check MySQL is running
- Ensure user has proper privileges
- Check firewall rules

### Email Not Sending
- Verify SMTP credentials
- Check mail server logs
- Test with different email address
- Review spam folder

### Form Submission Fails
- Check browser console for errors
- Verify PHP error logs
- Test database connection
- Check file upload permissions

## 📈 Performance Optimization

1. **Enable Caching**:
   - Browser caching (via .htaccess)
   - Server-side caching (Redis/Memcached)

2. **Optimize Images**:
   - Use WebP format
   - Compress images
   - Lazy load images

3. **Minify Assets**:
   - Minify CSS and JavaScript
   - Remove unused code

4. **Use CDN**:
   - Serve static assets from CDN
   - Reduce server load

5. **Database Optimization**:
   - Add indexes to frequently queried columns
   - Archive old submissions
   - Optimize queries

## 🔒 Security Hardening

1. **Change Default Credentials**:
   - Admin password
   - Database password
   - FTP/SSH password

2. **Enable HTTPS**:
   - Install SSL certificate
   - Redirect HTTP to HTTPS

3. **Firewall Configuration**:
   - Allow only necessary ports
   - Block suspicious IPs
   - Set up DDoS protection

4. **Regular Updates**:
   - Update PHP version
   - Update MySQL version
   - Update dependencies

5. **Security Headers**:
   - Already configured in .htaccess
   - Review and adjust as needed

## 📞 Support

For deployment issues, contact your hosting provider or refer to their documentation.

---

**Last Updated**: March 2024
