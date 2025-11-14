import React, { useState, useEffect } from 'react';
import { History, Upload, Users, Calendar, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { API_URL } from '../config/api';

const HistoryPage = () => {
  const { account } = useWallet();
  const [loading, setLoading] = useState(false);
  const [recordId, setRecordId] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [allUploads, setAllUploads] = useState([]);
  const [allTransfers, setAllTransfers] = useState([]);
  const [viewMode, setViewMode] = useState('record'); // 'record' or 'all'

  useEffect(() => {
    if (viewMode === 'all') {
      loadAllHistory();
    }
  }, [viewMode]);

  const loadAllHistory = async () => {
    setLoading(true);
    try {
      // Fetch all uploads
      const uploadsRes = await fetch(`${API_URL}/upload/history/all`);
      const uploadsData = await uploadsRes.json();
      
      // Fetch all transfers
      const transfersRes = await fetch(`${API_URL}/transfer/history/all`);
      const transfersData = await transfersRes.json();

      if (uploadsData.success) {
        setAllUploads(uploadsData.uploads);
      }
      
      if (transfersData.success) {
        setAllTransfers(transfersData.transfers);
      }
    } catch (error) {
      console.error('Error loading all history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchRecord = async (e) => {
    e.preventDefault();
    
    if (!recordId) {
      alert('Please enter a Record ID');
      return;
    }

    setLoading(true);
    setHistoryData(null);

    try {
      const response = await fetch(`${API_URL}/upload/complete-history/${recordId}`);
      const result = await response.json();

      if (result.success) {
        setHistoryData(result);
      } else {
        alert('No history found for this record');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      alert('Failed to fetch history');
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

  if (!account) {
    return (
      <div className="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <p className="text-center text-gray-600">
          Please connect your wallet to view history
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <History className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            Document History
          </h2>
        </div>
        <p className="text-gray-600">
          View complete history of uploads and transfers for land records
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
        <button
          onClick={() => setViewMode('record')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
            viewMode === 'record'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Search by Record ID
        </button>
        <button
          onClick={() => setViewMode('all')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
            viewMode === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          View All History
        </button>
      </div>

      {/* Search by Record ID */}
      {viewMode === 'record' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSearchRecord} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Record ID
              </label>
              <input
                type="text"
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
                placeholder="Enter Record ID (e.g., 0, 1, 2...)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <History className="w-5 h-5" />
                  Search History
                </>
              )}
            </button>
          </form>

          {/* Record History Results */}
          {historyData && (
            <div className="mt-6 space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 mb-2">
                  Record #{historyData.recordId}
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-indigo-700">Total Events:</span>
                    <span className="ml-2 font-bold">{historyData.totalEvents}</span>
                  </div>
                  <div>
                    <span className="text-indigo-700">Uploads:</span>
                    <span className="ml-2 font-bold">{historyData.uploads}</span>
                  </div>
                  <div>
                    <span className="text-indigo-700">Transfers:</span>
                    <span className="ml-2 font-bold">{historyData.transfers}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Timeline</h4>
                {historyData.history.map((event, index) => (
                  <div key={index} className="border-l-4 border-indigo-400 pl-4 pb-4">
                    <div className="flex items-start gap-3">
                      {event.type === 'upload' ? (
                        <Upload className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                      ) : (
                        <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-800">
                            {event.type === 'upload' ? 'Document Uploaded' : 'Ownership Transfer'}
                          </span>
                          {event.status && getStatusBadge(event.status)}
                        </div>
                        
                        {event.type === 'upload' ? (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Owner: {event.ownerName}</p>
                            <p>Village: {event.village}</p>
                            <p className="text-xs text-gray-500">
                              Tx: {event.transactionHash?.slice(0, 10)}...
                            </p>
                            {event.ipfsUrl && (
                              <a
                                href={event.ipfsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                View on IPFS <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>From: {event.fromOwner}</p>
                            <p>To: {event.toOwner}</p>
                            {event.documentVerifiedAt && (
                              <p className="text-xs text-green-600">
                                ✓ Document verified
                              </p>
                            )}
                            {event.completedAt && (
                              <p className="text-xs text-purple-600">
                                ✓ Transfer completed
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(event.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View All History */}
      {viewMode === 'all' && (
        <div className="space-y-6">
          {/* All Uploads */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">
                All Uploads ({allUploads.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : allUploads.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No uploads found</p>
            ) : (
              <div className="space-y-3">
                {allUploads.map((upload, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold">Record #{upload.recordId}</span>
                        </div>
                        <p className="text-sm text-gray-600">Owner: {upload.ownerName}</p>
                        <p className="text-sm text-gray-600">Village: {upload.village}</p>
                        <p className="text-xs text-gray-500 mt-2">{formatDate(upload.uploadedAt)}</p>
                      </div>
                      {upload.ipfsUrl && (
                        <a
                          href={upload.ipfsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                        >
                          IPFS <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Transfers */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-800">
                All Transfers ({allTransfers.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : allTransfers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No transfers found</p>
            ) : (
              <div className="space-y-3">
                {allTransfers.map((transfer, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">Transfer #{transfer.transferId}</span>
                          {getStatusBadge(transfer.status)}
                        </div>
                        <p className="text-sm text-gray-600">Record: #{transfer.recordId}</p>
                        <p className="text-sm text-gray-600">From: {transfer.fromOwner}</p>
                        <p className="text-sm text-gray-600">To: {transfer.toOwner}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Initiated: {formatDate(transfer.initiatedAt)}
                        </p>
                        {transfer.completedAt && (
                          <p className="text-xs text-green-600">
                            ✓ Completed: {formatDate(transfer.completedAt)}
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
      )}
    </div>
  );
};

export default HistoryPage;