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

// ================== ENV VALIDATIONS ===================
if (!process.env.PINATA_JWT) {
  console.warn("⚠️  Missing PINATA_JWT in .env - IPFS uploads will fail");
}
if (!process.env.CONTRACT_ADDRESS || !process.env.PRIVATE_KEY || !process.env.RPC_URL) {
  console.error("❌ Missing blockchain config in .env");
  console.error("Required: CONTRACT_ADDRESS, PRIVATE_KEY, RPC_URL");
  process.exit(1);
}

// ================== CONTRACT CONFIG ===================
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const PINATA_JWT = process.env.PINATA_JWT;

const CONTRACT_ABI = [
  "function createRecord(string _ownerName, string _village, string _ipfsCID, string _documentHash) external returns (uint256)",
  "function getRecord(uint256 _recordId) external view returns (string ownerName, string village, string ipfsCID, string documentHash, uint256 timestamp, address currentOwner, address uploadedBy, address pendingOwner, address[] ownershipHistory)",
  "function verifyHash(uint256 _recordId, string _documentHash) external view returns (bool)"
];

// Initialize provider & contract
let provider, wallet, contract;

try {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  console.log("✅ Blockchain connected");
  console.log("📝 Contract:", CONTRACT_ADDRESS);
} catch (error) {
  console.error("⚠️ Blockchain connection failed:", error);
}

// ================== HELPERS ===================

// Calculate document hash
function calculateHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// Upload to Pinata (JWT only, v3)
async function uploadToPinata(fileBuffer, filename) {
  try {
    const formData = new FormData();
    formData.append("file", fileBuffer, filename);

    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          ...formData.getHeaders(),
        },
      }
    );

    return {
      success: true,
      ipfsHash: res.data.IpfsHash,
      ipfsUrl: "https://gateway.pinata.cloud/ipfs/" + res.data.IpfsHash,
    };
  } catch (error) {
    console.error("IPFS upload error:", error.response?.data || error.message);
    throw new Error("Failed to upload to IPFS");
  }
}

// ==================== API ROUTES ====================

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    blockchain: contract ? "connected" : "disconnected",
  });
});

// Upload & create blockchain record
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const { ownerName, village } = req.body;
    const file = req.file;

    if (!ownerName || !village || !file) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    console.log("📤 Upload initiated for:", ownerName, "(", village, ")");

    // Hash
    const documentHash = calculateHash(file.buffer);
    console.log("🔐 Hash:", documentHash);

    // IPFS Upload
    const ipfsResult = await uploadToPinata(file.buffer, file.originalname);
    console.log("✨ IPFS:", ipfsResult.ipfsHash);

    // Blockchain TX
    const tx = await contract.createRecord(
      ownerName,
      village,
      ipfsResult.ipfsHash,
      documentHash
    );

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("✔️ TX confirmed:", receipt.hash);

    const recordId = parseInt(receipt.logs[0].topics[1], 16);

    res.json({
      success: true,
      data: {
        recordId,
        ownerName,
        village,
        documentHash,
        ipfsCID: ipfsResult.ipfsHash,
        ipfsUrl: ipfsResult.ipfsUrl,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      },
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify a document
app.post("/api/verify", upload.single("file"), async (req, res) => {
  try {
    const { recordId } = req.body;
    const file = req.file;

    if (!recordId || !file)
      return res.status(400).json({ success: false, error: "Missing fields" });

    const uploadedHash = calculateHash(file.buffer);

    const record = await contract.getRecord(recordId);

    const verified = uploadedHash === record.documentHash;

    res.json({
      success: true,
      verified,
      blockchainHash: record.documentHash,
      uploadedFileHash: uploadedHash,
      message: verified
        ? "Document is authentic"
        : "Document does NOT match blockchain record",
    });
  } catch (error) {
    console.error("❌ Verification error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch a record
app.get("/api/record/:id", async (req, res) => {
  try {
    const id = req.params.id;

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
        timestamp,
        currentOwner: record.currentOwner,
        uploadedBy: record.uploadedBy,
        pendingOwner: record.pendingOwner,
        ownershipHistory: record.ownershipHistory,
      },
    });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 Tribal Land Registry Server Running");
  console.log("======================================");
  console.log(`📡 http://localhost:${PORT}`);
  console.log("======================================");
});
