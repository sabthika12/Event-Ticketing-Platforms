# End-to-End Event Lifecycle & Ticketing Platform

A full-stack web application designed for comprehensive event management, ticketing, and analytics. Built with modern, responsive Vanilla web technologies on the frontend and a scalable PHP backend.

## Tech Stack
- **Frontend**: HTML5, CSS3 (Glassmorphism, custom vars, flex/grid), ES6 Vanilla JS.
- **Backend**: PHP (REST API built for XAMPP or any Apache/Nginx + PHP environment).
- **Database**: MySQL.
- **Architecture**: Decoupled Client-Server architecture.

## System Modules
1. **Authentication:** Secure user registration, login, and session validation using password hashing.
2. **User Dashboard:** End-users can browse distinct upcoming events, book simulated tickets securely, and track booking history.
3. **Admin Dashboard:** Admins have full CRUD powers over events and can monitor top-level platform analytics.
4. **Ticketing System:** Available seat tracking and real-time database updates for ticket count.
5. **Payment Mock Integration:** Booking flow supports simulated payment success to validate end-to-end purchasing.

## Setup Instructions

### Prerequisites
- [XAMPP](https://www.apachefriends.org/index.html) or equivalent local PHP+MySQL server.
- Web browser (Chrome, Edge, Firefox, Safari).

### 1. Database Setup
1. Launch XAMPP and start **Apache** and **MySQL**.
2. Open **phpMyAdmin** (`http://localhost/phpmyadmin`).
3. Import the `database/schema.sql` file or run the queries manually to create the `event_ticketing` database and its tables (`Users`, `Events`, `Bookings`, `Payments`).

### 2. Backend Setup
1. Move or clone this entire repository into your XAMPP `htdocs` folder (e.g., `C:/xampp/htdocs/backend`). Ensure the folder structure points the API accurately.
2. In `backend/config.php`, ensure your MySQL credentials are correct.
   ```php
   $host = "localhost";
   $user = "root";
   $password = "";
   $database = "event_ticketing";
   ```

### 3. Frontend Setup
1. Navigate to the `frontend/js/app.js` file.
2. Verify the `API_URL` constant points to your local server (e.g., `http://localhost/YOUR_FOLDER/backend/api`). By default, it's set to `http://localhost/backend/api`.
3. Open `frontend/index.html` directly in your browser or run it via a Live Server extension to start interacting with the app.

## Project Structure
```text
/project-root
 ├── frontend/
 │    ├── index.html        (Public listing and auth modal)
 │    ├── dashboard.html    (Secured user/admin area)
 │    ├── css/
 │    │    └── style.css
 │    ├── js/
 │         └── app.js
 ├── backend/
 │    ├── config.php        (DB Connection)
 │    ├── api/
 │         ├── auth.php     (Login / Register)
 │         ├── events.php   (Events CRUD)
 │         ├── bookings.php (Ticket booking)
 │         └── payment.php  (Simulated payment processing)
 ├── database/
 │    └── schema.sql        (SQL structure)
 └── README.md
```

## Creating an Admin
To create an Admin user to test the Admin dashboard:
1. Register normally via the web interface.
2. Open phpMyAdmin and change the `role` column for your user from `User` to `Admin`.
3. Log out and log back in to access the Admin Panel.
