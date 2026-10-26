// App ka starting point: React ko index.html ke <div id="root"> me chalu karta hai.
// BrowserRouter = URL ke hisaab se page badalna (/roast, /camera ...).
import { StrictMode } from "react"; // development me extra checks
import { createRoot } from "react-dom/client"; // React ko page me lagane wala function
import { BrowserRouter } from "react-router"; // URL routing
import App from "./App"; // hamari main App
import "./index.css"; // global styles (Tailwind)

// StrictMode development me extra checks karta hai (production pe asar nahi)
createRoot(document.getElementById("root")).render( // #root div me render karo
  // sabse bahar wala element shuru
  <StrictMode>
    {/* routing chalu */}
    <BrowserRouter>
      {/* asli app */}
      <App />
      {/* BrowserRouter band */}
    </BrowserRouter>
    {/* StrictMode band */}
  </StrictMode>,
); // render band
