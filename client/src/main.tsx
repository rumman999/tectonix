import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import axios from "axios";
import { API_BASE_URL } from "./config"; 

// Global Axios Config
axios.defaults.baseURL = API_BASE_URL;

createRoot(document.getElementById("root")!).render(<App />);