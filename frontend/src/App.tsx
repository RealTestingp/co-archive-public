/* App.tsx
   Every route in the application, and who is allowed to reach it.

   Three levels of access:
   - Public: /login only
   - Protected: needs a signed in session, wrapped in <ProtectedRoute>
   - Admin: needs a session AND the admin flag, wrapped in both guards

   The guards are components rather than a config object because that way the
   permission is visible on the route itself. Adding a route without thinking
   about access is harder when the wrapper is right there in the markup.

   Worth being clear about: these guards control what renders, not what the API
   will answer. They are a UI concern. Anything that actually needs securing has
   to be enforced by the backend as well.
*/
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
import ReportResultsPage from "./pages/ReportsResultsPage";
import ChatWidget from "./components/chatbot/ChatWidget";
import { NotificationsProvider } from "./context/NotificationsContext";
import NotificationToast from "./components/notifications/NotificationToast";

/* Split out from App so it can call useLocation, which only works inside
   BrowserRouter. A hook cannot be called in the same component that renders the
   router, so the routes live one level down. */
const AppRoutes = () => {
  const { pathname } = useLocation();
  /* No assistant on the login screen or the 404, where there is no archive
     context to ask about and the user may not be signed in. */
  const hideChatWidget = pathname === "/login" || pathname === "/404";

  return (
    /* Wraps every route, so a notification raised on one page survives
       navigation to another. */
    <NotificationsProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* There is no dashboard, so the root goes straight to search.
            replace: true keeps "/" out of history, otherwise the back button
            lands on the redirect and is immediately bounced forward again. */}
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
          path="/reports/results"
          element={
            <ProtectedRoute>
              <ReportResultsPage />
            </ProtectedRoute>
          }
        />
        {/* :id is a URL parameter, read with useParams inside the page. This is
            what makes the entity pages linkable and shareable, and it is why the
            cast lists can link straight to a person or a character. */}
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

        {/* Admin only. Both guards, nested: ProtectedRoute settles whether there
            is a session at all, then AdminRoute checks the role. Keeping them
            separate means a signed out user goes to login rather than being
            silently redirected to search as though they were an ordinary user. */}
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

        {/* Catch-all. Has to be last, since routes are matched in order. */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Outside <Routes> on purpose, so both persist across navigation instead
          of unmounting and losing their state every time the page changes. An
          open chat thread survives moving between pages because of this. */}
      {!hideChatWidget && <ChatWidget />}
      {!hideChatWidget && <NotificationToast />}
    </NotificationsProvider>
  );
};

function App() {
  return (
    /* BrowserRouter uses the real URL through the History API, so paths look
       normal rather than carrying a hash. That is exactly why nginx needs the
       try_files fallback to index.html: the server has no file at
       /productions/1, so without the fallback a refresh on that URL would 404
       before React ever runs. */
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;