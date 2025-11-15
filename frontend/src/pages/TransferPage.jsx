import React, { useState, useEffect } from 'react';
import { Users, ArrowRight, Clock, Loader2, CheckCircle, Upload, FileText, XCircle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const TransferPage = () => {
  const { account, contract } = useWallet();
  const { user } = useAuth();
  const [allRecords, setAllRecords] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [completedTransfers, setCompletedTransfers] = useState([]);
  const [transferData, setTransferData] = useState({
    recordId: '',
    toUserAadhar: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  
  // State for document upload in pending transfer
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [uploadingTransferId, setUploadingTransferId] = useState(null);

  useEffect(() => {
    if (user) {
      loadAllRecords();
      loadTransfers();
    }
  }, [user]);

  const loadAllRecords = async () => {
    setLoadingRecords(true);
    try {
      const response = await fetch(`${API_URL}/records`);
      const result = await response.json();

      if (result.success) {
        setAllRecords(result.data);
      }
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const loadTransfers = async () => {
    try {
      const response = await fetch(`${API_URL}/transfer/history/all`);
      const result = await response.json();

      if (result.success) {
        // Filter pending transfers (where current user is recipient)
        const pending = result.transfers.filter(
          t => t.status === 'initiated' && 
          (t.toOwner.includes(user.aadharNo) || t.toAddress === user.walletAddress)
        );
        
        // Filter completed transfers
        const completed = result.transfers.filter(
          t => t.status === 'completed' &&
          (t.fromAddress?.toLowerCase() === account?.toLowerCase() ||
           t.toAddress?.toLowerCase() === account?.toLowerCase())
        );
        
        setPendingTransfers(pending);
        setCompletedTransfers(completed);
      }
    } catch (error) {
      console.error('Error loading transfers:', error);
    }
  };

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();

    if (!transferData.toUserAadhar || transferData.toUserAadhar.length !== 12) {
      alert('Please enter a valid 12-digit Aadhar number');
      return;
    }

    setLoading(true);
    try {
      const selectedRecord = allRecords.find(r => r.recordId.toString() === transferData.recordId);
      
      if (!selectedRecord) {
        alert('Record not found');
        setLoading(false);
        return;
      }

      const transferId = `TXF-${Date.now()}`;

      const response = await fetch(`${API_URL}/transfer/log-initiation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transferId,
          recordId: transferData.recordId,
          fromOwner: user.name,
          toOwner: `User with Aadhar: ${transferData.toUserAadhar}`,
          fromAddress: account,
          toAddress: user.walletAddress, // Demo: sending to self
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Transfer request sent successfully! Check Pending Transfers section.');
        setTransferData({ recordId: '', toUserAadhar: '' });
        await loadTransfers();
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

  const handleDocumentUpload = async (transferId) => {
    if (!docFile) {
      alert('Please select a document first');
      return;
    }

    setUploadingTransferId(transferId);
    setUploadingDoc(true);

    try {
      const transfer = pendingTransfers.find(t => t.transferId === transferId);
      if (!transfer) return;

      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('recordId', transfer.recordId);
      formData.append('expectedOwnerName', transfer.fromOwner);
      formData.append('expectedVillage', 'Demo Village');

      const response = await fetch(`${API_URL}/transfer/submit-document/${transferId}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert(result.verified 
          ? '✅ Document uploaded and verified! You can now accept the transfer.' 
          : '⚠️ Document uploaded but verification failed. Please check details.');
        
        setDocFile(null);
        const fileInput = document.getElementById(`doc-${transferId}`);
        if (fileInput) fileInput.value = '';
        
        await loadTransfers();
      } else {
        alert('❌ Upload failed: ' + result.error);
      }
    } catch (error) {
      console.error('Document upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploadingDoc(false);
      setUploadingTransferId(null);
    }
  };

  const handleAcceptTransfer = async (transferId) => {
    const transfer = pendingTransfers.find(t => t.transferId === transferId);
    
    if (!transfer.documentHash) {
      alert('Please upload a new document first');
      return;
    }

    if (!transfer.verificationResult?.isValid) {
      alert('Document verification failed. Cannot accept transfer.');
      return;
    }

    setLoading(true);
    try {
      // Complete the transfer on blockchain (simulated)
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      const blockNumber = Math.floor(Math.random() * 1000000);

      const response = await fetch(`${API_URL}/transfer/log-completion/${transferId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionHash: txHash,
          blockNumber: blockNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Transfer completed successfully!');
        await loadTransfers();
      } else {
        alert('❌ Failed to complete transfer');
      }
    } catch (error) {
      console.error('Accept transfer error:', error);
      alert('Failed to accept transfer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransfer = async (transferId) => {
    if (!confirm('Are you sure you want to cancel this transfer?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/transfer/log-cancellation/${transferId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelledBy: user.name,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Transfer cancelled');
        await loadTransfers();
      }
    } catch (error) {
      console.error('Cancel error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      initiated: 'bg-blue-100 text-blue-800',
      document_verified: 'bg-green-100 text-green-800',
      document_rejected: 'bg-red-100 text-red-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <p className="text-center text-gray-600">Please login to manage transfers</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 space-y-8">
      {/* Initiate Transfer Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">Initiate Land Transfer</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Start a transfer request that will appear in the recipient's pending transfers
        </p>

        <form onSubmit={handleInitiateTransfer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Land Record *
            </label>
            {loadingRecords ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">Loading records...</span>
              </div>
            ) : (
              <select
                value={transferData.recordId}
                onChange={(e) => setTransferData(prev => ({ ...prev, recordId: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a record</option>
                {allRecords.map((record) => (
                  <option key={record.recordId} value={record.recordId}>
                    Record #{record.recordId} - {record.ownerName} ({record.village})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient's Aadhar Number *
            </label>
            <input
              type="text"
              value={transferData.toUserAadhar}
              onChange={(e) => setTransferData(prev => ({ 
                ...prev, 
                toUserAadhar: e.target.value.replace(/\D/g, '').slice(0, 12)
              }))}
              required
              placeholder="Enter 12-digit Aadhar (use your own to test)"
              maxLength="12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {/* <p className="text-xs text-blue-600 mt-1">
              💡 Tip: Enter your own Aadhar number ({user.aadharNo}) to receive the transfer request
            </p> */}
          </div>

          <button
            type="submit"
            disabled={loading || loadingRecords}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending Request...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Send Transfer Request
              </>
            )}
          </button>
        </form>
      </div>

      {/* Pending Transfers Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-orange-600" />
          <h3 className="text-xl font-bold text-gray-800">
            Pending Transfer Requests ({pendingTransfers.length})
          </h3>
        </div>
        
        {pendingTransfers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No pending transfers</p>
        ) : (
          <div className="space-y-6">
            {pendingTransfers.map((transfer) => (
              <div
                key={transfer.transferId}
                className="p-6 border-2 border-orange-200 rounded-lg bg-orange-50"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-lg">Transfer #{transfer.transferId}</span>
                      {getStatusBadge(transfer.status)}
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong>Record:</strong> #{transfer.recordId}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>From:</strong> {transfer.fromOwner}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>To:</strong> {transfer.toOwner}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Initiated: {formatDate(transfer.initiatedAt)}
                    </p>
                  </div>
                </div>

                {/* Document Upload Section */}
                {!transfer.documentHash ? (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-300">
                    <div className="flex items-center gap-2 mb-3">
                      <Upload className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-800">Step 1: Upload New Document</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload the new land document with updated ownership details
                    </p>
                    <div className="flex gap-3">
                      <input
                        type="file"
                        id={`doc-${transfer.transferId}`}
                        onChange={(e) => setDocFile(e.target.files[0])}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => handleDocumentUpload(transfer.transferId)}
                        disabled={uploadingDoc && uploadingTransferId === transfer.transferId}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
                      >
                        {uploadingDoc && uploadingTransferId === transfer.transferId ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {/* Document Uploaded */}
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-800">
                          Document Uploaded
                        </span>
                      </div>
                      <p className="text-xs text-green-700">
                        Hash: {transfer.documentHash?.slice(0, 16)}...
                      </p>
                      {transfer.ipfsUrl && (
                        <a
                          href={transfer.ipfsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View on IPFS →
                        </a>
                      )}
                    </div>

                    {/* Verification Result */}
                    {transfer.verificationResult && (
                      <div className={`p-3 rounded-lg border ${
                        transfer.verificationResult.isValid
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {transfer.verificationResult.isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-sm font-semibold ${
                            transfer.verificationResult.isValid ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {transfer.verificationResult.message}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Accept/Cancel Buttons */}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleAcceptTransfer(transfer.transferId)}
                        disabled={loading || !transfer.verificationResult?.isValid}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Accept Transfer
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleCancelTransfer(transfer.transferId)}
                        disabled={loading}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Transfers */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-bold text-gray-800">
            Completed Transfers ({completedTransfers.length})
          </h3>
        </div>
        
        {completedTransfers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No completed transfers</p>
        ) : (
          <div className="space-y-3">
            {completedTransfers.map((transfer) => (
              <div
                key={transfer.transferId}
                className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Transfer #{transfer.transferId}</span>
                      {getStatusBadge(transfer.status)}
                    </div>
                    <p className="text-sm text-gray-600">Record: #{transfer.recordId}</p>
                    <p className="text-sm text-gray-600">From: {transfer.fromOwner}</p>
                    <p className="text-sm text-gray-600">To: {transfer.toOwner}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Completed: {formatDate(transfer.completedAt)}
                    </p>
                    {transfer.transactionHash && (
                      <p className="text-xs text-gray-500">
                        Tx: {transfer.transactionHash.slice(0, 16)}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferPage;