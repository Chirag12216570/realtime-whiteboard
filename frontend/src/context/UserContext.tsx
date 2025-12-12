import React, { createContext, useContext, useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";

interface UserContextType {
  username: string;
  userId: string;
}

const UserContext = createContext<UserContextType>({
  username: "Anonymous",
  userId: "unknown",
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { keycloak } = useKeycloak();
  const [username, setUsername] = useState("Anonymous");
  const [userId, setUserId] = useState("unknown");

  useEffect(() => {
    if (keycloak.authenticated && keycloak.tokenParsed) {
      const preferredUsername = keycloak.tokenParsed.preferred_username || "Anonymous";
      const sub = keycloak.tokenParsed.sub || "unknown";
      
      setUsername(preferredUsername);
      setUserId(sub);
    }
  }, [keycloak.authenticated, keycloak.tokenParsed]);

  return (
    <UserContext.Provider value={{ username, userId }}>
      {children}
    </UserContext.Provider>
  );
};