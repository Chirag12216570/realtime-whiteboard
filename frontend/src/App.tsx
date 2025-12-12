import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { useUser } from "./context/UserContext";
import socket from "./socket/socket";
import Whiteboard from "./components/Whiteboard/Whiteboard";
import Chat from "./components/Chat/Chat";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const { keycloak, initialized } = useKeycloak();
  const { username } = useUser();
  const [connected, setConnected] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const roomId = "default";

  useEffect(() => {
    if (!keycloak?.authenticated) return;

    socket.connect();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [keycloak?.authenticated]);

  if (!initialized) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (!keycloak.authenticated) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
        <div className="text-center">
          <h3 className="mb-3">Realtime Whiteboard</h3>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => keycloak.login()}
          >
            Login with Keycloak
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column vh-100 vw-100">
      <nav className="navbar navbar-light bg-light border-bottom py-2 py-md-3">
        <div className="container-fluid px-2 px-md-3">
          <span className="navbar-brand mb-0 h5 h4-md h3-lg">
            Realtime Whiteboard
          </span>

          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-info text-dark">👤 {username}</span>

            <span
              className={`${
                connected ? "text-success" : "text-danger"
              } small`}
            >
              {connected ? "✅ Connected" : "❌ Connecting..."}
            </span>

            <button
              className="btn btn-outline-danger btn-sm"
              onClick={() => keycloak.logout()}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="d-flex flex-column flex-md-row flex-grow-1 overflow-hidden position-relative">

        <div className="flex-grow-1 position-relative overflow-hidden">
          <Whiteboard />
        </div>

        {showChat && (
          <div
            className="d-none d-md-block border-start"
            style={{ width: "400px", maxWidth: "400px" }}
          >
            <Chat roomId={roomId} onClose={() => setShowChat(false)} />
          </div>
        )}

        {showChat && (
          <div
            className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-white"
            style={{ zIndex: 2000 }}
          >
            <Chat roomId={roomId} onClose={() => setShowChat(false)} />
          </div>
        )}

        <button
          className={`btn btn-primary position-fixed shadow-lg ${
            showChat ? "d-md-none" : ""
          }`}
          style={{
            bottom: "20px",
            right: "20px",
            zIndex: 1000,
            borderRadius: "50%",
            width: "60px",
            height: "60px",
            fontSize: "24px",
            display: showChat ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowChat(true)}
          title="Open Chat"
        >
          💬
        </button>
      </div>
    </div>
  );
}

export default App;