import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SearchPage from "./pages/SearchPage";
import CharacterPage from "./pages/CharacterPage";
import PersonPage from "./pages/PersonPage";
import ProductionPage from "./pages/ProductionPage";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import ReportsPage from "./pages/ReportsPage";

function AppRoutes() {
  const { instance } = useMsal();

  useEffect(() => {
    instance.handleRedirectPromise().catch((e) => console.error(e));
  }, [instance]);

  return (
    <Routes>
      {/* Public route - login only */}
      <Route path="/login" element={<LoginPage />} />

      {/* All other routes require login */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search/results"
        element={
          <ProtectedRoute>
            <SearchResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
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
        path="/person/:id"
        element={
          <ProtectedRoute>
            <PersonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/production/:id"
        element={
          <ProtectedRoute>
            <ProductionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/character/:id"
        element={
          <ProtectedRoute>
            <CharacterPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
