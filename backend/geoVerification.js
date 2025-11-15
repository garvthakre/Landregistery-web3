const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Environment variables
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

const CONTRACT_ABI = [
  "function verifyArea(uint256 _recordId, string _verifiedArea) external",
  "function getPendingAreaVerifications() external view returns (uint256[])",
  "function getRecord(uint256 _recordId) external view returns (string ownerName, string village, string ipfsCID, string documentHash, uint256 timestamp, address currentOwner, address uploadedBy, address pendingOwner, address[] ownershipHistory, string claimedArea, string verifiedArea, string unit, bool areaVerified, bool pendingAreaVerification)"
];

// Initialize provider & contract
let provider, wallet, contract;

try {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
} catch (error) {
  console.error("⚠️ Geo verification blockchain connection failed:", error);
}

// File paths
const GEO_VERIFICATION_FILE = path.join(__dirname, 'geo_verifications.json');

// Initialize file
if (!fs.existsSync(GEO_VERIFICATION_FILE)) {
  fs.writeFileSync(GEO_VERIFICATION_FILE, JSON.stringify([]));
}

// Helper functions
const readGeoVerifications = () => {
  try {
    const data = fs.readFileSync(GEO_VERIFICATION_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeGeoVerifications = (verifications) => {
  fs.writeFileSync(GEO_VERIFICATION_FILE, JSON.stringify(verifications, null, 2));
};

// Calculate area from coordinates using Shoelace formula (returns square meters)
function calculateAreaFromCoordinates(coordinates) {
  if (coordinates.length < 3) return 0;
  
  // Convert lat/lng to approximate meters (for small areas)
  const toMeters = (lat, lng) => {
    const R = 6371000; // Earth radius in meters
    const latRad = lat * Math.PI / 180;
    const x = R * lng * Math.PI / 180 * Math.cos(latRad);
    const y = R * latRad;
    return { x, y };
  };
  
  // Convert all coordinates to meters
  const metersCoords = coordinates.map(c => toMeters(c.lat, c.lng));
  
  // Shoelace formula
  let area = 0;
  for (let i = 0; i < metersCoords.length; i++) {
    const j = (i + 1) % metersCoords.length;
    area += metersCoords[i].x * metersCoords[j].y;
    area -= metersCoords[j].x * metersCoords[i].y;
  }
  
  return Math.abs(area / 2); // in square meters
}

// Convert area between units
function convertArea(value, fromUnit, toUnit) {
  // Convert to square meters first
  let sqMeters;
  
  switch(fromUnit.toLowerCase()) {
    case 'acres':
    case 'acre':
      sqMeters = value * 4046.86;
      break;
    case 'hectares':
    case 'hectare':
      sqMeters = value * 10000;
      break;
    case 'square meters':
    case 'sq meters':
    case 'sqm':
      sqMeters = value;
      break;
    case 'bigha':
      sqMeters = value * 2529.3; // Approx for standard bigha
      break;
    default:
      sqMeters = value; // Assume square meters if unknown
  }
  
  // Convert to target unit
  switch(toUnit.toLowerCase()) {
    case 'acres':
    case 'acre':
      return sqMeters / 4046.86;
    case 'hectares':
    case 'hectare':
      return sqMeters / 10000;
    case 'square meters':
    case 'sq meters':
    case 'sqm':
      return sqMeters;
    case 'bigha':
      return sqMeters / 2529.3;
    default:
      return sqMeters;
  }
}

/**
 * Get all pending area verifications from blockchain
 */
router.get('/pending', async (req, res) => {
  try {
    const pendingIds = await contract.getPendingAreaVerifications();
    
    const pendingRecords = [];
    for (const id of pendingIds) {
      try {
        const record = await contract.getRecord(id);
        pendingRecords.push({
          recordId: id.toString(),
          ownerName: record.ownerName,
          village: record.village,
          claimedArea: record.claimedArea,
          unit: record.unit,
          timestamp: new Date(Number(record.timestamp) * 1000).toISOString()
        });
      } catch (error) {
        console.error(`Error fetching record ${id}:`, error.message);
      }
    }

    res.json({
      success: true,
      count: pendingRecords.length,
      records: pendingRecords
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get pending verifications' 
    });
  }
});

/**
 * Submit area verification from admin (after geotagging)
 */
router.post('/submit', async (req, res) => {
  try {
    const { recordId, coordinates, adminAddress } = req.body;

    if (!recordId || !coordinates || coordinates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    console.log(`📍 Processing area verification for record ${recordId}`);
    console.log(`   ${coordinates.length} coordinates captured`);

    // Calculate area from coordinates (in square meters)
    const areaSqMeters = calculateAreaFromCoordinates(coordinates);
    console.log(`   Calculated area: ${areaSqMeters.toFixed(2)} square meters`);

    // Get claimed area from blockchain
    const record = await contract.getRecord(recordId);
    const claimedAreaValue = parseFloat(record.claimedArea);
    const claimedUnit = record.unit;

    console.log(`   Claimed area: ${claimedAreaValue} ${claimedUnit}`);

    // Convert claimed area to square meters for comparison
    const claimedAreaSqMeters = convertArea(claimedAreaValue, claimedUnit, 'square meters');
    console.log(`   Claimed area in sq meters: ${claimedAreaSqMeters.toFixed(2)}`);

    // Calculate difference percentage
    const difference = Math.abs(areaSqMeters - claimedAreaSqMeters);
    const percentageDiff = (difference / claimedAreaSqMeters) * 100;

    console.log(`   Difference: ${difference.toFixed(2)} sq meters (${percentageDiff.toFixed(2)}%)`);

    // Define tolerance (10%)
    const TOLERANCE_PERCENTAGE = 10;
    const matched = percentageDiff <= TOLERANCE_PERCENTAGE;

    console.log(`   Match result: ${matched ? '✅ MATCHED' : '❌ NOT MATCHED'}`);

    // Convert verified area back to claimed unit for storage
    const verifiedAreaInClaimedUnit = convertArea(areaSqMeters, 'square meters', claimedUnit);

    // Submit verification to blockchain
    console.log('📝 Submitting to blockchain...');
    const tx = await contract.verifyArea(
      recordId,
      verifiedAreaInClaimedUnit.toFixed(2)
    );

    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✔️ Transaction confirmed:', receipt.hash);

    // Log to local storage
    const verifications = readGeoVerifications();
    const verification = {
      recordId,
      claimedArea: {
        value: claimedAreaValue,
        unit: claimedUnit,
        sqMeters: claimedAreaSqMeters.toFixed(2)
      },
      verifiedArea: {
        value: verifiedAreaInClaimedUnit.toFixed(2),
        unit: claimedUnit,
        sqMeters: areaSqMeters.toFixed(2)
      },
      capturedPoints: coordinates.length,
      difference: {
        absolute: difference.toFixed(2),
        percentage: percentageDiff.toFixed(2)
      },
      matched,
      verifiedBy: adminAddress || wallet.address,
      verifiedAt: new Date().toISOString(),
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      allCoordinates: coordinates
    };

    verifications.push(verification);
    writeGeoVerifications(verifications);

    res.json({
      success: true,
      matched,
      claimedArea: `${claimedAreaValue} ${claimedUnit}`,
      verifiedArea: `${verifiedAreaInClaimedUnit.toFixed(2)} ${claimedUnit}`,
      difference: `${percentageDiff.toFixed(2)}%`,
      tolerance: `${TOLERANCE_PERCENTAGE}%`,
      verification,
      message: matched 
        ? `✅ Area verified! Difference ${percentageDiff.toFixed(2)}% within ${TOLERANCE_PERCENTAGE}% tolerance.`
        : `❌ Area verification failed. Difference ${percentageDiff.toFixed(2)}% exceeds ${TOLERANCE_PERCENTAGE}% tolerance.`
    });
  } catch (error) {
    console.error('❌ Area verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get verification history for a record
 */
router.get('/history/:recordId', (req, res) => {
  try {
    const { recordId } = req.params;
    const verifications = readGeoVerifications();
    
    const recordHistory = verifications.filter(v => v.recordId === recordId);

    res.json({
      success: true,
      count: recordHistory.length,
      verifications: recordHistory
    });
  } catch (error) {
    console.error('Get verification history error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get verification history' 
    });
  }
});

/**
 * Get all verification history
 */
router.get('/history', (req, res) => {
  try {
    const verifications = readGeoVerifications();

    res.json({
      success: true,
      count: verifications.length,
      verifications
    });
  } catch (error) {
    console.error('Get all verification history error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get verification history' 
    });
  }
});

module.exports = router;