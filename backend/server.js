const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const { ethers } = require('ethers');
const axios = require('axios');
const FormData = require('form-data');
const { GoogleGenerativeAI } = require("@google/generative-ai");
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
if (!process.env.GEMINI_KEY) {
  console.warn("⚠️  Missing GEMINI_KEY in .env - OCR will fail");
}

// ================== CONTRACT CONFIG ===================
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const PINATA_JWT = process.env.PINATA_JWT;
const GEMINI_KEY = process.env.GEMINI_KEY;

const CONTRACT_ABI = [
  "function createRecord(string _ownerName, string _village, string _ipfsCID, string _documentHash) external returns (uint256)",
  "function getRecord(uint256 _recordId) external view returns (string ownerName, string village, string ipfsCID, string documentHash, uint256 timestamp, address currentOwner, address uploadedBy, address pendingOwner, address[] ownershipHistory)",
  "function verifyHash(uint256 _recordId, string _documentHash) external view returns (bool)",
  "function getRecordCount() external view returns (uint256)",
  "event RecordCreated(uint256 indexed recordId, address indexed owner, string village, string ipfsCID)"
];

// Initialize provider & contract
let provider, wallet, contract;

try {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  console.log("✅ Blockchain connected");
  console.log("📝 Contract:", CONTRACT_ADDRESS);
  console.log("🔑 Wallet:", wallet.address);
} catch (error) {
  console.error("⚠️ Blockchain connection failed:", error);
}

// Initialize Gemini AI
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

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

// OCR using Gemini
async function extractDocumentData(imageBuffer, mimeType) {
  if (!genAI) {
    throw new Error("Gemini API not configured");
  }

  try {
    const prompt = `
      Extract the following fields from this land document image:
      - Owner Name (full name of the land owner)
      - Village (village or location name)
      - Land Area (area with unit if visible)
      - Survey Number (plot/survey number if visible)
      - Date (any date mentioned on the document)
      - Signatures or Stamps (mention if visible)
      
      Return ONLY a valid JSON object with these exact keys:
      {
        "ownerName": "extracted name or empty string",
        "village": "extracted village or empty string",
        "landArea": "extracted area or empty string",
        "surveyNumber": "extracted number or empty string",
        "date": "extracted date or empty string",
        "hasSignatures": "yes/no/unknown"
      }
      
      If a field is not found, use an empty string. Do not include any markdown formatting or explanation.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      { 
        inlineData: { 
          data: imageBuffer.toString("base64"), 
          mimeType: mimeType 
        } 
      },
      prompt,
    ]);

    const text = result.response.text();
    
    // Clean up response (remove markdown if present)
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("OCR error:", error);
    throw new Error("Failed to extract document data: " + error.message);
  }
}

// ==================== API ROUTES ====================

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    blockchain: contract ? "connected" : "disconnected",
    wallet: wallet ? wallet.address : "not connected",
    ocr: genAI ? "enabled" : "disabled",
  });
});

// OCR endpoint - Extract data from document image
app.post("/api/ocr", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    console.log("🔍 OCR processing:", req.file.originalname);

    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    // Validate image type
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ 
        success: false, 
        error: "Only image files are supported for OCR" 
      });
    }

    const extractedData = await extractDocumentData(imageBuffer, mimeType);

    console.log("✅ OCR completed:", extractedData);

    res.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error("❌ OCR error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
app.use('/api/auth', authRoutes);
// Upload & create blockchain record
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const { ownerName, village } = req.body;
    const file = req.file;

    if (!ownerName || !village || !file) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: ownerName, village, or file" 
      });
    }

    console.log("📤 Upload initiated for:", ownerName, "(", village, ")");

    // Calculate hash
    const documentHash = calculateHash(file.buffer);
    console.log("🔐 Document Hash:", documentHash);

    // Upload to IPFS
    const ipfsResult = await uploadToPinata(file.buffer, file.originalname);
    console.log("✨ IPFS Upload:", ipfsResult.ipfsHash);

    // Create blockchain transaction
    console.log("📝 Creating blockchain record...");
    const tx = await contract.createRecord(
      ownerName,
      village,
      ipfsResult.ipfsHash,
      documentHash
    );

    console.log("⏳ Transaction sent:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✔️ Transaction confirmed:", receipt.hash);

    // Extract recordId from event logs
    let recordId;
    
    // Parse the RecordCreated event
    const iface = new ethers.Interface(CONTRACT_ABI);
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsed && parsed.name === 'RecordCreated') {
          recordId = parsed.args.recordId.toString();
          console.log("📋 Record ID extracted from event:", recordId);
          break;
        }
      } catch (e) {
        // Skip logs that don't match our interface
        continue;
      }
    }

    // Fallback: Get record count if event parsing fails
    if (!recordId) {
      console.log("⚠️ Using fallback method to get record ID");
      const count = await contract.getRecordCount();
      recordId = (Number(count) - 1).toString();
      console.log("📋 Record ID from count:", recordId);
    }

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
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Verify a document
app.post("/api/verify", upload.single("file"), async (req, res) => {
  try {
    const { recordId } = req.body;
    const file = req.file;

    if (!recordId || !file) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing recordId or file" 
      });
    }

    console.log("🔍 Verifying document for record:", recordId);

    const uploadedHash = calculateHash(file.buffer);
    console.log("📄 Uploaded file hash:", uploadedHash);

    const record = await contract.getRecord(recordId);
    console.log("⛓️  Blockchain hash:", record.documentHash);

    const verified = uploadedHash === record.documentHash;

    res.json({
      success: true,
      verified,
      blockchainHash: record.documentHash,
      uploadedFileHash: uploadedHash,
      recordDetails: {
        ownerName: record.ownerName,
        village: record.village,
        timestamp: new Date(Number(record.timestamp) * 1000).toLocaleString(),
      },
      message: verified
        ? "✅ Document is authentic and matches blockchain record"
        : "❌ Document does NOT match blockchain record - possible tampering detected",
    });
  } catch (error) {
    console.error("❌ Verification error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Fetch a record
app.get("/api/record/:id", async (req, res) => {
  try {
    const id = req.params.id;

    console.log("📖 Fetching record:", id);

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
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all records
app.get("/api/records", async (req, res) => {
  try {
    const count = await contract.getRecordCount();
    const recordCount = Number(count);

    console.log("📚 Fetching all records. Total:", recordCount);

    const records = [];
    for (let i = 0; i < recordCount; i++) {
      try {
        const record = await contract.getRecord(i);
        records.push({
          recordId: i,
          ownerName: record.ownerName,
          village: record.village,
          timestamp: new Date(Number(record.timestamp) * 1000).toLocaleString(),
          currentOwner: record.currentOwner,
        });
      } catch (error) {
        console.error(`Error fetching record ${i}:`, error.message);
      }
    }

    res.json({
      success: true,
      count: recordCount,
      data: records,
    });
  } catch (error) {
    console.error("❌ Fetch all records error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 Tribal Land Registry Server Running");
  console.log("======================================");
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🔗 Contract: ${CONTRACT_ADDRESS}`);
  console.log(`👤 Wallet: ${wallet.address}`);
  console.log(`🤖 OCR: ${genAI ? 'Enabled' : 'Disabled'}`);
  console.log("======================================");
});