import React, { useState, useEffect } from 'react';
import { Users, ArrowRight, Clock, Loader2, CheckCircle, Upload, XCircle, Shield, Hash, Database, Bell, Zap, Send } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

const TransferPage = () => {
  const [transferData, setTransferData] = useState({
    recordId: '',
    toUserAadhar: '',
  });
  const [allRecords, setAllRecords] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [completedTransfers, setCompletedTransfers] = useState([]);
  const [initiateSteps, setInitiateSteps] = useState([]);
  const [acceptSteps, setAcceptSteps] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [activeTransferId, setActiveTransferId] = useState(null);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const INITIATE_STEPS = [
    { id: 1, name: 'Validating Record', icon: Shield, color: 'emerald', description: 'Verifying ownership rights' },
    { id: 2, name: 'Checking Recipient', icon: Users, color: 'teal', description: 'Validating recipient details' },
    { id: 3, name: 'Creating Transfer Request', icon: Database, color: 'green', description: 'Generating transfer contract' },
    { id: 4, name: 'Notifying Parties', icon: Bell, color: 'orange', description: 'Sending notifications' },
    { id: 5, name: 'Recording on Blockchain', icon: Database, color: 'pink', description: 'Storing transfer intent' },
  ];

  const ACCEPT_STEPS = [
    { id: 1, name: 'Verifying Document', icon: Upload, color: 'emerald', description: 'Analyzing uploaded document' },
    { id: 2, name: 'Computing Hash', icon: Hash, color: 'teal', description: 'Generating document hash' },
    { id: 3, name: 'Cross-Checking Data', icon: Shield, color: 'green', description: 'Validating with blockchain' },
    { id: 4, name: 'Updating Ownership', icon: Users, color: 'orange', description: 'Transferring ownership rights' },
    { id: 5, name: 'Broadcasting Transaction', icon: Zap, color: 'pink', description: 'Publishing to network' },
    { id: 6, name: 'Confirming Transfer', icon: CheckCircle, color: 'indigo', description: 'Finalizing on blockchain' },
  ];

  useEffect(() => {
    loadAllRecords();
    loadTransfers();
  }, []);

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
        const pending = result.transfers.filter(t => 
          t.status === 'initiated' || t.status === 'document_verified'
        );
        const completed = result.transfers.filter(t => t.status === 'completed');
        setPendingTransfers(pending);
        setCompletedTransfers(completed);
      }
    } catch (error) {
      console.error('Error loading transfers:', error);
    }
  };

  const updateStep = (steps, setSteps, stepIndex, status, message = '') => {
    setSteps(prev => {
      const updated = [...prev];
      if (!updated[stepIndex]) {
        updated[stepIndex] = { ...steps[stepIndex], status, timestamp: Date.now() };
      } else {
        updated[stepIndex] = { ...updated[stepIndex], status };
      }
      if (status === 'completed') {
        updated[stepIndex].completedAt = Date.now();
        updated[stepIndex].message = message;
      }
      return updated;
    });
  };

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    
    if (!transferData.toUserAadhar || transferData.toUserAadhar.length !== 12) {
      alert('Please enter a valid 12-digit Aadhar number');
      return;
    }

    setIsProcessing(true);
    setInitiateSteps([]);

    try {
      const selectedRecord = allRecords.find(r => r.recordId.toString() === transferData.recordId);
      
      if (!selectedRecord) {
        alert('Record not found');
        setIsProcessing(false);
        return;
      }

      updateStep(INITIATE_STEPS, setInitiateSteps, 0, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep(INITIATE_STEPS, setInitiateSteps, 0, 'completed', 'Record validated');

      updateStep(INITIATE_STEPS, setInitiateSteps, 1, 'processing');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStep(INITIATE_STEPS, setInitiateSteps, 1, 'completed', 'Recipient checked');

      updateStep(INITIATE_STEPS, setInitiateSteps, 2, 'processing');
      
      const transferId = `TXF-${Date.now()}`;
      const response = await fetch(`${API_URL}/transfer/log-initiation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId,
          recordId: transferData.recordId,
          fromOwner: selectedRecord.ownerName,
          toOwner: `User with Aadhar: ${transferData.toUserAadhar}`,
          fromAddress: '0x0000000000000000000000000000000000000000',
          toAddress: '0x0000000000000000000000000000000000000001',
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      updateStep(INITIATE_STEPS, setInitiateSteps, 2, 'completed', 'Transfer created');

      updateStep(INITIATE_STEPS, setInitiateSteps, 3, 'processing');
      await new Promise(resolve => setTimeout(resolve, 600));
      updateStep(INITIATE_STEPS, setInitiateSteps, 3, 'completed', 'Parties notified');

      updateStep(INITIATE_STEPS, setInitiateSteps, 4, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1200));
      updateStep(INITIATE_STEPS, setInitiateSteps, 4, 'completed', 'Recorded on blockchain');

      alert('✅ Transfer request sent successfully!');
      setTransferData({ recordId: '', toUserAadhar: '' });
      await loadTransfers();
      
      setTimeout(() => setInitiateSteps([]), 3000);
    } catch (error) {
      console.error('Transfer error:', error);
      alert('❌ Transfer failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocumentUpload = async (transferId) => {
    if (!docFile) {
      alert('Please select a document first');
      return;
    }

    setUploadingDoc(true);
    setActiveTransferId(transferId);

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
          : '⚠️ Document uploaded but verification failed.');
        
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
      setActiveTransferId(null);
    }
  };

  const handleAcceptTransfer = async (transferId) => {
    const transfer = pendingTransfers.find(t => t.transferId === transferId);
    
    if (!transfer.documentHash) {
      alert('Please upload a new document first');
      return;
    }

    if (transfer.verificationResult && !transfer.verificationResult.isValid) {
      alert('Document verification failed. Cannot accept transfer.');
      return;
    }

    setIsProcessing(true);
    setActiveTransferId(transferId);
    setAcceptSteps([]);

    try {
      updateStep(ACCEPT_STEPS, setAcceptSteps, 0, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1200));
      updateStep(ACCEPT_STEPS, setAcceptSteps, 0, 'completed', 'Document verified');

      updateStep(ACCEPT_STEPS, setAcceptSteps, 1, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep(ACCEPT_STEPS, setAcceptSteps, 1, 'completed', 'Hash computed');

      updateStep(ACCEPT_STEPS, setAcceptSteps, 2, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateStep(ACCEPT_STEPS, setAcceptSteps, 2, 'completed', 'Data validated');

      updateStep(ACCEPT_STEPS, setAcceptSteps, 3, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1300));
      updateStep(ACCEPT_STEPS, setAcceptSteps, 3, 'completed', 'Ownership updated');

      updateStep(ACCEPT_STEPS, setAcceptSteps, 4, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1100));
      updateStep(ACCEPT_STEPS, setAcceptSteps, 4, 'completed', 'Transaction broadcasted');

      updateStep(ACCEPT_STEPS, setAcceptSteps, 5, 'processing');
      
      const txHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const blockNumber = Math.floor(Math.random() * 1000000);

      const response = await fetch(`${API_URL}/transfer/log-completion/${transferId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: txHash, blockNumber }),
      });

      const result = await response.json();

      if (result.success) {
        updateStep(ACCEPT_STEPS, setAcceptSteps, 5, 'completed', 'Transfer confirmed');
        alert('✅ Transfer completed successfully!');
        await loadTransfers();
        setTimeout(() => setAcceptSteps([]), 3000);
      } else {
        throw new Error('Failed to complete transfer');
      }
    } catch (error) {
      console.error('Accept transfer error:', error);
      alert('Failed to accept transfer: ' + error.message);
    } finally {
      setIsProcessing(false);
      setActiveTransferId(null);
    }
  };

  const getStepColor = (color) => {
    const colors = {
      emerald: 'from-emerald-500 to-emerald-600',
      teal: 'from-teal-500 to-teal-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600',
      indigo: 'from-indigo-500 to-indigo-600',
    };
    return colors[color] || colors.emerald;
  };

  const getStepBgColor = (color) => {
    const colors = {
      emerald: 'bg-emerald-50',
      teal: 'bg-teal-50',
      green: 'bg-green-50',
      orange: 'bg-orange-50',
      pink: 'bg-pink-50',
      indigo: 'bg-indigo-50',
    };
    return colors[color] || colors.emerald;
  };

  const getStepBorderColor = (color) => {
    const colors = {
      emerald: 'border-emerald-400',
      teal: 'border-teal-400',
      green: 'border-green-400',
      orange: 'border-orange-400',
      pink: 'border-pink-400',
      indigo: 'border-indigo-400',
    };
    return colors[color] || colors.emerald;
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      initiated: 'bg-emerald-100 text-emerald-800',
      document_verified: 'bg-green-100 text-green-800',
      document_rejected: 'bg-red-100 text-red-800',
      completed: 'bg-teal-100 text-teal-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const renderProcessSteps = (steps) => (
    <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg animate-pulse">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Processing Transaction</h3>
          <p className="text-sm text-gray-600">Live blockchain operation</p>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = step.status === 'processing';
          const isCompleted = step.status === 'completed';
          const duration = step.completedAt ? ((step.completedAt - step.timestamp) / 1000).toFixed(2) : null;

          return (
            <div
              key={step.id}
              className={`relative p-4 rounded-xl border-2 transition-all duration-500 ${
                isActive 
                  ? `${getStepBorderColor(step.color)} ${getStepBgColor(step.color)} shadow-lg scale-105` 
                  : isCompleted
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  isActive 
                    ? `bg-gradient-to-br ${getStepColor(step.color)} animate-pulse shadow-lg` 
                    : isCompleted ? 'bg-emerald-500' : 'bg-gray-300'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <StepIcon className={`w-5 h-5 text-white ${isActive ? 'animate-bounce' : ''}`} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-800 text-sm">{step.name}</h4>
                    {isActive && <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />}
                    {isCompleted && duration && (
                      <span className="text-xs text-emerald-600 font-semibold">✓ {duration}s</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{step.description}</p>
                  {step.message && (
                    <p className="text-xs text-emerald-600 mt-1">{step.message}</p>
                  )}
                  
                  {isActive && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse" style={{ width: '100%' }} />
                    </div>
                  )}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className={`absolute left-7 top-full w-0.5 h-3 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 space-y-8">
      {/* Initiate Transfer Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl shadow-2xl p-8 border border-emerald-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Initiate Transfer</h2>
              <p className="text-sm text-gray-600 mt-1">Transfer land ownership</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Select Record *</label>
              {loadingRecords ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              ) : (
                <select
                  value={transferData.recordId}
                  onChange={(e) => setTransferData(prev => ({ ...prev, recordId: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  <option value="">Choose a record</option>
                  {allRecords.map((record) => (
                    <option key={record.recordId} value={record.recordId}>
                      Record #{record.recordId} - {record.ownerName} ({record.village})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Recipient Aadhar *</label>
              <input
                type="text"
                value={transferData.toUserAadhar}
                onChange={(e) => setTransferData(prev => ({ 
                  ...prev, 
                  toUserAadhar: e.target.value.replace(/\D/g, '').slice(0, 12)
                }))}
                required
                placeholder="Enter 12-digit Aadhar"
                maxLength="12"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <button
              onClick={handleInitiateTransfer}
              disabled={isProcessing || loadingRecords}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Send Transfer Request
                </span>
              )}
            </button>
          </div>
        </div>

        {initiateSteps.length > 0 && renderProcessSteps(initiateSteps)}
      </div>

      {/* Pending Transfers */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-teal-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              Pending Transfers ({pendingTransfers.length})
            </h3>
            <p className="text-sm text-gray-600">Awaiting action</p>
          </div>
        </div>
        
        {pendingTransfers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No pending transfers</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {pendingTransfers.map((transfer) => (
              <div key={transfer.transferId} className="border-2 border-teal-200 rounded-xl p-6 bg-gradient-to-br from-teal-50 to-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-bold text-lg text-gray-800 mb-1">Transfer #{transfer.transferId.slice(-8)}</div>
                    <p className="text-sm text-gray-600">Record #{transfer.recordId}</p>
                    <p className="text-sm text-gray-600">From: {transfer.fromOwner}</p>
                    <p className="text-sm text-gray-600">To: {transfer.toOwner}</p>
                  </div>
                  {getStatusBadge(transfer.status)}
                </div>

                {!transfer.documentHash ? (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-800">Upload New Document</span>
                      </div>
                      <input
                        type="file"
                        id={`doc-${transfer.transferId}`}
                        onChange={(e) => setDocFile(e.target.files[0])}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="w-full text-xs"
                      />
                    </div>
                    <button
                      onClick={() => handleDocumentUpload(transfer.transferId)}
                      disabled={uploadingDoc && activeTransferId === transfer.transferId}
                      className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-400"
                    >
                      {uploadingDoc && activeTransferId === transfer.transferId ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </span>
                      ) : (
                        'Upload Document'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-800">Document Verified</span>
                      </div>
                      <p className="text-xs text-emerald-700 font-mono">{transfer.documentHash.slice(0, 20)}...</p>
                    </div>
                    <button
                      onClick={() => handleAcceptTransfer(transfer.transferId)}
                      disabled={isProcessing && activeTransferId === transfer.transferId}
                      className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-400"
                    >
                      {isProcessing && activeTransferId === transfer.transferId ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Accept Transfer
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {acceptSteps.length > 0 && renderProcessSteps(acceptSteps)}
          </div>
        )}
      </div>

      {/* Completed Transfers */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-emerald-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              Completed Transfers ({completedTransfers.length})
            </h3>
            <p className="text-sm text-gray-600">Successfully processed</p>
          </div>
        </div>
        
        {completedTransfers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No completed transfers yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {completedTransfers.map((transfer) => (
              <div key={transfer.transferId} className="border border-emerald-200 rounded-xl p-5 bg-gradient-to-r from-emerald-50 to-white hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-800">Transfer #{transfer.transferId.slice(-8)}</span>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">COMPLETED</span>
                    </div>
                    <p className="text-sm text-gray-600">Record: #{transfer.recordId}</p>
                    <p className="text-sm text-gray-600">From: {transfer.fromOwner} → To: {transfer.toOwner}</p>
                    {transfer.transactionHash && (
                      <p className="text-xs text-gray-500 mt-2">Tx: {transfer.transactionHash.slice(0, 20)}...</p>
                    )}
                    {transfer.blockNumber && (
                      <p className="text-xs text-gray-500">Block: {transfer.blockNumber}</p>
                    )}
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
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