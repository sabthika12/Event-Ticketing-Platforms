<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') exit;

if ($method === 'GET') {
    // Get bookings (all or by user)
    if (isset($_GET['user_id'])) {
        $user_id = intval($_GET['user_id']);
        $stmt = $conn->prepare("SELECT b.*, e.title, e.date, e.time, e.venue FROM Bookings b JOIN Events e ON b.event_id = e.id WHERE b.user_id = ? ORDER BY b.booking_date DESC");
        $stmt->bind_param("i", $user_id);
    } else {
        // Admin view - get all bookings with users and events
        $stmt = $conn->prepare("SELECT b.*, u.name as user_name, u.email as user_email, e.title as event_title FROM Bookings b JOIN Users u ON b.user_id = u.id JOIN Events e ON b.event_id = e.id ORDER BY b.booking_date DESC");
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $bookings[] = $row;
    }
    echo json_encode($bookings);
    
} elseif ($method === 'POST') {
    // Create a new booking
    $data = json_decode(file_get_contents("php://input"));
    $user_id = $data->user_id ?? 0;
    $event_id = $data->event_id ?? 0;
    $tickets_count = $data->tickets_count ?? 1;

    // First check seat availability
    $stmt = $conn->prepare("SELECT price, available_seats FROM Events WHERE id = ?");
    $stmt->bind_param("i", $event_id);
    $stmt->execute();
    $event = $stmt->get_result()->fetch_assoc();

    if (!$event) {
        echo json_encode(["error" => "Event not found"]);
        exit;
    }

    if ($event['available_seats'] < $tickets_count) {
        echo json_encode(["error" => "Not enough seats available"]);
        exit;
    }

    $total_price = $event['price'] * $tickets_count;

    // Start transaction
    $conn->begin_transaction();

    try {
        // Insert booking
        $stmt = $conn->prepare("INSERT INTO Bookings (user_id, event_id, tickets_count, total_price) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("iiid", $user_id, $event_id, $tickets_count, $total_price);
        $stmt->execute();
        $booking_id = $conn->insert_id;

        // Update available seats
        $stmt = $conn->prepare("UPDATE Events SET available_seats = available_seats - ? WHERE id = ?");
        $stmt->bind_param("ii", $tickets_count, $event_id);
        $stmt->execute();

        $conn->commit();
        echo json_encode([
            "message" => "Booking successful, proceed to payment", 
            "booking_id" => $booking_id,
            "total_price" => $total_price
        ]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["error" => "Booking failed: " . $e->getMessage()]);
    }
}
?>
