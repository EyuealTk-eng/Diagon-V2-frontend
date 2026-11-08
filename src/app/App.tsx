import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "../components/ErrorBoundary";
import { Layout } from "../components/Layout";
import { RequireAuth } from "../components/RequireAuth";
import { AdminPage } from "../pages/AdminPage";
import { LoginPage, RegisterPage } from "../pages/AuthPages";
import { CategoriesPage } from "../pages/CategoriesPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ExplorePage } from "../pages/ExplorePage";
import { HomePage } from "../pages/HomePage";
import { AboutPage, HelpPage, NotFoundPage, SafetyPage, TermsPage } from "../pages/InfoPages";
import { ListingDetailPage } from "../pages/ListingDetailPage";
import { ProfilePage } from "../pages/ProfilePage";
import { SavedPage } from "../pages/SavedPage";
import { SellPage } from "../pages/SellPage";
import { AuthProvider } from "./auth";
import { I18nProvider } from "./i18n";
import { ReferenceProvider } from "./reference";

export function App() {
  return (
    <ErrorBoundary>
    <I18nProvider>
      <AuthProvider>
        <ReferenceProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="explore" element={<ExplorePage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="listings/:uuid" element={<ListingDetailPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="sell" element={<RequireAuth><SellPage /></RequireAuth>} />
                <Route path="listings/:uuid/edit" element={<RequireAuth><SellPage /></RequireAuth>} />
                <Route path="saved" element={<RequireAuth><SavedPage /></RequireAuth>} />
                <Route path="dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
                <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                <Route path="admin" element={<RequireAuth moderator><AdminPage /></RequireAuth>} />
                <Route path="about" element={<AboutPage />} />
                <Route path="safety" element={<SafetyPage />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ReferenceProvider>
      </AuthProvider>
    </I18nProvider>
    </ErrorBoundary>
  );
}
