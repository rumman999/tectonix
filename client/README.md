# 💻 Tectonix Frontend

The user interface for the Tectonix platform, built with modern React standards for high performance and interactivity.

## ⚡ Technologies

* **Framework:** React 18 + Vite
* **Language:** TypeScript
* **Styling:** Tailwind CSS + Shadcn UI
* **Animations:** Framer Motion
* **Maps:** React Leaflet + OpenStreetMap
* **Charts:** Recharts
* **State Management:** React Query (TanStack Query)

## 📦 Installation & Setup

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the `client/` root:
    ```env
    VITE_API_BASE_URL=http://localhost:5000
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The app will run at `http://localhost:5173`.

## 🧭 Some Key Directories

* `src/pages`: Main route components (Dashboard, AIScanner, RescueCoordinator).
* `src/components/dashboard`: Dashboard-specific widgets (Sidebar, AlertFeed, SeismicChart).
* `src/components/ui`: Reusable Shadcn UI components (Buttons, Cards, Dialogs).
* `src/hooks`: Custom hooks (useMobile, useToast).