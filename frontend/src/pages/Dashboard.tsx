import React, { useState } from "react";
import Whiteboard from "../components/Whiteboard/Whiteboard";
import Chat from "../components/Chat/Chat";

function Dashboard() {
  const [showChat, setShowChat] = useState(false);
  const roomId = "default";

  return (
    <div className="d-flex" style={{ height: "100vh" }}>
      <div className={`${showChat ? "col-md-8" : "col-12"} p-0`}>
        <Whiteboard />
      </div>

      {showChat && (
        <div className="col-md-4 border-start">
          <Chat roomId={roomId} />
        </div>
      )}

      <button
        className="btn btn-primary position-fixed"
        style={{
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          fontSize: "24px",
        }}
        onClick={() => setShowChat(!showChat)}
        title={showChat ? "Hide Chat" : "Show Chat"}
      >
        💬
      </button>
    </div>
  );
}

export default Dashboard;