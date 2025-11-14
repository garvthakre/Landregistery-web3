// ...existing code...
import React, { useState } from 'react';
import { CheckCircle, XCircle, FileText, Loader2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { API_URL } from '../config/api';

const VerifyPage = () => {
  const { account, contract, loading, setLoading } = useWallet();
  const [verifyFile, setVerifyFile] = useState(null);
  const [recordId, setRecordId] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!contract) {
      alert('Please connect your wallet first');
      return;
    }

    if (!recordId) {
      alert('Please enter the Record ID to verify against');
      return;
    }

    setLoading(true);
    setVerifyResult(null);

    try {
      const data = new FormData();
      data.append('file', verifyFile);
      data.append('recordId', recordId); // <-- send recordId like upload page sends owner/village

      const response = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      setVerifyResult(result);
    } catch (error) {
      console.error('Verification error:', error);
      setVerifyResult({ 
        success: false, 
        message: 'Verification failed: ' + error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <p className="text-center text-gray-600">
          Please connect your wallet to verify documents
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            Verify Document
          </h2>
        </div>
        <p className="text-gray-600 mb-6">
          Check if document has been tampered with
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Record ID
            </label>
            <input
              type="text"
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              required
              placeholder="e.g. 0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Document to Verify
            </label>
            <input
              type="file"
              onChange={(e) => setVerifyFile(e.target.files[0])}
              required
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Verify Document
              </>
            )}
          </button>
        </form>

        {verifyResult && (
          <div className={`mt-6 p-4 rounded-lg ${
            verifyResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {verifyResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  verifyResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verifyResult.message || (verifyResult.success ? 'Document verified' : 'Verification failed')}
                </p>
                {verifyResult.recordDetails && (
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="text-gray-700">
                      <span className="font-semibold">Owner:</span>{' '}
                      {verifyResult.recordDetails.ownerName}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Village:</span>{' '}
                      {verifyResult.recordDetails.village}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Current Owner:</span>{' '}
                      {verifyResult.recordDetails.currentOwner || 'N/A'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Timestamp:</span>{' '}
                      {verifyResult.recordDetails.timestamp}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyPage;
 