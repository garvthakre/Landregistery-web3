import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Wallet, Upload, FileText, Users } from 'lucide-react';
import { WalletProvider, useWallet } from './context/WalletContext';
import UploadPage from './pages/UploadPage';
import VerifyPage from './pages/VerifyPage';
import TransferPage from './pages/TransferPage';

const Navigation = () => {
  const { account, connectWallet } = useWallet();

  return (
    <nav className="bg-white text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Land Registry System</h1>
          
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

          {!account ? (
            <button
              onClick={connectWallet}
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </button>
          ) : (
            <div className="bg-white/10 px-4 py-2 rounded-lg">
              <p className="text-sm">
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/transfer" element={<TransferPage />} />
          </Routes>
        </div>
      </div>
    </WalletProvider>
  );
}

export default App;
