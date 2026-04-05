import { useEffect } from "react";
import {
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import AboutPage from "./pages/AboutPage";
import AdminPage from "./pages/AdminPage";
import ChangelogPage from "./pages/ChangelogPage";
import CollectionDetailPage from "./pages/CollectionDetailPage";
import ConfiguratorPage from "./pages/ConfiguratorPage";
import DashboardPage from "./pages/DashboardPage";
import DocsPage from "./pages/DocsPage";
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
/** Initialises auth then renders downstream routes via <Outlet />. */
function AuthInit() {
  const initAuth = useAuthStore((s) => s.init);
  useEffect(() => {
    initAuth();
  }, [initAuth]);
  return <Outlet />;
}

/** Wraps the main app routes in the shared Layout. */
function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AuthInit />}>
      {/* Admin panel — its own layout */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/*" element={<AdminPage />} />

      {/* Main app — wrapped in shared Layout */}
      <Route element={<LayoutWrapper />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/configure" element={<ConfiguratorPage />} />
        <Route path="/configure/:id" element={<ConfiguratorPage />} />
        <Route path="/configs" element={<MyConfigsPage />} />
        <Route path="/shared/:shareToken" element={<SharedConfigPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/collections/:id" element={<CollectionDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Route>,
  ),
);

export default function App() {
  return <RouterProvider router={router} />;
}
