# ⚙️ Tectonix Backend API

The RESTful API service powering Tectonix, handling geospatial data, user authentication, and IoT sensor ingestion.

## 🔧 Technologies

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** PostgreSQL (via `pg` pool)
* **Geospatial:** PostGIS
* **Authentication:** JWT (JSON Web Tokens) + Bcrypt
* **File Handling:** Multer (for image uploads)

## 📦 Installation & Setup

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Database Configuration:**
    * Ensure PostgreSQL is running.
    * Create a database named `tectonix_db` (or your preference).
    * Execute the SQL commands in `controllers/tech.sql` to create tables and relationships.

4.  **Configure Environment:**
    Create a `.env` file in the `server/` root:
    ```env
    PORT=5000
    # Database Credentials
    DB_USER=postgres
    DB_PASSWORD=your_password
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=tectonix_db
    
    # Security
    JWT_SECRET=your_super_secret_jwt_key
    ```

5.  **Run the Server:**
    ```bash
    npm run dev
    ```
    The API will run at `http://localhost:5000`.

## 📡 Some Key API Endpoints

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | POST | `/api/auth/login` | User login & JWT generation |
| **Auth** | POST | `/api/auth/register` | Register new user (Owner/Specialist/etc.) |
| **Buildings** | GET | `/api/buildings` | Get list of buildings (Role filtered) |
| **Scanner** | POST | `/api/scanner/analyze` | Process image for structural damage |
| **Sensors** | GET | `/api/sensors/building/:id` | Get soil & liquefaction data |
| **Rescue** | GET | `/api/rescue/missions` | Get active distress beacons |