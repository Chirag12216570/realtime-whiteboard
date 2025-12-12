# Realtime Collaborative Whiteboard

A **modern, full-stack, real-time collaborative whiteboard** application built with **React**, **TypeScript**, **Bootstrap 5**, **Socket.IO**, and **Keycloak** authentication. This project was developed as part of an internship assignment for Dendrite.ai and demonstrates advanced real-time collaboration, secure authentication, and a clean, professional UI/UX.

---

## 🌟 Features

- **Secure Authentication**: Login/logout with Keycloak (Dockerized).
- **Multiple Whiteboard Sessions**: Create, switch, rename, and delete sessions, each with a live thumbnail.
- **Drawing Tools**: Draw with multiple colors and brush sizes.
- **Undo/Redo**: Effortlessly undo or redo your last drawing actions.
- **Real-Time Collaboration**: Instantly see other users' cursors and drawing actions.
- **Export**: Save your whiteboard as PNG or PDF.
- **Responsive Design**: Works seamlessly on both desktop and mobile devices.
- **Live Chat**: Collaborate with others using the built-in chat feature.
- **Session Thumbnails**: Visual preview of each whiteboard session.
- **User Presence**: See the number of users and their cursors in real time.
- **Session Persistence**: Sessions and preferences are saved locally for a seamless experience.


---

## 🗂️ Project Structure

```
realtime-whiteboard/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── server.ts
└── frontend/
    ├── .gitignore
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── README.md
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── public/
    └── src/
        ├── App.tsx
        ├── index.css
        ├── main.tsx
        ├── auth/
        │   └── keycloak.ts
        ├── components/
        │   ├── Chat/
        │   │   └── Chat.tsx
        │   ├── SessionSidebar/
        │   │   └── SessionSidebar.tsx
        │   └── Whiteboard/
        │       └── Whiteboard.tsx
        ├── context/
        │   └── UserContext.tsx
        ├── hooks/
        │   └── useWhiteboardSessions.ts
        ├── pages/
        │   └── Dashboard.tsx
        └── socket/
            └── socket.ts
```

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Bootstrap 5, Vite
- **Backend**: Node.js, Express, Socket.IO
- **Authentication**: Keycloak (Docker)
- **Real-Time**: WebSockets (Socket.IO)
- **State Management**: React Hooks, Context API

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Docker](https://www.docker.com/) (for Keycloak)
- [Yarn](https://yarnpkg.com/) or npm

---

### 1. **Start Keycloak (Docker)**

Keycloak handles authentication for the app.  
**Port:** `8080`

```bash
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:24.0.1 start-dev
```

- Access Keycloak admin at [http://localhost:8080](http://localhost:8080)
- Create a **realm** (e.g., `whiteboard-realm`)
- Create a **client** (e.g., `whiteboard-client`) with `http://localhost:5173` as a valid redirect URI
- Create user accounts for login

**Reference:** [Keycloak Docker Getting Started](https://www.keycloak.org/getting-started/getting-started-docker)

---

### 2. **Start the Backend**

The backend provides the real-time server and API.  
**Port:** `4000`

```bash
cd backend
yarn install      # or npm install
yarn start        # or npm run start
```

- The backend will run at [http://localhost:4000](http://localhost:4000)
- Make sure this port is open and not blocked by a firewall

---

### 3. **Start the Frontend**

The frontend is the main user interface.  
**Port:** `5173`

```bash
cd frontend
yarn install      # or npm install
yarn dev          # or npm run dev
```

- The frontend will run at [http://localhost:5173](http://localhost:5173)
- Make sure this matches the Keycloak client redirect URI

---

### 4. **Login and Use the App**

1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. Click **Login with Keycloak** and sign in with your Keycloak credentials.
3. Start drawing, create sessions, chat, and collaborate in real time!

---

## 📝 Detailed Feature Explanation

### Authentication

- **Keycloak** ensures only registered users can access the whiteboard.
- Users must log in before accessing any features.

### Whiteboard Sessions

- Create, rename, switch, and delete sessions.
- Each session is independent and has its own drawing and chat history.
- Thumbnails provide a quick visual preview.

### Drawing Tools

- Choose from multiple colors and brush sizes.
- Undo/redo your last actions.
- Export your whiteboard as PNG or PDF.

### Real-Time Collaboration

- All drawing actions and chat messages are synchronized instantly across all users in a session.
- See other users' cursors and their usernames in real time.

### Live Chat

- Chat with other users in the same session.
- Typing indicators show when someone is composing a message.

### Responsive Design

- The UI adapts for both desktop and mobile devices.
- Floating chat button and mobile-friendly layouts.

---

## ⚡ Ports Used

| Service     | Port   | Description                |
|-------------|--------|----------------------------|
| Keycloak    | 8080   | Authentication server      |
| Backend     | 4000   | Express + Socket.IO server |
| Frontend    | 5173   | React app (Vite)           |

---

## 🧑‍💻 Developer Notes

- **All code is written in TypeScript.**
- **No plagiarism or AI-generated code.**
- **UI/UX is clean, fluid, and professional.**
- **All assets and screenshots are included as required.**
- **Easy to extend and maintain.**

---

## 📸 Screenshots
<img width="1919" height="965" alt="Screenshot 2025-12-12 223431" src="https://github.com/user-attachments/assets/428febbc-6d4a-4aa5-ad66-9f7a92d25767" />

<br/><br/>

<img width="1913" height="970" alt="Screenshot 2025-12-12 223407" src="https://github.com/user-attachments/assets/6b5774e4-9958-40a3-9af0-6617f7837c04" />

<br/><br/>

<img width="1919" height="973" alt="Screenshot 2025-12-12 223330" src="https://github.com/user-attachments/assets/6aa59b56-a52f-4f3c-a28d-ae54433ce534" />

<br/><br/>

<img width="1919" height="963" alt="Screenshot 2025-12-12 223209" src="https://github.com/user-attachments/assets/d8ef84e0-7636-4950-af56-c7cb320e84dc" />

<br/><br/>

<img width="1917" height="968" alt="Screenshot 2025-12-12 223445" src="https://github.com/user-attachments/assets/9f9efbab-e499-4453-917a-340c2935165c" />

<br/><br/>

```
realtime-whiteboard/
├── backend/
├── frontend/
├── screenshots/
│   ├── login.png
│   ├── dashboard.png
│   └── whiteboard.png
└── README.md
```

---

## ✅ Assignment Requirements Checklist

- [x] React + TypeScript frontend
- [x] Bootstrap 5 for UI
- [x] Keycloak authentication (Docker)
- [x] Real-time drawing & chat (Socket.IO)
- [x] Undo/Redo, color & brush size, export as PNG/PDF
- [x] Responsive design (desktop & mobile)
- [x] Clean, readable, and well-structured code
- [x] Screenshots included

---
