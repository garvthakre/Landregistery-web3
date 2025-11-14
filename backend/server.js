const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const { ethers } = require('ethers');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Contract Configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS_HERE";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE";
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PINATA_API_KEY = process.env.PINATA_API_KEY || "YOUR_PINATA_API_KEY";
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || "YOUR_PINATA_SECRET_KEY";

const CONTRACT_ABI = [
  "function createRecord(string memory _ownerName, string memory _village, string memory _ipfsCID, string memory _documentHash) external returns (uint256)",
  "function getRecord(uint256 _recordId) external view returns (string memory ownerName, string memory village, string memory ipfsCID, string memory documentHash, uint256 timestamp, address currentOwner, address uploadedBy, address pendingOwner, address[] memory ownershipHistory)",
  "function verifyHash(uint256 _recordId, string memory _documentHash) external view returns (bool)"
];

// Initialize provider and wallet
let provider, wallet, contract;

try {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
  console.log('✅ Blockchain connection established');
  console.log('📝 Contract address:', CONTRACT_ADDRESS);
} catch (error) {
  console.error('⚠️  Blockchain connection failed:', error.message);
}

// Helper function to calculate document hash
function calculateHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Helper function to upload to IPFS via Pinata
async function uploadToPinata(fileBuffer, filename) {
  try {
    const formData = new FormData();
    formData.append('file', fileBuffer, filename);

    const pinataMetadata = JSON.stringify({
      name: filename,
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: 'Infinity',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        }
      }
    );

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
    };
  } catch (error) {
    console.error('IPFS upload error:', error.response?.data || error.message);
    throw new Error('Failed to upload to IPFS');
  }
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Tribal Land Registry API is running',
    blockchain: contract ? 'connected' : 'disconnected'
  });
});

// Upload document and create blockchain record
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { ownerName, village } = req.body;
    const file = req.file;

    // Validation
    if (!ownerName || !village || !file) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: ownerName, village, or file'
      });
    }

    if (!contract) {
      return res.status(500).json({
        success: false,
        error: 'Blockchain connection not available'
      });
    }

    console.log('📤 Processing upload for:', ownerName, 'in', village);

    // Calculate document hash
    const documentHash = calculateHash(file.buffer);
    console.log('🔐 Document hash calculated:', documentHash);

    // Upload to IPFS
    console.log('📤 Uploading to IPFS...');
    const ipfsResult = await uploadToPinata(file.buffer, file.originalname);
    console.log('✅ IPFS upload successful:', ipfsResult.ipfsHash);

    // Create blockchain record
    console.log('⛓️  Creating blockchain record...');
    const tx = await contract.createRecord(
      ownerName,
      village,
      ipfsResult.ipfsHash,
      documentHash
    );
    
    console.log('⏳ Waiting for transaction confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed:', receipt.hash);

    // Extract record ID from event logs
    const recordId = receipt.logs[0].topics[1];
    const recordIdNumber = parseInt(recordId, 16);

    res.json({
      success: true,
      data: {
        recordId: recordIdNumber,
        ownerName,
        village,
        documentHash,
        ipfsCID: ipfsResult.ipfsHash,
        ipfsUrl: ipfsResult.ipfsUrl,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload and register document'
    });
  }
});

// Verify document integrity
app.post('/api/verify', upload.single('file'), async (req, res) => {
  try {
    const { recordId } = req.body;
    const file = req.file;

    if (!recordId || !file) {
      return res.status(400).json({
        success: false,
        error: 'Missing record ID or file'
      });
    }

    if (!contract) {
      return res.status(500).json({
        success: false,
        error: 'Blockchain connection not available'
      });
    }

    console.log('🔍 Verifying document for record ID:', recordId);

    // Calculate hash of uploaded file
    const uploadedHash = calculateHash(file.buffer);
    console.log('📝 Uploaded file hash:', uploadedHash);

    // Get record from blockchain
    const record = await contract.getRecord(recordId);
    console.log('⛓️  Blockchain record hash:', record.documentHash);

    // Compare hashes
    const verified = uploadedHash === record.documentHash;

    // Format timestamp
    const timestamp = new Date(Number(record.timestamp) * 1000).toLocaleString();

    res.json({
      success: true,
      verified: verified,
      message: verified 
        ? '✅ Document is authentic and has not been tampered with'
        : '❌ Document has been modified or does not match the blockchain record',
      recordInfo: {
        ownerName: record.ownerName,
        village: record.village,
        timestamp: timestamp,
        currentOwner: record.currentOwner,
        uploadedBy: record.uploadedBy,
        documentHash: record.documentHash,
        uploadedFileHash: uploadedHash
      }
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify document'
    });
  }
});

// Get record by ID
app.get('/api/record/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!contract) {
      return res.status(500).json({
        success: false,
        error: 'Blockchain connection not available'
      });
    }

    const record = await contract.getRecord(id);
    const timestamp = new Date(Number(record.timestamp) * 1000).toLocaleString();

    res.json({
      success: true,
      data: {
        recordId: id,
        ownerName: record.ownerName,
        village: record.village,
        ipfsCID: record.ipfsCID,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${record.ipfsCID}`,
        documentHash: record.documentHash,
        timestamp: timestamp,
        currentOwner: record.currentOwner,
        uploadedBy: record.uploadedBy,
        pendingOwner: record.pendingOwner,
        ownershipHistory: record.ownershipHistory
      }
    });

  } catch (error) {
    console.error('❌ Error fetching record:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch record'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Tribal Land Registry Backend Server');
  console.log('================================================');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`⛓️  Contract: ${CONTRACT_ADDRESS}`);
  console.log(`🌐 RPC URL: ${RPC_URL}`);
  console.log('================================================');
});

module.exports = app;