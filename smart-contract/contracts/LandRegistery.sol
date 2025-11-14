// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LandRegistry
 * @dev Decentralized Land Registry System for Tribal Regions
 * @notice Prevents land fraud, unauthorized transfers, and ensures Gram Sabha compliance
 */
contract LandRegistry {
    
    // ==================== STRUCTS ====================
    
    struct LandRecord {
        string ownerName;           // Name of the land owner
        string village;             // Village name
        string ipfsCID;            // IPFS Content Identifier
        string documentHash;        // SHA-256 hash of the document
        uint256 timestamp;          // Registration timestamp
        address currentOwner;       // Current owner's wallet address
        address uploadedBy;         // Address that uploaded the record
        address pendingOwner;       // Pending transfer recipient
        address[] ownershipHistory; // Complete ownership history
    }
    
    // ==================== STATE VARIABLES ====================
    
    mapping(uint256 => LandRecord) private landRecords;
    uint256 private recordCount;
    
    // ==================== EVENTS ====================
    
    event RecordCreated(
        uint256 indexed recordId,
        address indexed owner,
        string village,
        string ipfsCID
    );
    
    event OwnershipTransferInitiated(
        uint256 indexed recordId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    
    event OwnershipTransferCompleted(
        uint256 indexed recordId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 timestamp
    );
    
    event TransferCancelled(
        uint256 indexed recordId,
        address indexed owner,
        address indexed cancelledPendingOwner
    );
    
    // ==================== MODIFIERS ====================
    
    modifier onlyCurrentOwner(uint256 _recordId) {
        require(
            landRecords[_recordId].currentOwner == msg.sender,
            "Only current owner can perform this action"
        );
        _;
    }
    
    modifier recordExists(uint256 _recordId) {
        require(_recordId < recordCount, "Record does not exist");
        _;
    }
    
    modifier onlyPendingOwner(uint256 _recordId) {
        require(
            landRecords[_recordId].pendingOwner == msg.sender,
            "Only pending owner can accept transfer"
        );
        _;
    }
    
    // ==================== CORE FUNCTIONS ====================
    
    /**
     * @dev Create a new land record
     * @param _ownerName Name of the land owner
     * @param _village Village name
     * @param _ipfsCID IPFS Content Identifier
     * @param _documentHash SHA-256 hash of the document
     * @return recordId The ID of the newly created record
     */
    function createRecord(
        string memory _ownerName,
        string memory _village,
        string memory _ipfsCID,
        string memory _documentHash
    ) external returns (uint256) {
        require(bytes(_ownerName).length > 0, "Owner name required");
        require(bytes(_village).length > 0, "Village name required");
        require(bytes(_ipfsCID).length > 0, "IPFS CID required");
        require(bytes(_documentHash).length > 0, "Document hash required");
        
        uint256 newRecordId = recordCount;
        
        LandRecord storage newRecord = landRecords[newRecordId];
        newRecord.ownerName = _ownerName;
        newRecord.village = _village;
        newRecord.ipfsCID = _ipfsCID;
        newRecord.documentHash = _documentHash;
        newRecord.timestamp = block.timestamp;
        newRecord.currentOwner = msg.sender;
        newRecord.uploadedBy = msg.sender;
        newRecord.pendingOwner = address(0);
        newRecord.ownershipHistory.push(msg.sender);
        
        recordCount++;
        
        emit RecordCreated(newRecordId, msg.sender, _village, _ipfsCID);
        
        return newRecordId;
    }
    
    /**
     * @dev Get a land record by ID
     * @param _recordId The record ID
     * @return LandRecord struct
     */
    function getRecord(uint256 _recordId) 
        external 
        view 
        recordExists(_recordId) 
        returns (
            string memory ownerName,
            string memory village,
            string memory ipfsCID,
            string memory documentHash,
            uint256 timestamp,
            address currentOwner,
            address uploadedBy,
            address pendingOwner,
            address[] memory ownershipHistory
        ) 
    {
        LandRecord storage record = landRecords[_recordId];
        return (
            record.ownerName,
            record.village,
            record.ipfsCID,
            record.documentHash,
            record.timestamp,
            record.currentOwner,
            record.uploadedBy,
            record.pendingOwner,
            record.ownershipHistory
        );
    }
    
    /**
     * @dev Get all land records
     * @return Array of all record IDs and basic info
     */
    function getAllRecords() external view returns (uint256[] memory) {
        uint256[] memory allRecordIds = new uint256[](recordCount);
        for (uint256 i = 0; i < recordCount; i++) {
            allRecordIds[i] = i;
        }
        return allRecordIds;
    }
    
    /**
     * @dev Get total number of records
     */
    function getRecordCount() external view returns (uint256) {
        return recordCount;
    }
    
    /**
     * @dev Initiate ownership transfer (Step 1)
     * @param _recordId The record ID
     * @param _newOwner Address of the new owner
     */
    function initiateOwnershipTransfer(uint256 _recordId, address _newOwner)
        external
        recordExists(_recordId)
        onlyCurrentOwner(_recordId)
    {
        require(_newOwner != address(0), "Invalid new owner address");
        require(_newOwner != msg.sender, "Cannot transfer to yourself");
        require(
            landRecords[_recordId].pendingOwner == address(0),
            "Transfer already pending. Cancel it first."
        );
        
        landRecords[_recordId].pendingOwner = _newOwner;
        
        emit OwnershipTransferInitiated(
            _recordId,
            msg.sender,
            _newOwner,
            block.timestamp
        );
    }
    
    /**
     * @dev Accept ownership transfer (Step 2)
     * @param _recordId The record ID
     */
    function acceptOwnershipTransfer(uint256 _recordId)
        external
        recordExists(_recordId)
        onlyPendingOwner(_recordId)
    {
        LandRecord storage record = landRecords[_recordId];
        address previousOwner = record.currentOwner;
        address newOwner = msg.sender;
        
        // Update ownership
        record.currentOwner = newOwner;
        record.ownershipHistory.push(newOwner);
        record.pendingOwner = address(0);
        
        emit OwnershipTransferCompleted(
            _recordId,
            previousOwner,
            newOwner,
            block.timestamp
        );
    }
    
    /**
     * @dev Cancel a pending ownership transfer
     * @param _recordId The record ID
     */
    function cancelOwnershipTransfer(uint256 _recordId)
        external
        recordExists(_recordId)
        onlyCurrentOwner(_recordId)
    {
        require(
            landRecords[_recordId].pendingOwner != address(0),
            "No pending transfer to cancel"
        );
        
        address cancelledPendingOwner = landRecords[_recordId].pendingOwner;
        landRecords[_recordId].pendingOwner = address(0);
        
        emit TransferCancelled(_recordId, msg.sender, cancelledPendingOwner);
    }
    
    /**
     * @dev Verify document hash
     * @param _recordId The record ID
     * @param _documentHash Hash to verify
     * @return bool True if hash matches
     */
    function verifyHash(uint256 _recordId, string memory _documentHash)
        external
        view
        recordExists(_recordId)
        returns (bool)
    {
        return keccak256(bytes(landRecords[_recordId].documentHash)) == 
               keccak256(bytes(_documentHash));
    }
    
    /**
     * @dev Get records owned by a specific address
     * @param _owner Owner address
     * @return Array of record IDs owned by the address
     */
    function getRecordsByOwner(address _owner) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 ownedCount = 0;
        
        // Count owned records
        for (uint256 i = 0; i < recordCount; i++) {
            if (landRecords[i].currentOwner == _owner) {
                ownedCount++;
            }
        }
        
        // Create array of owned record IDs
        uint256[] memory ownedRecords = new uint256[](ownedCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < recordCount; i++) {
            if (landRecords[i].currentOwner == _owner) {
                ownedRecords[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return ownedRecords;
    }
    
    /**
     * @dev Get pending transfers for an address
     * @param _pendingOwner Pending owner address
     * @return Array of record IDs with pending transfers
     */
    function getPendingTransfers(address _pendingOwner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 pendingCount = 0;
        
        for (uint256 i = 0; i < recordCount; i++) {
            if (landRecords[i].pendingOwner == _pendingOwner) {
                pendingCount++;
            }
        }
        
        uint256[] memory pendingRecords = new uint256[](pendingCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < recordCount; i++) {
            if (landRecords[i].pendingOwner == _pendingOwner) {
                pendingRecords[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return pendingRecords;
    }