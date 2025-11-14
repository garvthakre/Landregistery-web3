import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Upload, CheckCircle, XCircle, FileText, Users, Clock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

// Contract Configuration
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";
const CONTRACT_ABI = [
  "function createRecord(string memory _ownerName, string memory _village, string memory _ipfsCID, string memory _documentHash) external returns (uint256)",
  "function getRecord(uint256 _recordId) external view returns (string memory ownerName, string memory village, string memory ipfsCID, string memory documentHash, uint256 timestamp, address currentOwner, address uploadedBy, address pendingOwner, address[] memory ownershipHistory)",
  "function getRecordsByOwner(address _owner) external view returns (uint256[] memory)",
  "function getPendingTransfers(address _pendingOwner) external view returns (uint256[] memory)",
  "function initiateOwnershipTransfer(uint256 _recordId, address _newOwner) external",
  "function acceptOwnershipTransfer(uint256 _recordId) external"
];

const API_URL = "http://localhost:5000/api";

function App() {
  const [currentPage, setCurrentPage] = useState('upload');
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  // Connect Wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      setAccount(accounts[0]);
      setProvider(provider);
      setContract(contract);
      
      console.log('✅ Wallet connected:', accounts[0]);
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect wallet');
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount('');
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-green-600">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-green-800">
                🏛️ Tribal Land Registry
              </h1>
              <p className="text-sm text-gray-600">
                Udanti-Sitanadi Tiger Reserve Region, Chhattisgarh
              </p>
            </div>
            
            {!account ? (
              <button
                onClick={connectWallet}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg"
              >
                Connect MetaMask
              </button>
            ) : (
              <div className="bg-green-100 px-4 py-2 rounded-lg">
                <p className="text-xs text-gray-600">Connected</p>
                <p className="font-mono text-sm font-semibold text-green-800">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm mt-4 mx-4 rounded-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {[
              { id: 'upload', label: 'Upload Document', icon: Upload },
              { id: 'verify', label: 'Verify Document', icon: CheckCircle },
              { id: 'transfer', label: 'Transfer Ownership', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentPage(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold transition ${
                    currentPage === tab.id
                      ? 'text-green-700 border-b-4 border-green-600 bg-green-50'
                      : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!account ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <AlertCircle className="mx-auto mb-4 text-yellow-600" size={64} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-6">
              Please connect your MetaMask wallet to access the land registry system
            </p>
          </div>
        ) : (
          <>
            {currentPage === 'upload' && <UploadPage contract={contract} account={account} />}
            {currentPage === 'verify' && <VerifyPage />}
            {currentPage === 'transfer' && <TransferPage contract={contract} account={account} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>🌳 Protecting Tribal Land Rights through Blockchain Technology</p>
          <p className="mt-1">Preventing fraud, ensuring transparency, empowering communities</p>
        </div>
      </footer>
    </div>
  );
}

// ==================== UPLOAD PAGE ====================
function UploadPage({ contract, account }) {
  const [ownerName, setOwnerName] = useState('');
  const [village, setVillage] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!ownerName || !village || !file) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('ownerName', ownerName);
      formData.append('village', village);
      formData.append('file', file);

      // Upload via backend
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setOwnerName('');
        setVillage('');
        setFile(null);
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="text-green-600" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Upload Land Document</h2>
          <p className="text-gray-600">Register new land ownership on blockchain</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Owner Name *
          </label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
            placeholder="Enter landowner's full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Village Name *
          </label>
          <input
            type="text"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
            placeholder="Enter village name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Land Document *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="file-upload"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileText className="mx-auto mb-3 text-gray-400" size={48} />
              {file ? (
                <p className="text-green-600 font-semibold">{file.name}</p>
              ) : (
                <p className="text-gray-600">Click to upload document (PDF, JPG, PNG)</p>
              )}
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-lg font-bold text-lg transition shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Processing...
            </>
          ) : (
            <>
              <Upload size={20} />
              Upload & Register
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="text-green-600" size={28} />
            <h3 className="text-xl font-bold text-green-800">
              Registration Successful!
            </h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">Record ID:</span>
              <span className="font-mono bg-white px-3 py-1 rounded">{result.recordId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Transaction:</span>
              <span className="font-mono text-xs bg-white px-3 py-1 rounded">
                {result.transactionHash?.slice(0, 10)}...{result.transactionHash?.slice(-8)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Document Hash:</span>
              <span className="font-mono text-xs bg-white px-3 py-1 rounded">
                {result.documentHash?.slice(0, 16)}...
              </span>
            </div>
            <div className="mt-4">
              <a
                href={result.ipfsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
              >
                View on IPFS →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== VERIFY PAGE ====================
function VerifyPage() {
  const [recordId, setRecordId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!recordId || !file) {
      alert('Please provide both Record ID and file');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('recordId', recordId);
      formData.append('file', file);

      const response = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Verification error:', error);
      alert('Verification failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="text-blue-600" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Verify Document Integrity</h2>
          <p className="text-gray-600">Check if document has been tampered with</p>
        </div>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Record ID *
          </label>
          <input
            type="number"
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            placeholder="Enter record ID to verify"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Upload Document to Verify *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="verify-file-upload"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <label htmlFor="verify-file-upload" className="cursor-pointer">
              <FileText className="mx-auto mb-3 text-gray-400" size={48} />
              {file ? (
                <p className="text-blue-600 font-semibold">{file.name}</p>
              ) : (
                <p className="text-gray-600">Click to upload document</p>
              )}
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 rounded-lg font-bold text-lg transition shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Verify Document
            </>
          )}
        </button>
      </form>

      {result && (
        <div className={`mt-8 border-2 rounded-lg p-6 ${
          result.verified 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            {result.verified ? (
              <>
                <CheckCircle className="text-green-600" size={32} />
                <h3 className="text-xl font-bold text-green-800">✅ Document Verified</h3>
              </>
            ) : (
              <>
                <XCircle className="text-red-600" size={32} />
                <h3 className="text-xl font-bold text-red-800">❌ Document Tampered</h3>
              </>
            )}
          </div>
          
          <p className="mb-4 text-gray-700">{result.message}</p>
          
          {result.recordInfo && (
            <div className="space-y-2 text-sm bg-white rounded-lg p-4">
              <div className="flex justify-between">
                <span className="font-semibold">Owner:</span>
                <span>{result.recordInfo.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Village:</span>
                <span>{result.recordInfo.village}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Registered:</span>
                <span>{result.recordInfo.timestamp}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== TRANSFER PAGE ====================
function TransferPage({ contract, account }) {
  const [myRecords, setMyRecords] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transferAddress, setTransferAddress] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    if (contract && account) {
      loadRecords();
    }
  }, [contract, account]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      
      // Load owned records
      const ownedIds = await contract.getRecordsByOwner(account);
      const owned = [];
      for (let id of ownedIds) {
        const record = await contract.getRecord(Number(id));
        owned.push({
          id: Number(id),
          ownerName: record.ownerName,
          village: record.village,
          pendingOwner: record.pendingOwner
        });
      }
      setMyRecords(owned);

      // Load pending transfers
      const pendingIds = await contract.getPendingTransfers(account);
      const pending = [];
      for (let id of pendingIds) {
        const record = await contract.getRecord(Number(id));
        pending.push({
          id: Number(id),
          ownerName: record.ownerName,
          village: record.village,
          currentOwner: record.currentOwner
        });
      }
      setPendingTransfers(pending);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiateTransfer = async (recordId) => {
    if (!transferAddress) {
      alert('Please enter recipient address');
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.initiateOwnershipTransfer(recordId, transferAddress);
      await tx.wait();
      alert('Transfer initiated successfully!');
      setTransferAddress('');
      setSelectedRecord(null);
      loadRecords();
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Transfer failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptTransfer = async (recordId) => {
    try {
      setLoading(true);
      const tx = await contract.acceptOwnershipTransfer(recordId);
      await tx.wait();
      alert('Ownership transfer completed!');
      loadRecords();
    } catch (error) {
      console.error('Accept error:', error);
      alert('Failed to accept transfer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* My Records */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-purple-600" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Land Records</h2>
            <p className="text-gray-600">Transfer ownership to another wallet</p>
          </div>
        </div>

        {loading && myRecords.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="animate-spin mx-auto text-gray-400" size={40} />
            <p className="text-gray-600 mt-2">Loading records...</p>
          </div>
        ) : myRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto mb-2 text-gray-300" size={48} />
            <p>No land records found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myRecords.map((record) => (
              <div key={record.id} className="border-2 border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">Record #{record.id}</h3>
                    <p className="text-gray-600">Owner: {record.ownerName}</p>
                    <p className="text-gray-600">Village: {record.village}</p>
                  </div>
                  {record.pendingOwner !== "0x0000000000000000000000000000000000000000" && (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Transfer Pending
                    </span>
                  )}
                </div>

                {selectedRecord === record.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={transferAddress}
                      onChange={(e) => setTransferAddress(e.target.value)}
                      placeholder="Enter new owner's wallet address"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => initiateTransfer(record.id)}
                        disabled={loading}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold transition"
                      >
                        Confirm Transfer
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRecord(null);
                          setTransferAddress('');
                        }}
                        className="px-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedRecord(record.id)}
                    disabled={record.pendingOwner !== "0x0000000000000000000000000000000000000000"}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <ArrowRight size={18} />
                    Initiate Transfer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Transfers */}
      {pendingTransfers.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="text-orange-600" size={32} />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Pending Transfers</h2>
              <p className="text-gray-600">Accept ownership transfers sent to you</p>
            </div>
          </div>

          <div className="space-y-4">
            {pendingTransfers.map((record) => (
              <div key={record.id} className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4">
                <div className="mb-3">
                  <h3 className="font-bold text-lg">Record #{record.id}</h3>
                  <p className="text-gray-600">Owner: {record.ownerName}</p>
                  <p className="text-gray-600">Village: {record.village}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    From: {record.currentOwner.slice(0, 6)}...{record.currentOwner.slice(-4)}
                  </p>
                </div>

                <button
                  onClick={() => acceptTransfer(record.id)}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  Accept Ownership
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;