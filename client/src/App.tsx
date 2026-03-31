import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import AboutPage from "./pages/AboutPage";
import AdminPage from "./pages/AdminPage";
import ConfiguratorPage from "./pages/ConfiguratorPage";
import ExplorePage from "./pages/ExplorePage";
import HomePage from "./pages/HomePage";
import MyConfigsPage from "./pages/MyConfigsPage";
import SharedConfigPage from "./pages/SharedConfigPage";
import { useAuthStore } from "./store/authStore";

/**
 * Root application component.
 *
 * Initialises the anonymous auth session on mount, then renders the
 * React Router route tree.
 *
 * The `/admin` route renders outside of the main `<Layout>` (it has its own
 * header) and does not require the user's bearer token.
 */
export default function App() {
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Routes>
      {/* Admin panel — renders its own layout */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/*" element={<AdminPage />} />

      {/* Main app — wrapped in shared Layout */}
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/configure" element={<ConfiguratorPage />} />
              <Route path="/configure/:id" element={<ConfiguratorPage />} />
              <Route path="/configs" element={<MyConfigsPage />} />
              <Route
                path="/shared/:shareToken"
                element={<SharedConfigPage />}
              />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}
