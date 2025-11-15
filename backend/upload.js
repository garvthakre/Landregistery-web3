const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// File paths
const UPLOAD_HISTORY_FILE = path.join(__dirname, 'upload_history.json');

// Initialize files
if (!fs.existsSync(UPLOAD_HISTORY_FILE)) {
  fs.writeFileSync(UPLOAD_HISTORY_FILE, JSON.stringify([]));
}

// Helper functions
const readUploadHistory = () => {
  try {
    const data = fs.readFileSync(UPLOAD_HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeUploadHistory = (history) => {
  fs.writeFileSync(UPLOAD_HISTORY_FILE, JSON.stringify(history, null, 2));
};

/**
 * Log upload to history
 */
router.post('/log-upload', (req, res) => {
  try {
    const { 
      recordId, 
      ownerName, 
      village, 
      documentHash, 
      ipfsCID, 
      ipfsUrl,
      transactionHash, 
      blockNumber,
      uploadedBy,
      userId,      // NEW: user ID from auth
      userAadhar   // NEW: user aadhar from auth
    } = req.body;

    const history = readUploadHistory();
    
    const uploadRecord = {
      recordId,
      ownerName,
      village,
      documentHash,
      ipfsCID,
      ipfsUrl,
      transactionHash,
      blockNumber,
      uploadedBy,
      userId: userId || null,           // NEW
      userAadhar: userAadhar || null,   // NEW
      uploadedAt: new Date().toISOString()
    };

    history.push(uploadRecord);
    writeUploadHistory(history);

    console.log(`✅ Upload logged: Record #${recordId} - ${ownerName}`);

    res.json({
      success: true,
      message: 'Upload logged successfully',
      uploadRecord
    });
  } catch (error) {
    console.error('Log upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log upload' 
    });
  }
});

/**
 * Get upload history by record ID
 */
router.get('/history/record/:recordId', (req, res) => {
  try {
    const { recordId } = req.params;
    const history = readUploadHistory();
    
    const recordHistory = history.filter(u => u.recordId === recordId);

    res.json({
      success: true,
      count: recordHistory.length,
      uploads: recordHistory
    });
  } catch (error) {
    console.error('Get upload history error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get upload history' 
    });
  }
});

/**
 * NEW: Get uploads by user ID
 */
router.get('/history/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const history = readUploadHistory();
    
    const userUploads = history.filter(u => u.userId === userId);

    res.json({
      success: true,
      count: userUploads.length,
      uploads: userUploads
    });
  } catch (error) {
    console.error('Get user uploads error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user uploads' 
    });
  }
});

/**
 * NEW: Get uploads by user Aadhar
 */
router.get('/history/aadhar/:aadhar', (req, res) => {
  try {
    const { aadhar } = req.params;
    const history = readUploadHistory();
    
    const userUploads = history.filter(u => u.userAadhar === aadhar);

    res.json({
      success: true,
      count: userUploads.length,
      uploads: userUploads
    });
  } catch (error) {
    console.error('Get user uploads by aadhar error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user uploads' 
    });
  }
});

/**
 * Get all upload history
 */
router.get('/history/all', (req, res) => {
  try {
    const history = readUploadHistory();

    res.json({
      success: true,
      count: history.length,
      uploads: history
    });
  } catch (error) {
    console.error('Get all upload history error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get upload history' 
    });
  }
});

/**
 * Get upload by record ID
 */
router.get('/:recordId', (req, res) => {
  try {
    const { recordId } = req.params;
    const history = readUploadHistory();
    
    const upload = history.find(u => u.recordId === recordId);

    if (!upload) {
      return res.status(404).json({ 
        success: false, 
        error: 'Upload record not found' 
      });
    }

    res.json({
      success: true,
      upload
    });
  } catch (error) {
    console.error('Get upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get upload' 
    });
  }
});

/**
 * Get complete record history (uploads + transfers)
 */
router.get('/complete-history/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const uploadHistory = readUploadHistory();
    
    // Read transfer history
    const TRANSFER_HISTORY_FILE = path.join(__dirname, 'transfer_history.json');
    let transferHistory = [];
    if (fs.existsSync(TRANSFER_HISTORY_FILE)) {
      const transferData = fs.readFileSync(TRANSFER_HISTORY_FILE, 'utf8');
      transferHistory = JSON.parse(transferData);
    }

    const uploads = uploadHistory.filter(u => u.recordId === recordId);
    const transfers = transferHistory.filter(t => t.recordId === recordId);

    // Combine and sort by timestamp
    const allEvents = [
      ...uploads.map(u => ({ ...u, type: 'upload', timestamp: u.uploadedAt })),
      ...transfers.map(t => ({ ...t, type: 'transfer', timestamp: t.initiatedAt }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      recordId,
      totalEvents: allEvents.length,
      uploads: uploads.length,
      transfers: transfers.length,
      history: allEvents
    });
  } catch (error) {
    console.error('Get complete history error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get complete history' 
    });
  }
});

module.exports = router;