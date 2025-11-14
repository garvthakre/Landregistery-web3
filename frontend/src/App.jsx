import React from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { Upload, FileText, Users, LogOut, User } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider, useWallet } from './context/WalletContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UploadPage from './pages/UploadPage';
import VerifyPage from './pages/VerifyPage';
import TransferPage from './pages/TransferPage';

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🏛️ Land Registry System</h1>
            <p className="text-xs text-green-100 mt-1">
              Blockchain-based Land Management
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span>Upload</span>
            </Link>
            <Link 
              to="/verify" 
              className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Verify</span>
            </Link>
            <Link 
              to="/transfer" 
              className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>Transfer</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="bg-white/10 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <div>
                  <p className="text-xs text-green-100">
                    {isAdmin ? '👑 Admin' : '👤 User'}
                  </p>
                  <p className="text-sm font-semibold">{user?.name}</p>
                </div>
              </div>
            </div>

            {/* Wallet Status */}
            {account && (
              <div className="bg-white/10 px-4 py-2 rounded-lg">
                <p className="text-xs text-green-100">Wallet</p>
                <p className="text-sm font-mono">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navigation />}
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route
            path="/"
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
            path="/transfer"
            element={
              <ProtectedRoute>
                <TransferPage />
              </ProtectedRoute>
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