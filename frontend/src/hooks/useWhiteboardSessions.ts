import { useState, useEffect, useCallback } from "react";

interface Point { 
  x: number; 
  y: number; 
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

export type WhiteboardSession = {
  id: string;
  name: string;
  strokes: Stroke[];
  chatMessages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
};

const STORAGE_KEY = "whiteboard_sessions";
const CURRENT_SESSION_KEY = "current_session_id";

const generateId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useWhiteboardSessions = () => {
  const [sessions, setSessions] = useState<WhiteboardSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const currentId = localStorage.getItem(CURRENT_SESSION_KEY);
    
    if (stored) {
      const loadedSessions = JSON.parse(stored);
      const migratedSessions = loadedSessions.map((s: any) => ({
        ...s,
        chatMessages: s.chatMessages || []
      }));
      setSessions(migratedSessions);
    } else {
      const defaultSession: WhiteboardSession = {
        id: generateId(),
        name: "Whiteboard 1",
        strokes: [],
        chatMessages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions([defaultSession]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultSession]));
      localStorage.setItem(CURRENT_SESSION_KEY, defaultSession.id);
      setCurrentSessionId(defaultSession.id);
    }
    
    if (currentId) {
      setCurrentSessionId(currentId);
    }
  }, []);

  const saveSession = useCallback((sessionId: string, strokes: Stroke[], thumbnail?: string) => {
    setSessions((prev) => {
      const updated = prev.map((session) =>
        session.id === sessionId
          ? { ...session, strokes, updatedAt: Date.now(), thumbnail }
          : session
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const saveChatMessage = useCallback((sessionId: string, message: ChatMessage) => {
    setSessions((prev) => {
      const updated = prev.map((session) =>
        session.id === sessionId
          ? { 
              ...session, 
              chatMessages: [...(session.chatMessages || []), message],
              updatedAt: Date.now() 
            }
          : session
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const createNewSession = useCallback(() => {
    setSessions((prev) => {
      const newSession: WhiteboardSession = {
        id: generateId(),
        name: `Whiteboard ${prev.length + 1}`,
        strokes: [],
        chatMessages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const updated = [...prev, newSession];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(CURRENT_SESSION_KEY, newSession.id);
      setCurrentSessionId(newSession.id);
      
      return updated;
    });
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      
      setCurrentSessionId((currentId) => {
        if (sessionId === currentId) {
          const newCurrent = filtered[0]?.id || null;
          if (newCurrent) {
            localStorage.setItem(CURRENT_SESSION_KEY, newCurrent);
          } else {
            localStorage.removeItem(CURRENT_SESSION_KEY);
          }
          return newCurrent;
        }
        return currentId;
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });
  }, []);

  const switchSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
  }, []);

  const renameSession = useCallback((sessionId: string, newName: string) => {
    setSessions((prev) => {
      const updated = prev.map((session) =>
        session.id === sessionId
          ? { ...session, name: newName, updatedAt: Date.now() }
          : session
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || null;

  return {
    sessions,
    currentSessionId,
    currentSession,
    saveSession,
    saveChatMessage,
    createNewSession,
    deleteSession,
    switchSession,
    renameSession,
  };
};