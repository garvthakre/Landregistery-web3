import React, { useState, useEffect } from 'react';
import { Users, ArrowRight, Clock, Loader2, CheckCircle, Upload, FileText, XCircle, AlertCircle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const TransferPage = () => {
  const { account, contract } = useWallet();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myRecords, setMyRecords] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [activeTab, setActiveTab] = useState('initiate');
  
  // Initiate transfer state
  const [transferData, setTransferData] = useState({
    recordId: '',
    newOwnerAddress: '',
  });
  
  // Document upload state
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    if (contract && account) {
      loadRecords();
      loadPendingTransfers();
    }
  }, [contract, account]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const recordIds = await contract.getRecordsByOwner(account);
      const records = await Promise.all(
        recordIds.map(async (id) => {
          const record = await contract.getRecord(id);
          return {
            id: id.toString(),
            ownerName: record[0],
            village: record[1],
            ipfsCID: record[2],
            currentOwner: record[5],
          };
        })
      );
      setMyRecords(records);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingTransfers = async () => {
    try {
      const transferIds = await contract.getPendingTransfers(account);
      const transfers = await Promise.all(
        transferIds.map(async (id) => {
          const transfer = await contract.getTransferRequest(id);
          const record = await contract.getRecord(transfer.recordId);
          
          return {
            transferId: id.toString(),
            recordId: transfer.recordId.toString(),
            fromOwner: transfer.fromOwner,
            toOwner: transfer.toOwner,
            documentVerified: transfer.documentVerified,
            isActive: transfer.isActive,
            ownerName: record[0],
            village: record[1],
            newDocumentHash: transfer.newDocumentHash,
            newIpfsCID: transfer.newIpfsCID,
          };
        })
      );
      setPendingTransfers(transfers);
    } catch (error) {
      console.error('Error loading pending transfers:', error);
    }
  };

  // Step 1: Initiate Transfer
  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const selectedRecord = myRecords.find(r => r.id === transferData.recordId);
      
      // Call contract to initiate transfer
      const tx = await contract.initiateTransfer(
        transferData.recordId,
        transferData.newOwnerAddress
      );
      
      console.log('⏳ Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed');
      
      // Extract transferId from event
      const iface = contract.interface;
      let transferId;
      
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsed && parsed.name === 'TransferInitiated') {
            transferId = parsed.args.transferId.toString();
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // Log to backend
      await fetch(`${API_URL}/transfer/log-initiation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId,
          recordId: transferData.recordId,
          fromOwner: selectedRecord.ownerName,
          toOwner: 'New Owner',
          fromAddress: account,
          toAddress: transferData.newOwnerAddress
        })
      });
      
      alert('Transfer initiated successfully! The new owner can now upload the document.');
      setTransferData({ recordId: '', newOwnerAddress: '' });
      await loadRecords();
    } catch (error) {
      console.error('Transfer initiation error:', error);
      alert('Failed to initiate transfer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit Document for Verification
  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadFile) {
      alert('Please select a document');
      return;
    }
    
    setLoading(true);
    setUploadResult(null);
    
    try {
      const record = await contract.getRecord(selectedTransfer.recordId);
      
      // Upload document to backend for verification
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('recordId', selectedTransfer.recordId);
      formData.append('expectedOwnerName', record[0]); // original owner name
      formData.append('expectedVillage', record[1]);
      
      const response = await fetch(
        `${API_URL}/transfer/submit-document/${selectedTransfer.transferId}`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      const result = await response.json();
      
      if (result.success && result.verified) {
        // Submit document hash and IPFS CID to blockchain
        const tx = await contract.submitTransferDocument(
          selectedTransfer.transferId,
          result.documentHash,
          result.ipfsCID
        );
        
        await tx.wait();
        
        // Verify document on blockchain (in production, this would be done by admin/backend)
        const verifyTx = await contract.verifyTransferDocument(
          selectedTransfer.transferId,
          true
        );
        
        await verifyTx.wait();
        
        setUploadResult({
          success: true,
          message: 'Document verified successfully! You can now accept the transfer.',
          data: result
        });
        
        await loadPendingTransfers();
      } else {
        setUploadResult({
          success: false,
          message: result.verificationResult?.message || 'Document verification failed',
          data: result
        });
      }
    } catch (error) {
      console.error('Document upload error:', error);
      setUploadResult({
        success: false,
        message: 'Failed to upload document: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Accept Transfer
  const handleAcceptTransfer = async (transferId) => {
    setLoading(true);
    
    try {
      const tx = await contract.acceptTransfer(transferId);
      await tx.wait();
      
      // Log completion to backend
      await fetch(`${API_URL}/transfer/log-completion/${transferId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionHash: tx.hash,
          blockNumber: (await tx.wait()).blockNumber
        })
      });
      
      alert('Transfer completed successfully! You are now the owner.');
      await loadPendingTransfers();
      await loadRecords();
      setSelectedTransfer(null);
      setUploadFile(null);
      setUploadResult(null);
    } catch (error) {
      console.error('Accept transfer error:', error);
      alert('Failed to accept transfer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cancel Transfer
  const handleCancelTransfer = async (transferId) => {
    if (!window.confirm('Are you sure you want to cancel this transfer?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      const tx = await contract.cancelTransfer(transferId);
      await tx.wait();
      
      // Log cancellation
      await fetch(`${API_URL}/transfer/log-cancellation/${transferId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelledBy: account
        })
      });
      
      alert('Transfer cancelled successfully');
      await loadRecords();
      await loadPendingTransfers();
    } catch (error) {
      console.error('Cancel transfer error:', error);
      alert('Failed to cancel transfer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <p className="text-center text-gray-600">
          Please connect your wallet to manage transfers
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 space-y-8">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
        <button
          onClick={() => setActiveTab('initiate')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
            activeTab === 'initiate'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Initiate Transfer
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
            activeTab === 'pending'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending Transfers ({pendingTransfers.length})
        </button>
      </div>

      {/* Initiate Transfer Tab */}
      {activeTab === 'initiate' && (
        <div className="space-y-8">
          {/* Initiate Transfer Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-800">
                Step 1: Initiate Ownership Transfer
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Select your land record and enter the new owner's wallet address
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
                    <option key={record.id} value={record.id}>
                      ID: {record.id} - {record.ownerName} ({record.village})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Owner Wallet Address
                </label>
                <input
                  type="text"
                  value={transferData.newOwnerAddress}
                  onChange={(e) => setTransferData(prev => ({ 
                    ...prev, 
                    newOwnerAddress: e.target.value 
                  }))}
                  required
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    Initiate Transfer
                  </>
                )}
              </button>
            </form>
          </div>

          {/* My Records */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">My Land Records</h3>
            {myRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No land records found</p>
            ) : (
              <div className="space-y-3">
                {myRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">
                          Record ID: {record.id}
                        </p>
                        <p className="text-sm text-gray-600">
                          Owner: {record.ownerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Village: {record.village}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Transfers Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-8">
          {pendingTransfers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No pending transfers</p>
            </div>
          ) : (
            pendingTransfers.map((transfer) => (
              <div key={transfer.transferId} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-bold text-gray-800">
                    Transfer Request #{transfer.transferId}
                  </h3>
                  {transfer.documentVerified && (
                    <span className="ml-auto bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-semibold">
                      Verified
                    </span>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Record ID</p>
                    <p className="font-semibold">{transfer.recordId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Property</p>
                    <p className="font-semibold">
                      {transfer.ownerName} - {transfer.village}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">From</p>
                    <p className="font-mono text-sm">
                      {transfer.fromOwner.slice(0, 6)}...{transfer.fromOwner.slice(-4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">To</p>
                    <p className="font-mono text-sm">
                      {transfer.toOwner.slice(0, 6)}...{transfer.toOwner.slice(-4)}
                    </p>
                  </div>
                </div>

                {/* Step 2: Upload Document */}
                {!transfer.documentVerified && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-800 mb-4">
                      Step 2: Upload New Ownership Document
                    </h4>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setSelectedTransfer(transfer);
                      handleDocumentUpload(e);
                    }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Land Document (with updated owner name)
                        </label>
                        <input
                          type="file"
                          onChange={(e) => setUploadFile(e.target.files[0])}
                          required
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Upload the updated land document. AI will verify the details.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Verifying Document...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            Upload & Verify Document
                          </>
                        )}
                      </button>
                    </form>

                    {/* Upload Result */}
                    {uploadResult && selectedTransfer?.transferId === transfer.transferId && (
                      <div className={`mt-4 p-4 rounded-lg ${
                        uploadResult.success 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-start gap-3">
                          {uploadResult.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`font-medium ${
                              uploadResult.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {uploadResult.message}
                            </p>
                            {uploadResult.data?.verificationResult && (
                              <div className="mt-2 text-sm space-y-1">
                                <p className="text-gray-700">
                                  Owner Match: {uploadResult.data.verificationResult.ownerMatch ? '✅' : '❌'}
                                </p>
                                <p className="text-gray-700">
                                  Village Match: {uploadResult.data.verificationResult.villageMatch ? '✅' : '❌'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Accept Transfer */}
                {transfer.documentVerified && (
                  <div className="border-t pt-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 font-medium">
                          Document verified successfully! You can now accept the transfer.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAcceptTransfer(transfer.transferId)}
                        disabled={loading}
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
                        className="px-6 py-3 border border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Show document info if available */}
                {transfer.newDocumentHash && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs text-gray-600">
                      Document Hash: <span className="font-mono">{transfer.newDocumentHash.slice(0, 16)}...</span>
                    </p>
                    {transfer.newIpfsCID && (
                      <p className="text-xs text-gray-600 mt-1">
                        IPFS: <span className="font-mono">{transfer.newIpfsCID}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TransferPage;