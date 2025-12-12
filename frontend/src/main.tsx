import React from "react";
import ReactDOM from "react-dom/client";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "../src/auth/keyCloak";
import { UserProvider } from "./context/UserContext";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactKeycloakProvider authClient={keycloak}>
      <UserProvider>
        <App />
      </UserProvider>
    </ReactKeycloakProvider>
  </React.StrictMode>
);