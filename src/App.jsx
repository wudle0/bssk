import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useCallback, createContext, useContext } from 'react';
import { RecordsProvider } from './context/RecordsContext';
import { UserProvider, useUser } from './context/UserContext';
import Header from './components/Header';
import Toast from './components/Toast';
import LoginModal from './components/LoginModal';
import MainPage from './pages/MainPage';
import WritePage from './pages/WritePage';
import DetailPage from './pages/DetailPage';
import EditPage from './pages/EditPage';
import './styles/main.scss';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

function AppInner() {
  const { user } = useUser();
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      <RecordsProvider>
        <div className="layout">
          <Header />
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/write" element={<WritePage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
            <Route path="/edit/:id" element={<EditPage />} />
          </Routes>
          {toast && (
            <Toast message={toast} onClose={() => setToast(null)} />
          )}
        </div>
        {!user && <LoginModal />}
      </RecordsProvider>
    </ToastContext.Provider>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </UserProvider>
  );
}
