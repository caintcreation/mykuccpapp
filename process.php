<?php
/**
 * Chuka Student Services - Form Processing Backend
 * Handles form submissions, data storage, and notifications
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'chuka_student_services');

// Admin Contact Details
define('ADMIN_PHONE', '254XXXXXXXXX'); // Replace with actual WhatsApp number
define('ADMIN_EMAIL', 'admin@chukastudentservices.com');
define('BUSINESS_NAME', 'Chuka Student Services');

// Initialize response
$response = ['success' => false, 'message' => ''];

try {
    // Validate and sanitize input
    $formData = validateAndSanitize($_POST);
    
    // Connect to database
    $conn = connectDatabase();
    
    // Create tables if they don't exist
    createTables($conn);
    
    // Store submission in database
    $submissionId = storeSubmission($conn, $formData);
    
    if ($submissionId) {
        // Send email confirmation to client
        sendClientEmail($formData);
        
        // Send WhatsApp notification to admin
        sendAdminWhatsApp($formData, $submissionId);
        
        // Send email notification to admin
        sendAdminEmail($formData, $submissionId);
        
        $response['success'] = true;
        $response['message'] = 'Application submitted successfully';
        $response['submissionId'] = $submissionId;
        http_response_code(200);
    } else {
        $response['message'] = 'Failed to store submission';
        http_response_code(500);
    }
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
    http_response_code(500);
    error_log('Chuka Services Error: ' . $e->getMessage());
}

echo json_encode($response);
exit();

/**
 * Validate and sanitize form input
 */
function validateAndSanitize($data) {
    $required = ['service', 'fullName', 'phone', 'idNumber', 'kcseIndex', 'county', 'schoolName'];
    
    // Check required fields
    foreach ($required as $field) {
        if (empty($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Validate phone number format
    $phone = preg_replace('/[^0-9]/', '', $data['phone']);
    if (strlen($phone) < 10) {
        throw new Exception("Invalid phone number format");
    }
    
    // Validate email if provided
    if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }
    
    // Validate ID number
    if (!preg_match('/^\d{1,8}$/', $data['idNumber'])) {
        throw new Exception("Invalid ID number format");
    }
    
    // Sanitize text inputs
    $sanitized = [];
    foreach ($data as $key => $value) {
        if (is_string($value)) {
            $sanitized[$key] = htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
        } else {
            $sanitized[$key] = $value;
        }
    }
    
    return $sanitized;
}

/**
 * Connect to database
 */
function connectDatabase() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        // If database doesn't exist, create it
        $tempConn = new mysqli(DB_HOST, DB_USER, DB_PASS);
        if ($tempConn->connect_error) {
            throw new Exception("Database connection failed: " . $tempConn->connect_error);
        }
        
        $tempConn->query("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
        $tempConn->close();
        
        // Reconnect to the new database
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn->connect_error) {
            throw new Exception("Database connection failed: " . $conn->connect_error);
        }
    }
    
    $conn->set_charset("utf8mb4");
    return $conn;
}

/**
 * Create necessary database tables
 */
function createTables($conn) {
    $tables = [
        "CREATE TABLE IF NOT EXISTS submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            service VARCHAR(50) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            email VARCHAR(255),
            id_number VARCHAR(20) NOT NULL UNIQUE,
            kcse_index VARCHAR(50) NOT NULL,
            county VARCHAR(100) NOT NULL,
            school_name VARCHAR(255) NOT NULL,
            preferred_course VARCHAR(255),
            preferred_institution VARCHAR(255),
            cluster_grades VARCHAR(50),
            revision_needed VARCHAR(10),
            bank_details VARCHAR(255),
            guardian_name VARCHAR(255),
            guardian_phone VARCHAR(20),
            date_of_birth DATE,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            notes LONGTEXT,
            INDEX idx_phone (phone),
            INDEX idx_service (service),
            INDEX idx_status (status),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS file_uploads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            submission_id INT NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_type VARCHAR(50),
            file_size INT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
            INDEX idx_submission_id (submission_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        "CREATE TABLE IF NOT EXISTS admin_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            submission_id INT NOT NULL,
            action VARCHAR(100),
            details LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
            INDEX idx_submission_id (submission_id),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    ];
    
    foreach ($tables as $sql) {
        if (!$conn->query($sql)) {
            throw new Exception("Table creation failed: " . $conn->error);
        }
    }
}

/**
 * Store submission in database
 */
function storeSubmission($conn, $data) {
    $stmt = $conn->prepare("
        INSERT INTO submissions (
            service, full_name, phone, email, id_number, kcse_index, 
            county, school_name, preferred_course, preferred_institution,
            cluster_grades, revision_needed, bank_details, guardian_name,
            guardian_phone, date_of_birth, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    ");
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param(
        "ssssssssssssssss",
        $data['service'],
        $data['fullName'],
        $data['phone'],
        $data['email'] ?? null,
        $data['idNumber'],
        $data['kcseIndex'],
        $data['county'],
        $data['schoolName'],
        $data['preferredCourse'] ?? null,
        $data['preferredInstitution'] ?? null,
        $data['clusterGrades'] ?? null,
        $data['revisionNeeded'] ?? null,
        $data['bankDetails'] ?? null,
        $data['guardianName'] ?? null,
        $data['guardianPhone'] ?? null,
        $data['dateOfBirth'] ?? null
    );
    
    if (!$stmt->execute()) {
        // Check if it's a duplicate ID number
        if (strpos($stmt->error, 'Duplicate entry') !== false) {
            throw new Exception("This ID number has already been registered. Please contact support if this is an error.");
        }
        throw new Exception("Insert failed: " . $stmt->error);
    }
    
    $submissionId = $stmt->insert_id;
    $stmt->close();
    
    // Log the submission
    logAdminAction($conn, $submissionId, 'submission_created', 'New application submitted');
    
    return $submissionId;
}

/**
 * Send confirmation email to client
 */
function sendClientEmail($data) {
    $to = $data['email'] ?? 'noreply@chukastudentservices.com';
    $subject = "Application Received - " . BUSINESS_NAME;
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00C2A8, #FFEFb3); padding: 20px; border-radius: 8px; color: white; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; color: #666; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
            .highlight { color: #00C2A8; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>📚 Application Received!</h1>
            </div>
            
            <div class='content'>
                <p>Hello <span class='highlight'>" . htmlspecialchars($data['fullName']) . "</span>,</p>
                
                <p>Thank you for submitting your application to " . BUSINESS_NAME . "!</p>
                
                <p><strong>Application Details:</strong></p>
                <ul>
                    <li><strong>Service:</strong> " . htmlspecialchars($data['service']) . "</li>
                    <li><strong>Phone:</strong> " . htmlspecialchars($data['phone']) . "</li>
                    <li><strong>ID Number:</strong> " . htmlspecialchars($data['idNumber']) . "</li>
                </ul>
                
                <p><strong>What happens next?</strong></p>
                <ol>
                    <li>We will review your application within 30 minutes</li>
                    <li>You will receive a WhatsApp message with next steps</li>
                    <li>We will guide you through the official government portal</li>
                    <li>You'll get proof of submission for your records</li>
                </ol>
                
                <p style='background: #e8f5e9; padding: 15px; border-radius: 5px; border-left: 4px solid #10B981;'>
                    <strong>✓ Your data is secure:</strong> We use encrypted connections and never share your information with third parties.
                </p>
                
                <p>If you have any questions, feel free to contact us on WhatsApp or call us directly.</p>
                
                <p>Best regards,<br><strong>" . BUSINESS_NAME . " Team</strong></p>
            </div>
            
            <div class='footer'>
                <p>© 2024 " . BUSINESS_NAME . ". All rights reserved.</p>
                <p>Chuka, Tharaka Nithi County, Kenya</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8" . "\r\n";
    $headers .= "From: " . BUSINESS_NAME . " <noreply@chukastudentservices.com>" . "\r\n";
    
    // In production, use a proper email service like PHPMailer or SendGrid
    // For now, this is a placeholder
    @mail($to, $subject, $message, $headers);
}

/**
 * Send WhatsApp notification to admin
 */
function sendAdminWhatsApp($data, $submissionId) {
    $message = "🔔 *New Application Received!*\n\n";
    $message .= "📋 *Submission ID:* #" . $submissionId . "\n";
    $message .= "👤 *Name:* " . $data['fullName'] . "\n";
    $message .= "📱 *Phone:* " . $data['phone'] . "\n";
    $message .= "🆔 *ID:* " . $data['idNumber'] . "\n";
    $message .= "🎓 *Service:* " . $data['service'] . "\n";
    $message .= "📍 *County:* " . $data['county'] . "\n";
    $message .= "🏫 *School:* " . $data['schoolName'] . "\n";
    $message .= "⏰ *Time:* " . date('Y-m-d H:i:s') . "\n\n";
    $message .= "👉 Check admin dashboard for full details.";
    
    // Integration placeholder for WhatsApp Business API
    // In production, use Twilio, WhatsApp Business API, or similar service
    // Example with Twilio:
    // $client = new Twilio\Rest\Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    // $client->messages->create(
    //     "whatsapp:" . ADMIN_PHONE,
    //     array("from" => "whatsapp:" . TWILIO_PHONE, "body" => $message)
    // );
    
    // For now, log the message
    error_log("WhatsApp to Admin: " . $message);
}

/**
 * Send email notification to admin
 */
function sendAdminEmail($data, $submissionId) {
    $to = ADMIN_EMAIL;
    $subject = "[New Submission #" . $submissionId . "] " . $data['fullName'] . " - " . $data['service'];
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: #1E2A38; padding: 20px; border-radius: 8px; color: white; }
            .section { margin: 20px 0; padding: 15px; background: #f5f5f5; border-left: 4px solid #00C2A8; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; color: #1E2A38; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f0f0f0; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>📋 New Application Submission</h1>
                <p>Submission ID: <strong>#" . $submissionId . "</strong></p>
            </div>
            
            <div class='section'>
                <h3>Personal Information</h3>
                <table>
                    <tr>
                        <th>Field</th>
                        <th>Value</th>
                    </tr>
                    <tr>
                        <td>Full Name</td>
                        <td>" . htmlspecialchars($data['fullName']) . "</td>
                    </tr>
                    <tr>
                        <td>Phone Number</td>
                        <td>" . htmlspecialchars($data['phone']) . "</td>
                    </tr>
                    <tr>
                        <td>Email</td>
                        <td>" . htmlspecialchars($data['email'] ?? 'Not provided') . "</td>
                    </tr>
                    <tr>
                        <td>ID Number</td>
                        <td>" . htmlspecialchars($data['idNumber']) . "</td>
                    </tr>
                    <tr>
                        <td>KCSE Index</td>
                        <td>" . htmlspecialchars($data['kcseIndex']) . "</td>
                    </tr>
                    <tr>
                        <td>County</td>
                        <td>" . htmlspecialchars($data['county']) . "</td>
                    </tr>
                    <tr>
                        <td>School Name</td>
                        <td>" . htmlspecialchars($data['schoolName']) . "</td>
                    </tr>
                </table>
            </div>
            
            <div class='section'>
                <h3>Service Details</h3>
                <div class='field'>
                    <span class='label'>Service Selected:</span> " . htmlspecialchars($data['service']) . "
                </div>
                " . (isset($data['preferredCourse']) && $data['preferredCourse'] ? "
                <div class='field'>
                    <span class='label'>Preferred Course:</span> " . htmlspecialchars($data['preferredCourse']) . "
                </div>
                " : "") . "
                " . (isset($data['preferredInstitution']) && $data['preferredInstitution'] ? "
                <div class='field'>
                    <span class='label'>Preferred Institution:</span> " . htmlspecialchars($data['preferredInstitution']) . "
                </div>
                " : "") . "
            </div>
            
            <div class='section'>
                <h3>Next Steps</h3>
                <ol>
                    <li>Review the application details</li>
                    <li>Contact the applicant via WhatsApp to confirm details</li>
                    <li>Process the application through official portals</li>
                    <li>Send submission proof to the applicant</li>
                    <li>Update the admin dashboard with status</li>
                </ol>
            </div>
            
            <div class='section'>
                <p><strong>Received at:</strong> " . date('Y-m-d H:i:s') . "</p>
                <p><a href='#' style='color: #00C2A8; text-decoration: none;'>View in Admin Dashboard →</a></p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8" . "\r\n";
    $headers .= "From: " . BUSINESS_NAME . " <noreply@chukastudentservices.com>" . "\r\n";
    
    @mail($to, $subject, $message, $headers);
}

/**
 * Log admin action
 */
function logAdminAction($conn, $submissionId, $action, $details) {
    $stmt = $conn->prepare("INSERT INTO admin_log (submission_id, action, details) VALUES (?, ?, ?)");
    if ($stmt) {
        $stmt->bind_param("iss", $submissionId, $action, $details);
        $stmt->execute();
        $stmt->close();
    }
}
?>
