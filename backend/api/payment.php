<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') exit;

if ($method === 'POST') {
    // Simulate payment processing
    $data = json_decode(file_get_contents("php://input"));
    $booking_id = $data->booking_id ?? 0;
    
    // In a real app, this integrates with Stripe/Razorpay
    // Here we assume success 90% of the time, or whatever the client passes
    $success = $data->success ?? true;
    
    $status = $success ? 'Completed' : 'Failed';
    $transaction_id = "TXN" . time() . rand(1000, 9999);

    $stmt = $conn->prepare("INSERT INTO Payments (booking_id, status, transaction_id) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $booking_id, $status, $transaction_id);
    
    if ($stmt->execute()) {
        if ($status === 'Failed') {
            // Restore seats if failed
            $stmt = $conn->prepare("SELECT event_id, tickets_count FROM Bookings WHERE id = ?");
            $stmt->bind_param("i", $booking_id);
            $stmt->execute();
            $booking = $stmt->get_result()->fetch_assoc();
            
            $stmt = $conn->prepare("UPDATE Events SET available_seats = available_seats + ? WHERE id = ?");
            $stmt->bind_param("ii", $booking['tickets_count'], $booking['event_id']);
            $stmt->execute();
        }

        echo json_encode([
            "message" => "Payment " . strtolower($status),
            "status" => $status,
            "transaction_id" => $transaction_id
        ]);
    } else {
        echo json_encode(["error" => "Payment processing failed"]);
    }
} elseif ($method === 'GET') {
    // Analytics (revenue etc)
    // We'll put some basic analytics here
    $revenue_result = $conn->query("SELECT SUM(b.total_price) as total_revenue FROM Bookings b JOIN Payments p ON b.id = p.booking_id WHERE p.status = 'Completed'");
    $revenue = $revenue_result->fetch_assoc()['total_revenue'] ?? 0;

    $events_result = $conn->query("SELECT id, title, seats, (seats - available_seats) as booked_tickets FROM Events");
    $events = [];
    while ($row = $events_result->fetch_assoc()) {
        $events[] = $row;
    }

    echo json_encode([
        "total_revenue" => $revenue,
        "events_performance" => $events
    ]);
}
?>
