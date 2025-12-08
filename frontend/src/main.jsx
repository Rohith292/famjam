import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ChatProvider } from "./lib/chatContext.jsx";

import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ChatProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    </ChatProvider>
  </StrictMode>
);
