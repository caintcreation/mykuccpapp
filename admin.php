<?php
/**
 * Chuka Student Services - Admin Dashboard
 * View and manage student applications
 */

session_start();

// Simple authentication (in production, use proper authentication)
define('ADMIN_PASSWORD', 'admin123'); // Change this in production

// Check if user is authenticated
$isAuthenticated = false;
if (isset($_SESSION['admin_authenticated']) && $_SESSION['admin_authenticated'] === true) {
    $isAuthenticated = true;
}

// Handle login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    if ($_POST['password'] === ADMIN_PASSWORD) {
        $_SESSION['admin_authenticated'] = true;
        $isAuthenticated = true;
    } else {
        $loginError = 'Invalid password';
    }
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit();
}

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'chuka_student_services');

// Connect to database
$conn = null;
$submissions = [];
$stats = [];

if ($isAuthenticated) {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn->connect_error) {
            throw new Exception("Database connection failed");
        }
        $conn->set_charset("utf8mb4");
        
        // Get statistics
        $statsQuery = "
            SELECT 
                COUNT(*) as total_submissions,
                SUM(CASE WHEN service = 'KUCCPS' THEN 1 ELSE 0 END) as kuccps_count,
                SUM(CASE WHEN service = 'HELB' THEN 1 ELSE 0 END) as helb_count,
                SUM(CASE WHEN service = 'KRA' THEN 1 ELSE 0 END) as kra_count,
                SUM(CASE WHEN service = 'Full Package' THEN 1 ELSE 0 END) as full_package_count,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_count,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
            FROM submissions
        ";
        $statsResult = $conn->query($statsQuery);
        if ($statsResult) {
            $stats = $statsResult->fetch_assoc();
        }
        
        // Get submissions with filters
        $filter = isset($_GET['filter']) ? $_GET['filter'] : 'all';
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        
        $query = "SELECT * FROM submissions WHERE 1=1";
        
        if ($filter !== 'all') {
            $query .= " AND status = '" . $conn->real_escape_string($filter) . "'";
        }
        
        if ($search) {
            $searchTerm = $conn->real_escape_string($search);
            $query .= " AND (full_name LIKE '%$searchTerm%' OR phone LIKE '%$searchTerm%' OR id_number LIKE '%$searchTerm%')";
        }
        
        $query .= " ORDER BY created_at DESC LIMIT 100";
        
        $result = $conn->query($query);
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $submissions[] = $row;
            }
        }
    } catch (Exception $e) {
        $dbError = $e->getMessage();
    }
}

// Handle status update
if ($isAuthenticated && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_status'])) {
    $submissionId = intval($_POST['submission_id']);
    $newStatus = $conn->real_escape_string($_POST['status']);
    
    $updateQuery = "UPDATE submissions SET status = '$newStatus' WHERE id = $submissionId";
    if ($conn->query($updateQuery)) {
        // Log the action
        $logQuery = "INSERT INTO admin_log (submission_id, action, details) VALUES ($submissionId, 'status_updated', 'Status changed to $newStatus')";
        $conn->query($logQuery);
        
        // Redirect to refresh
        header('Location: admin.php?filter=' . $filter . '&search=' . urlencode($search));
        exit();
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Chuka Student Services</title>
    <style>
        :root {
            --primary: #FFEFb3;
            --secondary: #1E2A38;
            --accent: #00C2A8;
            --cta: #FF7A00;
            --light-bg: #F8F9FA;
            --success: #10B981;
            --warning: #F59E0B;
            --error: #EF4444;
            --text-primary: #1F2937;
            --text-secondary: #6B7280;
            --spacing-md: 1rem;
            --spacing-lg: 1.5rem;
            --radius-md: 12px;
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--light-bg);
            color: var(--text-primary);
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: var(--spacing-lg);
        }

        /* Header */
        header {
            background: var(--secondary);
            color: white;
            padding: var(--spacing-lg);
            box-shadow: var(--shadow-md);
            margin-bottom: var(--spacing-lg);
        }

        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header-title {
            font-size: 1.75rem;
            font-weight: 700;
        }

        .logout-btn {
            background: var(--cta);
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: var(--radius-md);
            cursor: pointer;
            text-decoration: none;
            transition: background 0.3s;
        }

        .logout-btn:hover {
            background: #E56A00;
        }

        /* Login Form */
        .login-container {
            max-width: 400px;
            margin: 100px auto;
            background: white;
            padding: var(--spacing-lg) * 2;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-md);
            text-align: center;
        }

        .login-container h1 {
            margin-bottom: var(--spacing-lg);
            color: var(--secondary);
        }

        .login-container input {
            width: 100%;
            padding: var(--spacing-md);
            margin-bottom: var(--spacing-md);
            border: 1px solid #D1D5DB;
            border-radius: var(--radius-md);
            font-size: 1rem;
        }

        .login-container button {
            width: 100%;
            padding: var(--spacing-md);
            background: var(--accent);
            color: white;
            border: none;
            border-radius: var(--radius-md);
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }

        .login-container button:hover {
            background: #00A894;
        }

        .login-error {
            color: var(--error);
            margin-bottom: var(--spacing-md);
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: var(--spacing-lg);
            margin-bottom: var(--spacing-lg) * 2;
        }

        .stat-card {
            background: white;
            padding: var(--spacing-lg);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-md);
            border-left: 4px solid var(--accent);
        }

        .stat-card.pending {
            border-left-color: var(--warning);
        }

        .stat-card.completed {
            border-left-color: var(--success);
        }

        .stat-label {
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--secondary);
        }

        /* Filter Section */
        .filter-section {
            background: white;
            padding: var(--spacing-lg);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-md);
            margin-bottom: var(--spacing-lg);
            display: flex;
            gap: var(--spacing-lg);
            flex-wrap: wrap;
            align-items: center;
        }

        .filter-section input,
        .filter-section select {
            padding: 0.5rem var(--spacing-md);
            border: 1px solid #D1D5DB;
            border-radius: var(--radius-md);
            font-size: 0.95rem;
        }

        .filter-section input {
            flex: 1;
            min-width: 200px;
        }

        .filter-section button {
            background: var(--accent);
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: var(--radius-md);
            cursor: pointer;
            font-weight: 600;
            transition: background 0.3s;
        }

        .filter-section button:hover {
            background: #00A894;
        }

        /* Table */
        .table-container {
            background: white;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-md);
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background: var(--light-bg);
            padding: var(--spacing-md);
            text-align: left;
            font-weight: 600;
            color: var(--secondary);
            border-bottom: 2px solid #E5E7EB;
        }

        td {
            padding: var(--spacing-md);
            border-bottom: 1px solid #E5E7EB;
        }

        tr:hover {
            background: #FAFAFA;
        }

        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }

        .status-pending {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
        }

        .status-processing {
            background: rgba(59, 130, 246, 0.1);
            color: #3B82F6;
        }

        .status-completed {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .service-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            background: rgba(0, 194, 168, 0.1);
            color: var(--accent);
        }

        .action-buttons {
            display: flex;
            gap: 0.5rem;
        }

        .action-btn {
            padding: 0.4rem 0.8rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            transition: all 0.3s;
        }

        .btn-view {
            background: var(--accent);
            color: white;
        }

        .btn-view:hover {
            background: #00A894;
        }

        .btn-edit {
            background: #3B82F6;
            color: white;
        }

        .btn-edit:hover {
            background: #2563EB;
        }

        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: white;
            padding: var(--spacing-lg) * 2;
            border-radius: var(--radius-md);
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        }

        .modal-close {
            position: absolute;
            top: var(--spacing-lg);
            right: var(--spacing-lg);
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--text-secondary);
        }

        .modal-close:hover {
            color: var(--text-primary);
        }

        .modal h2 {
            color: var(--secondary);
            margin-bottom: var(--spacing-lg);
        }

        .modal-field {
            margin-bottom: var(--spacing-lg);
        }

        .modal-label {
            font-weight: 600;
            color: var(--secondary);
            margin-bottom: 0.5rem;
            display: block;
        }

        .modal-value {
            color: var(--text-secondary);
            padding: 0.5rem;
            background: var(--light-bg);
            border-radius: 4px;
        }

        .modal select {
            width: 100%;
            padding: var(--spacing-md);
            border: 1px solid #D1D5DB;
            border-radius: var(--radius-md);
            font-size: 1rem;
        }

        .modal-buttons {
            display: flex;
            gap: var(--spacing-md);
            margin-top: var(--spacing-lg) * 2;
        }

        .modal-buttons button {
            flex: 1;
            padding: var(--spacing-md);
            border: none;
            border-radius: var(--radius-md);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .modal-buttons .btn-primary {
            background: var(--accent);
            color: white;
        }

        .modal-buttons .btn-primary:hover {
            background: #00A894;
        }

        .modal-buttons .btn-secondary {
            background: var(--light-bg);
            color: var(--text-primary);
        }

        .modal-buttons .btn-secondary:hover {
            background: #E5E7EB;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: var(--spacing-md);
            }

            .filter-section {
                flex-direction: column;
            }

            .filter-section input {
                min-width: 100%;
            }

            table {
                font-size: 0.9rem;
            }

            th, td {
                padding: 0.75rem 0.5rem;
            }

            .action-buttons {
                flex-direction: column;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <?php if (!$isAuthenticated): ?>
        <div class="login-container">
            <h1>📚 Admin Dashboard</h1>
            <p style="margin-bottom: var(--spacing-lg); color: var(--text-secondary);">Chuka Student Services</p>
            
            <?php if (isset($loginError)): ?>
                <div class="login-error"><?php echo htmlspecialchars($loginError); ?></div>
            <?php endif; ?>
            
            <form method="POST">
                <input type="password" name="password" placeholder="Enter admin password" required autofocus>
                <button type="submit" name="login">Login</button>
            </form>
            
            <p style="margin-top: var(--spacing-lg); color: var(--text-secondary); font-size: 0.9rem;">
                Default password: admin123 (Change in production)
            </p>
        </div>
    <?php else: ?>
        <header>
            <div class="header-content">
                <div class="header-title">📊 Admin Dashboard</div>
                <a href="admin.php?logout=1" class="logout-btn">Logout</a>
            </div>
        </header>

        <div class="container">
            <?php if (isset($dbError)): ?>
                <div style="background: rgba(239, 68, 68, 0.1); color: var(--error); padding: var(--spacing-lg); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg);">
                    <strong>Database Error:</strong> <?php echo htmlspecialchars($dbError); ?>
                </div>
            <?php else: ?>
                <!-- Statistics -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Total Submissions</div>
                        <div class="stat-value"><?php echo $stats['total_submissions'] ?? 0; ?></div>
                    </div>
                    <div class="stat-card pending">
                        <div class="stat-label">Pending</div>
                        <div class="stat-value"><?php echo $stats['pending_count'] ?? 0; ?></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Processing</div>
                        <div class="stat-value"><?php echo $stats['processing_count'] ?? 0; ?></div>
                    </div>
                    <div class="stat-card completed">
                        <div class="stat-label">Completed</div>
                        <div class="stat-value"><?php echo $stats['completed_count'] ?? 0; ?></div>
                    </div>
                </div>

                <!-- Service Breakdown -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">KUCCPS</div>
                        <div class="stat-value"><?php echo $stats['kuccps_count'] ?? 0; ?></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">HELB</div>
                        <div class="stat-value"><?php echo $stats['helb_count'] ?? 0; ?></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">KRA PIN</div>
                        <div class="stat-value"><?php echo $stats['kra_count'] ?? 0; ?></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Full Package</div>
                        <div class="stat-value"><?php echo $stats['full_package_count'] ?? 0; ?></div>
                    </div>
                </div>

                <!-- Filter Section -->
                <div class="filter-section">
                    <form method="GET" style="display: flex; gap: var(--spacing-lg); flex-wrap: wrap; align-items: center; width: 100%;">
                        <input type="text" name="search" placeholder="Search by name, phone, or ID..." value="<?php echo htmlspecialchars($search); ?>">
                        <select name="filter">
                            <option value="all" <?php echo $filter === 'all' ? 'selected' : ''; ?>>All Status</option>
                            <option value="pending" <?php echo $filter === 'pending' ? 'selected' : ''; ?>>Pending</option>
                            <option value="processing" <?php echo $filter === 'processing' ? 'selected' : ''; ?>>Processing</option>
                            <option value="completed" <?php echo $filter === 'completed' ? 'selected' : ''; ?>>Completed</option>
                        </select>
                        <button type="submit">Search</button>
                    </form>
                </div>

                <!-- Submissions Table -->
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Service</th>
                                <th>County</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($submissions)): ?>
                                <tr>
                                    <td colspan="8" style="text-align: center; padding: var(--spacing-lg); color: var(--text-secondary);">
                                        No submissions found
                                    </td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($submissions as $submission): ?>
                                    <tr>
                                        <td><strong>#<?php echo $submission['id']; ?></strong></td>
                                        <td><?php echo htmlspecialchars($submission['full_name']); ?></td>
                                        <td><?php echo htmlspecialchars($submission['phone']); ?></td>
                                        <td><span class="service-badge"><?php echo htmlspecialchars($submission['service']); ?></span></td>
                                        <td><?php echo htmlspecialchars($submission['county']); ?></td>
                                        <td>
                                            <span class="status-badge status-<?php echo $submission['status']; ?>">
                                                <?php echo ucfirst($submission['status']); ?>
                                            </span>
                                        </td>
                                        <td><?php echo date('M d, Y', strtotime($submission['created_at'])); ?></td>
                                        <td>
                                            <div class="action-buttons">
                                                <button class="action-btn btn-view" onclick="viewSubmission(<?php echo $submission['id']; ?>, '<?php echo htmlspecialchars(json_encode($submission)); ?>')">View</button>
                                                <button class="action-btn btn-edit" onclick="editStatus(<?php echo $submission['id']; ?>, '<?php echo $submission['status']; ?>')">Edit</button>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>

        <!-- View Modal -->
        <div class="modal" id="viewModal">
            <div class="modal-content">
                <button class="modal-close" onclick="closeModal('viewModal')">×</button>
                <h2>Submission Details</h2>
                <div id="viewContent"></div>
            </div>
        </div>

        <!-- Edit Status Modal -->
        <div class="modal" id="editModal">
            <div class="modal-content">
                <button class="modal-close" onclick="closeModal('editModal')">×</button>
                <h2>Update Status</h2>
                <form method="POST" id="editForm">
                    <input type="hidden" name="submission_id" id="editSubmissionId">
                    <div class="modal-field">
                        <label class="modal-label">New Status</label>
                        <select name="status" required>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div class="modal-buttons">
                        <button type="submit" name="update_status" class="btn-primary">Update Status</button>
                        <button type="button" class="btn-secondary" onclick="closeModal('editModal')">Cancel</button>
                    </div>
                </form>
            </div>
        </div>

        <script>
            function viewSubmission(id, data) {
                const submission = JSON.parse(data);
                let html = '<div>';
                
                html += '<div class="modal-field">';
                html += '<span class="modal-label">Full Name</span>';
                html += '<div class="modal-value">' + submission.full_name + '</div>';
                html += '</div>';
                
                html += '<div class="modal-field">';
                html += '<span class="modal-label">Phone</span>';
                html += '<div class="modal-value">' + submission.phone + '</div>';
                html += '</div>';
                
                html += '<div class="modal-field">';
                html += '<span class="modal-label">Email</span>';
                html += '<div class="modal-value">' + (submission.email || 'Not provided') + '</div>';
                html += '</div>';
                
                html += '<div class="modal-field">';
                html += '<span class="modal-label">ID Number</span>';
                html += '<div class="modal-value">' + submission.id_number + '</div>';
                html += '</div>';
                
                html += '<div class="modal-field">';
                html += '<span class="modal-label">Service</span>';
                html += '<div class="modal-value">' + submission.service + '</div>';
                html += '</div>';
                
                html += '<div class="modal-field">';
                html += '<span class="modal-label">County</span>';
                html += '<div class="modal-value">' + submission.county + '</div>';
                html += '</div>';
                
                html += '<div class="modal-field">';
                html += '<span class="modal-label">School</span>';
                html += '<div class="modal-value">' + submission.school_name + '</div>';
                html += '</div>';
                
                html += '<div class="modal-field">';
                html += '<span class="modal-label">Status</span>';
                html += '<div class="modal-value">' + submission.status + '</div>';
                html += '</div>';
                
                html += '<div class="modal-field">';
                html += '<span class="modal-label">Submitted</span>';
                html += '<div class="modal-value">' + new Date(submission.created_at).toLocaleString() + '</div>';
                html += '</div>';
                
                html += '</div>';
                
                document.getElementById('viewContent').innerHTML = html;
                document.getElementById('viewModal').classList.add('active');
            }

            function editStatus(id, currentStatus) {
                document.getElementById('editSubmissionId').value = id;
                document.getElementById('editModal').querySelector('select').value = currentStatus;
                document.getElementById('editModal').classList.add('active');
            }

            function closeModal(modalId) {
                document.getElementById(modalId).classList.remove('active');
            }

            // Close modal when clicking outside
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            });
        </script>
    <?php endif; ?>
</body>
</html>
