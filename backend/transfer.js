const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Environment variables
const PINATA_JWT = process.env.PINATA_JWT;

// File paths
const TRANSFER_HISTORY_FILE = path.join(__dirname, 'transfer_history.json');

// Initialize files
if (!fs.existsSync(TRANSFER_HISTORY_FILE)) {
  fs.writeFileSync(TRANSFER_HISTORY_FILE, JSON.stringify([]));
}

// Multer config
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper functions
const readTransferHistory = () => {
  try {
    const data = fs.readFileSync(TRANSFER_HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeTransferHistory = (history) => {
  fs.writeFileSync(TRANSFER_HISTORY_FILE, JSON.stringify(history, null, 2));
};

const calculateHash = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

// Initialize Gemini AI
const genAI = process.env.GEMINI_KEY ? new GoogleGenerativeAI(process.env.GEMINI_KEY) : null;

// OCR function
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
      
      Return ONLY a valid JSON object with these exact keys:
      {
        "ownerName": "extracted name or empty string",
        "village": "extracted village or empty string",
        "landArea": "extracted area or empty string",
        "surveyNumber": "extracted number or empty string",
        "date": "extracted date or empty string"
      }
      
      If a field is not found, use an empty string. Do not include any markdown formatting.
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
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("OCR error:", error);
    throw new Error("Failed to extract document data: " + error.message);
  }
}

// Upload to Pinata
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

// ==================== ROUTES ====================

/**
 * Log transfer initiation
 */
router.post('/log-initiation', (req, res) => {
  try {
    const { transferId, recordId, fromOwner, toOwner, fromAddress, toAddress } = req.body;

    const history = readTransferHistory();
    
    const transferRecord = {
      transferId,
      recordId,
      fromOwner,
      toOwner,
      fromAddress,
      toAddress,
      status: 'initiated',
      initiatedAt: new Date().toISOString(),
      documentSubmittedAt: null,
      documentVerifiedAt: null,
      completedAt: null,
      cancelledAt: null,
      extractedData: null,
      documentHash: null,
      ipfsCID: null,
      verificationResult: null
    };

    history.push(transferRecord);
    writeTransferHistory(history);

    console.log(`✅ Transfer initiated: ${transferId}`);

    res.json({
      success: true,
      message: 'Transfer initiation logged',
      transferRecord
    });
  } catch (error) {
    console.error('Log initiation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log transfer initiation' 
    });
  }
});

/**
 * Submit and verify transfer document
 */
router.post('/submit-document/:transferId', upload.single('file'), async (req, res) => {
  try {
    const { transferId } = req.params;
    const { recordId, expectedOwnerName, expectedVillage } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    console.log(`📄 Processing transfer document for transfer ${transferId}`);

    const history = readTransferHistory();
    const transferIndex = history.findIndex(t => t.transferId === transferId);

    if (transferIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transfer not found in history' 
      });
    }

    // Calculate document hash
    const documentHash = calculateHash(file.buffer);
    console.log('🔐 Document Hash:', documentHash);

    // Upload to IPFS
    console.log('📤 Uploading to IPFS...');
    const ipfsResult = await uploadToPinata(file.buffer, file.originalname);
    console.log('✨ IPFS Upload:', ipfsResult.ipfsHash);

    // Extract data using OCR
    let extractedData = null;
    let verificationResult = {
      ownerMatch: false,
      villageMatch: false,
      isValid: false,
      message: ''
    };

    if (file.mimetype.startsWith('image/')) {
      try {
        extractedData = await extractDocumentData(file.buffer, file.mimetype);
        console.log('📋 Extracted Data:', extractedData);

        // Verify extracted data matches expected values
        const ownerMatch = extractedData.ownerName.toLowerCase().includes(expectedOwnerName.toLowerCase()) ||
                          expectedOwnerName.toLowerCase().includes(extractedData.ownerName.toLowerCase());
        
        const villageMatch = extractedData.village.toLowerCase() === expectedVillage.toLowerCase();

        verificationResult = {
          ownerMatch,
          villageMatch,
          isValid: ownerMatch && villageMatch,
          message: ownerMatch && villageMatch 
            ? '✅ Document verified successfully' 
            : '❌ Document verification failed - details do not match',
          extractedOwner: extractedData.ownerName,
          extractedVillage: extractedData.village,
          expectedOwner: expectedOwnerName,
          expectedVillage: expectedVillage
        };

        console.log('🔍 Verification Result:', verificationResult);
      } catch (error) {
        console.error('OCR failed:', error);
        verificationResult.message = '⚠️ Could not extract document data';
      }
    }

    // Update transfer history
    history[transferIndex].status = verificationResult.isValid ? 'document_verified' : 'document_rejected';
    history[transferIndex].documentSubmittedAt = new Date().toISOString();
    history[transferIndex].documentVerifiedAt = new Date().toISOString();
    history[transferIndex].documentHash = documentHash;
    history[transferIndex].ipfsCID = ipfsResult.ipfsHash;
    history[transferIndex].ipfsUrl = ipfsResult.ipfsUrl;
    history[transferIndex].extractedData = extractedData;
    history[transferIndex].verificationResult = verificationResult;

    writeTransferHistory(history);

    res.json({
      success: true,
      verified: verificationResult.isValid,
      documentHash,
      ipfsCID: ipfsResult.ipfsHash,
      ipfsUrl: ipfsResult.ipfsUrl,
      extractedData,
      verificationResult,
      transferRecord: history[transferIndex]
    });
  } catch (error) {
    console.error('❌ Document submission error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Update transfer with IPFS CID after blockchain upload
 */
router.post('/update-ipfs/:transferId', (req, res) => {
  try {
    const { transferId } = req.params;
    const { ipfsCID, ipfsUrl } = req.body;

    const history = readTransferHistory();
    const transferIndex = history.findIndex(t => t.transferId === transferId);

    if (transferIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transfer not found' 
      });
    }

    history[transferIndex].ipfsCID = ipfsCID;
    history[transferIndex].ipfsUrl = ipfsUrl;

    writeTransferHistory(history);

    res.json({
      success: true,
      message: 'IPFS information updated'
    });
  } catch (error) {
    console.error('Update IPFS error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update IPFS information' 
    });
  }
});

/**
 * Log transfer completion
 */
router.post('/log-completion/:transferId', (req, res) => {
  try {
    const { transferId } = req.params;
    const { transactionHash, blockNumber } = req.body;

    const history = readTransferHistory();
    const transferIndex = history.findIndex(t => t.transferId === transferId);

    if (transferIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transfer not found' 
      });
    }

    history[transferIndex].status = 'completed';
    history[transferIndex].completedAt = new Date().toISOString();
    history[transferIndex].transactionHash = transactionHash;
    history[transferIndex].blockNumber = blockNumber;

    writeTransferHistory(history);

    console.log(`✅ Transfer completed: ${transferId}`);

    res.json({
      success: true,
      message: 'Transfer completion logged',
      transferRecord: history[transferIndex]
    });
  } catch (error) {
    console.error('Log completion error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log transfer completion' 
    });
  }
});

/**
 * Log transfer cancellation
 */
router.post('/log-cancellation/:transferId', (req, res) => {
  try {
    const { transferId } = req.params;
    const { cancelledBy } = req.body;

    const history = readTransferHistory();
    const transferIndex = history.findIndex(t => t.transferId === transferId);

    if (transferIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transfer not found' 
      });
    }

    history[transferIndex].status = 'cancelled';
    history[transferIndex].cancelledAt = new Date().toISOString();
    history[transferIndex].cancelledBy = cancelledBy;

    writeTransferHistory(history);

    console.log(`❌ Transfer cancelled: ${transferId}`);

    res.json({
      success: true,
      message: 'Transfer cancellation logged'
    });
  } catch (error) {
    console.error('Log cancellation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log cancellation' 
    });
  }
});

/**
 * Get transfer history by record ID
 */
router.get('/history/record/:recordId', (req, res) => {
  try {
    const { recordId } = req.params;
    const history = readTransferHistory();
    
    const recordHistory = history.filter(t => t.recordId === recordId);

    res.json({
      success: true,
      count: recordHistory.length,
      transfers: recordHistory
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get transfer history' 
    });
  }
});

/**
 * Get all transfer history
 */
router.get('/history/all', (req, res) => {
  try {
    const history = readTransferHistory();

    res.json({
      success: true,
      count: history.length,
      transfers: history
    });
  } catch (error) {
    console.error('Get all history error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get transfer history' 
    });
  }
});

/**
 * Get transfer by ID
 */
router.get('/:transferId', (req, res) => {
  try {
    const { transferId } = req.params;
    const history = readTransferHistory();
    
    const transfer = history.find(t => t.transferId === transferId);

    if (!transfer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transfer not found' 
      });
    }

    res.json({
      success: true,
      transfer
    });
  } catch (error) {
    console.error('Get transfer error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get transfer' 
    });
  }
});

module.exports = router;