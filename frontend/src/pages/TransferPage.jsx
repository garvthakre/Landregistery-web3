import React, { useState, useEffect } from 'react';
import { Users, ArrowRight, Clock, Loader2, CheckCircle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const TransferPage = () => {
  const { account, contract, loading, setLoading } = useWallet();
  const [myRecords, setMyRecords] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [transferData, setTransferData] = useState({
    recordId: '',
    newOwnerAddress: '',
  });

  useEffect(() => {
    if (contract && account) {
      loadRecords();
      loadPendingTransfers();
    }
  }, [contract, account]);

  const loadRecords = async () => {
    try {
      const recordIds = await contract.getRecordsByOwner(account);
      const records = await Promise.all(
        recordIds.map(async (id) => {
          const record = await contract.getRecord(id);
          return {
            id: id.toString(),
            ownerName: record[0],
            village: record[1],
            currentOwner: record[5],
          };
        })
      );
      setMyRecords(records);
    } catch (error) {
      console.error('Error loading records:', error);
    }
  };

  const loadPendingTransfers = async () => {
    try {
      const transferIds = await contract.getPendingTransfers(account);
      const transfers = await Promise.all(
        transferIds.map(async (id) => {
          const record = await contract.getRecord(id);
          return {
            id: id.toString(),
            ownerName: record[0],
            village: record[1],
            currentOwner: record[5],
          };
        })
      );
      setPendingTransfers(transfers);
    } catch (error) {
      console.error('Error loading pending transfers:', error);
    }
  };

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (!contract) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const tx = await contract.initiateOwnershipTransfer(
        transferData.recordId,
        transferData.newOwnerAddress
      );
      await tx.wait();
      alert('Transfer initiated successfully!');
      setTransferData({ recordId: '', newOwnerAddress: '' });
      await loadRecords();
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Transfer failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTransfer = async (recordId) => {
    if (!contract) return;

    setLoading(true);
    try {
      const tx = await contract.acceptOwnershipTransfer(recordId);
      await tx.wait();
      alert('Transfer accepted successfully!');
      await loadPendingTransfers();
      await loadRecords();
    } catch (error) {
      console.error('Accept transfer error:', error);
      alert('Failed to accept transfer: ' + error.message);
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
          Transfer ownership to another wallet
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
              New Owner Address
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

      {/* My Records Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">My Records</h3>
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

      {/* Pending Transfers Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-orange-600" />
          <h3 className="text-xl font-bold text-gray-800">
            Pending Transfers
          </h3>
        </div>
        <p className="text-gray-600 mb-6">
          Accept ownership transfers sent to you
        </p>

        {pendingTransfers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No pending transfers
          </p>
        ) : (
          <div className="space-y-3">
            {pendingTransfers.map((record) => (
              <div
                key={record.id}
                className="p-4 border border-orange-200 rounded-lg bg-orange-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      Record ID: {record.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      Owner: {record.ownerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Village: {record.village}
                    </p>
                    <p className="text-sm text-gray-600">
                      From: {record.currentOwner.slice(0, 6)}...
                      {record.currentOwner.slice(-4)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcceptTransfer(record.id)}
                    disabled={loading}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept
                  </button>
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
