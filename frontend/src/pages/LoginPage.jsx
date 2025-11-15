import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useTranslation } from 'react-i18next';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { connectWallet } = useWallet();
  const [formData, setFormData] = useState({
    aadharNo: '',
    password: '',
    patwariId: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {t} = useTranslation();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First connect MetaMask
      if (!window.ethereum) {
        setError('Please install MetaMask to continue');
        setLoading(false);
        return;
      }

      await connectWallet();
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];

      // Then login with wallet address
      const result = await login({
        ...formData,
        walletAddress
      });

      if (result.success) {
        navigate('/upload');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Failed to connect wallet or login');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
      <h2 className='text-center font-bold'>{t("nav.login")}</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>{t("auth.aadhaarNumber")}</label>
          <input
            type="text"
            name="aadharNo"
            value={formData.aadharNo}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            className='border rounded-lg'
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>{t("auth.password")}</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            className='border rounded-lg'
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>{t("auth.patwariId")} (Admin only):</label>
          <input
            type="text"
            name="patwariId"
            value={formData.patwariId}
            onChange={handleChange}
            placeholder="Optional - for admin login"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            className='border rounded-lg'
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          {loading ? 'Connecting & Logging in...' : t("auth.loginButton")}
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        {t("auth.dontHaveAccount")}? <Link to="/signup">{t("nav.signup")}</Link>
      </p>
    </div>
  );
}

export default LoginPage;