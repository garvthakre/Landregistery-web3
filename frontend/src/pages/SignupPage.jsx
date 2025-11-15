import React, { useState, useEffect } from 'react';
import { User, Shield, Wallet, Loader2, CheckCircle, AlertCircle, Key } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

const AuthPage = ({ mode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    aadharNo: '',
    phoneNo: '',
    address: '',
    password: '',
    patwariId: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Connect Wallet, 2: Fill Form

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
          setStep(2);
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask to continue!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      setWalletConnected(true);
      setStep(2);
      setSuccess('Wallet connected successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Wallet connection error:', error);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setStep(1);
    setFormData({
      name: '',
      aadharNo: '',
      phoneNo: '',
      address: '',
      password: '',
      patwariId: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const payload = {
        ...formData,
        walletAddress: walletAddress
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(isLogin ? 'Login successful!' : 'Signup successful!');
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Redirect after 1 second
        setTimeout(() => {
          window.location.href = '/upload';
        }, 1000);
      } else {
        setError(result.error || (isLogin ? 'Login failed' : 'Signup failed'));
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({
      name: '',
      aadharNo: '',
      phoneNo: '',
      address: '',
      password: '',
      patwariId: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to access your land records' : 'Register for blockchain land registry'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-200 rounded-xl p-1 inline-flex">
            <button
              onClick={() => !isLogin && toggleMode()}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                isLogin
                  ? 'bg-white text-gray-800 shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => isLogin && toggleMode()}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                !isLogin
                  ? 'bg-white text-gray-800 shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Signup
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800">Success</h4>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Step 1: Connect Wallet */}
          {step === 1 && (
            <div className="text-center py-8">
              <div className="inline-flex p-6 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl mb-6">
                <Wallet className="w-16 h-16 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600 mb-6">
                Connect your MetaMask wallet to continue with {isLogin ? 'login' : 'registration'}
              </p>

              <button
                onClick={connectWallet}
                disabled={loading}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-6 h-6" />
                    Connect MetaMask
                  </>
                )}
              </button>

              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Important Notes:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• Make sure MetaMask is installed in your browser</li>
                  <li>• Each wallet address can only have one account</li>
                  <li>• Switch MetaMask accounts to create multiple users</li>
                  <li>• Your wallet address will be linked to your account</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Form */}
          {step === 2 && (
            <div>
              {/* Wallet Info */}
              <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-green-700 font-semibold">Connected Wallet</p>
                      <p className="text-sm font-mono text-green-800">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    Change Wallet
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required={!isLogin}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Aadhar Number * {!isLogin && '(12 digits)'}
                  </label>
                  <input
                    type="text"
                    name="aadharNo"
                    value={formData.aadharNo}
                    onChange={handleChange}
                    required
                    maxLength="12"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    placeholder="123456789012"
                  />
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number * (10 digits)
                    </label>
                    <input
                      type="text"
                      name="phoneNo"
                      value={formData.phoneNo}
                      onChange={handleChange}
                      required={!isLogin}
                      maxLength="10"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                      placeholder="9876543210"
                    />
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required={!isLogin}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter your address"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Key className="w-4 h-4 inline mr-1" />
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Patwari ID (Admin only - Optional)
                  </label>
                  <input
                    type="text"
                    name="patwariId"
                    value={formData.patwariId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="PAT1234567 (for admin access)"
                  />
                  {!isLogin && (
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty for regular user. Must start with 'PAT' and be 10 characters for admin.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isLogin ? 'Logging in...' : 'Creating account...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {isLogin ? 'Login' : 'Create Account'}
                    </span>
                  )}
                </button>
              </div>

              {/* Toggle Link */}
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={toggleMode}
                    className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                  >
                    {isLogin ? 'Sign up' : 'Log in'}
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>

         
        
      </div>
    </div>
  );
};

export default AuthPage;