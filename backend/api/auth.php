<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') exit;

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $action = $_GET['action'] ?? '';

    if ($action === 'register') {
        $name = $data->name ?? '';
        $email = $data->email ?? '';
        $password = $data->password ?? '';
        $role = $data->role ?? 'User';

        if (!$name || !$email || !$password) {
            echo json_encode(["error" => "All fields are required"]);
            exit;
        }

        $stmt = $conn->prepare("SELECT id FROM Users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            echo json_encode(["error" => "Email already exists"]);
            exit;
        }

        $hashed_password = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $conn->prepare("INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $name, $email, $hashed_password, $role);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Registration successful"]);
        } else {
            echo json_encode(["error" => "Registration failed"]);
        }
    } elseif ($action === 'login') {
        $email = $data->email ?? '';
        $password = $data->password ?? '';

        if (!$email || !$password) {
            echo json_encode(["error" => "Email and password are required"]);
            exit;
        }

        $stmt = $conn->prepare("SELECT id, name, email, password, role FROM Users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            if (password_verify($password, $user['password'])) {
                unset($user['password']); // don't send password hash
                // in a real app use JWT/Sessions, here we return user data to mock a token-less session
                echo json_encode(["message" => "Login successful", "user" => $user]);
            } else {
                echo json_encode(["error" => "Invalid credentials"]);
            }
        } else {
            echo json_encode(["error" => "User not found"]);
        }
    }
}
?>
