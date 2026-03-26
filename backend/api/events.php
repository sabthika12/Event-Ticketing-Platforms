<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') exit;

if ($method === 'GET') {
    // Get all events or a single event
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $stmt = $conn->prepare("SELECT * FROM Events WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            echo json_encode($result->fetch_assoc());
        } else {
            echo json_encode(["error" => "Event not found"]);
        }
    } else {
        $result = $conn->query("SELECT * FROM Events ORDER BY date ASC, time ASC");
        $events = [];
        while ($row = $result->fetch_assoc()) {
            $events[] = $row;
        }
        echo json_encode($events);
    }
} elseif ($method === 'POST') {
    // Create new event
    $data = json_decode(file_get_contents("php://input"));
    $title = $data->title ?? '';
    $desc = $data->description ?? '';
    $date = $data->date ?? '';
    $time = $data->time ?? '';
    $venue = $data->venue ?? '';
    $price = $data->price ?? 0;
    $seats = $data->seats ?? 0;

    $stmt = $conn->prepare("INSERT INTO Events (title, description, date, time, venue, price, seats, available_seats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssdii", $title, $desc, $date, $time, $venue, $price, $seats, $seats);
    
    if ($stmt->execute()) {
        echo json_encode(["message" => "Event created successfully", "id" => $conn->insert_id]);
    } else {
        echo json_encode(["error" => "Failed to create event"]);
    }
} elseif ($method === 'PUT') {
    // Update event
    $data = json_decode(file_get_contents("php://input"));
    $id = intval($_GET['id'] ?? 0);
    
    $title = $data->title ?? '';
    $desc = $data->description ?? '';
    $date = $data->date ?? '';
    $time = $data->time ?? '';
    $venue = $data->venue ?? '';
    $price = $data->price ?? 0;
    
    // We do not allow changing total seats easily here for simplicity, or we recalculate.
    $stmt = $conn->prepare("UPDATE Events SET title=?, description=?, date=?, time=?, venue=?, price=? WHERE id=?");
    $stmt->bind_param("sssssdi", $title, $desc, $date, $time, $venue, $price, $id);
    
    if ($stmt->execute()) {
        echo json_encode(["message" => "Event updated successfully"]);
    } else {
        echo json_encode(["error" => "Failed to update event"]);
    }
} elseif ($method === 'DELETE') {
    // Delete event
    $id = intval($_GET['id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM Events WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(["message" => "Event deleted successfully"]);
    } else {
        echo json_encode(["error" => "Failed to delete event"]);
    }
}
?>
