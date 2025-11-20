import { Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Upload, FileText, Users, LogOut, User, Feather } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WalletProvider, useWallet } from "./context/WalletContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UploadPage from "./pages/UploadPage";
import VerifyPage from "./pages/VerifyPage";
import TransferPage from "./pages/TransferPage";
import ALanding from "./pages/A-Landing";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./components/LanguageSwitcher";
import HistoryPage from "./pages/HistoryPage";
import AuthPage from "./pages/SignupPage";
import PatwariGeoTagging from "./pages/PatwariGeoTagging";
import AdminGeoVerification from "./pages/AdminGeoVerification";
import AdminVerifyPage from "./pages/AdminVerifyPage";
import { MapPin } from "lucide-react";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const Navigation = () => {
  const { user, logout, isAdmin } = useAuth();
  const { account } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const {t} = useTranslation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white text-black relative z-20">
      <div className="px-4 py-6 border-b border-gray-400">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/">
              <h1 className="text-2xl font-bold custom-font text-emerald-600 tracking-wide ml-6">{t("nav.title")}</h1>
            </Link>
          </div>

          {(location.pathname === "/")
            ?
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                <span>{t("nav.features")}</span>
              </Link>
              <Link
                to="/"
                className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                <span>{t("nav.seeInAction")}</span>
              </Link>
              <Link
                to="/"
                className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                <span>{t("nav.workflow")}</span>
              </Link>
            </div>
            :
            <div className="flex items-center gap-6">
              <Link
                to="/upload"
                className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span>{t("nav.upload")}</span>
              </Link>
              <Link
                to="/verify"
                className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>{t("nav.verify")}</span>
              </Link>
              <Link
                to="/transfer"
                className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>{t("nav.transfer")}</span>
              </Link>
              {isAdmin && (
                <Link
                  to="/admin-geo-verification"
                  className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  <span>Geo Verification</span>
                </Link>
              )}
            </div>
          }

          {(location.pathname === "/")
            ?
            <div className="flex items-center gap-4">
              <LanguageSwitcher />

              <button
                onClick={() => navigate("/signup")}
                className="bg-gray-300 text-black px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {t("nav.signup")}
              </button>

              {account && (
                <div className="bg-gray-300 px-4 py-2 rounded-lg">
                  <p className="text-xs text-gray-700 font-bold">Wallet</p>
                  <p className="text-sm font-mono">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                </div>
              )}

              <button
                onClick={() => navigate("/login")}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {t("nav.login")}
              </button>
            </div>
            :
            <div className="flex items-center gap-4">
              <LanguageSwitcher />

              <div className="bg-gray-300 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex gap-3 items-center justify-center">
                    <User className="w-4 h-4" />
                    <p className="text-xs font-bold text-gray-700">
                      {isAdmin ? "Admin" : "User :"}
                    </p>
                    <p className="text-sm font-semibold">{user?.name}</p>
                  </div>
                </div>
              </div>

              {account && (
                <div className="bg-gray-300 px-4 py-2 rounded-lg">
                  <p className="text-xs text-gray-700 font-bold">Wallet</p>
                  <p className="text-sm font-mono">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          }
        </div>
      </div>
    </nav>
  );
};

const AppContent = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className={useLocation().pathname === "/" ? "" : "container mx-auto px-4 py-2"}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={< AuthPage />} />

          <Route
            path="/"
            element={<ALanding />}
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verify"
            element={
              <ProtectedRoute>
                <VerifyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-geo-verification"
            element={
              <ProtectedRoute>
                <AdminGeoVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tag-verify"
            element={
              <ProtectedRoute>
                <AdminVerifyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfer"
            element={
              <ProtectedRoute>
                <TransferPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/map"
            element={
              <PatwariGeoTagging />
            }
          />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <AppContent />
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;