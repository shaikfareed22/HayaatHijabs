import { createRoot } from "react-dom/client";
import AdminApp from "./AdminApp";
import "../index.css";

// No StrictMode - prevents double mount issues with Supabase locks (same as the store)
createRoot(document.getElementById("root")!).render(<AdminApp />);
