import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import LoginPage from "./pages/LoginPage";
import SearchPage from "./pages/SearchPage";
import CharacterPage from "./pages/CharacterPage";
import PersonPage from "./pages/PersonPage";
import ProductionPage from "./pages/ProductionPage";
import ManageArchivePage from "./pages/ManageArchivePage";
import NotFoundPage from "./pages/NotFoundPage";
import ReportsPage from "./pages/ReportsPage";
import ChatWidget from "./components/chatbot/ChatWidget";
import { NotificationsProvider } from "./context/NotificationsContext";
import NotificationToast from "./components/NotificationToast";

const AppRoutes = () => {
  const { pathname } = useLocation();
  const hideChatWidget = pathname === "/login" || pathname === "/404";

  return (
    <NotificationsProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/search" replace />} />

        {/* Protected */}
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/persons/:id"
          element={
            <ProtectedRoute>
              <PersonPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/productions/:id"
          element={
            <ProtectedRoute>
              <ProductionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/characters/:id"
          element={
            <ProtectedRoute>
              <CharacterPage />
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/manage"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <ManageArchivePage />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {!hideChatWidget && <ChatWidget />}
      {!hideChatWidget && <NotificationToast />}
    </NotificationsProvider>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;