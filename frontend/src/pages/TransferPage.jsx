import React, { useState, useEffect } from 'react';
import { Users, ArrowRight, Clock, Loader2, CheckCircle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const TransferPage = () => {
  const { account } = useWallet();
  const { user } = useAuth();  // ADD THIS
  const [myRecords, setMyRecords] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [transferData, setTransferData] = useState({
    recordId: '',
    toUserAadhar: '',  // Changed from newOwnerAddress to Aadhar
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadMyRecords();
      loadPendingTransfers();
    }
  }, [user]);

  // Load records by user ID instead of wallet
  const loadMyRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/upload/history/user/${user.id}`);
      const result = await response.json();

      if (result.success) {
        setMyRecords(result.uploads);
      }
    } catch (error) {
      console.error('Error loading records:', error);
    }
  };

  const loadPendingTransfers = async () => {
    // For now, keep empty. Can be implemented later if needed
    setPendingTransfers([]);
  };

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();

    if (!transferData.toUserAadhar || transferData.toUserAadhar.length !== 12) {
      alert('Please enter a valid 12-digit Aadhar number');
      return;
    }

    setLoading(true);
    try {
      console.log('Initiating transfer for record:', transferData.recordId);
      console.log('To Aadhar:', transferData.toUserAadhar);
      
      const response = await fetch(`${API_URL}/upload/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: transferData.recordId,
          fromUserId: user.id,
          toUserAadhar: transferData.toUserAadhar,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Ownership transferred successfully!');
        setTransferData({ recordId: '', toUserAadhar: '' });
        await loadMyRecords();
      } else {
        alert('❌ Transfer failed: ' + result.error);
      }
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Transfer failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTransfer = async (transferId) => {
    // Not needed for demo - transfers are instant
    alert('Transfer acceptance not needed - transfers are instant in demo mode');
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <p className="text-center text-gray-600">
          Please login to manage transfers
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-8">
      {/* Initiate Transfer Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            Transfer Ownership
          </h2>
        </div>
        <p className="text-gray-600 mb-6">
          Transfer land ownership to another user using their Aadhar number (instant for demo)
        </p>

        <form onSubmit={handleInitiateTransfer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Your Record
            </label>
            <select
              value={transferData.recordId}
              onChange={(e) => setTransferData(prev => ({ 
                ...prev, 
                recordId: e.target.value 
              }))}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select a record</option>
              {myRecords.map((record) => (
                <option key={record.recordId} value={record.recordId}>
                  ID: {record.recordId} - {record.ownerName} ({record.village})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient's Aadhar Number
            </label>
            <input
              type="text"
              value={transferData.toUserAadhar}
              onChange={(e) => setTransferData(prev => ({ 
                ...prev, 
                toUserAadhar: e.target.value 
              }))}
              required
              placeholder="Enter 12-digit Aadhar number"
              maxLength="12"
              pattern="\d{12}"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the Aadhar number of the new owner
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Transfer Ownership
              </>
            )}
          </button>
        </form>
      </div>

      {/* My Records Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">My Records</h3>
        {myRecords.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No land records found</p>
        ) : (
          <div className="space-y-3">
            {myRecords.map((record) => (
              <div
                key={record.recordId}
                className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">
                      Record ID: {record.recordId}
                    </p>
                    <p className="text-sm text-gray-600">
                      Owner: {record.ownerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Village: {record.village}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Uploaded: {new Date(record.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {record.ipfsUrl && (
                    <a
                      href={record.ipfsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Document
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Transfers Section - Hidden for demo */}
      {/* <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-orange-600" />
          <h3 className="text-xl font-bold text-gray-800">
            Pending Transfers
          </h3>
        </div>
        <p className="text-gray-600 mb-6">
          Accept ownership transfers sent to you
        </p>

        <p className="text-gray-500 text-center py-8">
          Transfers are instant in demo mode
        </p>
      </div> */}
    </div>
  );
};

export default TransferPage;