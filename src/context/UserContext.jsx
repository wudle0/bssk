import { createContext, useContext, useState, useCallback } from 'react';
import { getMemberByBirthday } from '../utils/helpers';

const UserContext = createContext(null);

const STORAGE_KEY = 'dokto_user';

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => loadUser());

  const login = useCallback((name, birthday) => {
    const member = getMemberByBirthday(birthday);
    if (!member) return { success: false, message: '생년월일이 일치하는 멤버를 찾을 수 없어요.' };

    const userData = {
      key: member.key,
      displayName: name.trim() || member.fullName || member.key,
      color: member.color,
      colorPale: member.colorPale,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
