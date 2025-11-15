// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LandRegistry
 * @dev Decentralized Land Registry System for Tribal Regions with Document Verification
 */
contract LandRegistry {
    
    // ==================== STRUCTS ====================
    
    struct LandRecord {
        string ownerName;
        string village;
        string ipfsCID;
        string documentHash;
        uint256 timestamp;
        address currentOwner;
        address uploadedBy;
        address pendingOwner;
        address[] ownershipHistory;
    }
    
    struct TransferRequest {
        uint256 recordId;
        address fromOwner;
        address toOwner;
        string newDocumentHash;
        string newIpfsCID;
        bool documentVerified;
        bool isActive;
        uint256 initiatedAt;
    }
    
    // ==================== STATE VARIABLES ====================
    
    mapping(uint256 => LandRecord) private landRecords;
    mapping(uint256 => TransferRequest) public transferRequests;
    uint256 private recordCount;
    uint256 private transferRequestCount;
    
    // ==================== EVENTS ====================
    
    event RecordCreated(
        uint256 indexed recordId,
        address indexed owner,
        string village,
        string ipfsCID
    );
    
    event TransferInitiated(
        uint256 indexed transferId,
        uint256 indexed recordId,
        address indexed from,
        address to,
        uint256 timestamp
    );
    
    event DocumentSubmittedForVerification(
        uint256 indexed transferId,
        uint256 indexed recordId,
        string newDocumentHash,
        string newIpfsCID,
        uint256 timestamp
    );
    
    event DocumentVerified(
        uint256 indexed transferId,
        uint256 indexed recordId,
        bool verified,
        uint256 timestamp
    );
    
    event TransferCompleted(
        uint256 indexed transferId,
        uint256 indexed recordId,
        address indexed from,
        address to,
        string newDocumentHash,
        uint256 timestamp
    );
    
    event TransferCancelled(
        uint256 indexed transferId,
        uint256 indexed recordId,
        address indexed cancelledBy
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
    
    modifier transferExists(uint256 _transferId) {
        require(_transferId < transferRequestCount, "Transfer request does not exist");
        _;
    }
    
    // ==================== CORE FUNCTIONS ====================
    
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
    
    function getRecordCount() external view returns (uint256) {
        return recordCount;
    }
    
    // ==================== TRANSFER FUNCTIONS ====================
    
    /**
     * @dev Step 1: Initiate transfer request
     */
    function initiateTransfer(uint256 _recordId, address _newOwner)
        external
        recordExists(_recordId)
        onlyCurrentOwner(_recordId)
        returns (uint256)
    {
        require(_newOwner != address(0), "Invalid new owner address");
        require(_newOwner != msg.sender, "Cannot transfer to yourself");
        require(
            landRecords[_recordId].pendingOwner == address(0),
            "Transfer already pending"
        );
        
        uint256 transferId = transferRequestCount;
        
        transferRequests[transferId] = TransferRequest({
            recordId: _recordId,
            fromOwner: msg.sender,
            toOwner: _newOwner,
            newDocumentHash: "",
            newIpfsCID: "",
            documentVerified: false,
            isActive: true,
            initiatedAt: block.timestamp
        });
        
        landRecords[_recordId].pendingOwner = _newOwner;
        transferRequestCount++;
        
        emit TransferInitiated(transferId, _recordId, msg.sender, _newOwner, block.timestamp);
        
        return transferId;
    }
    
    /**
     * @dev Step 2: Submit new document for verification
     */
    function submitTransferDocument(
        uint256 _transferId,
        string memory _newDocumentHash,
        string memory _newIpfsCID
    )
        external
        transferExists(_transferId)
    {
        TransferRequest storage transfer = transferRequests[_transferId];
        
        require(transfer.isActive, "Transfer request is not active");
        require(msg.sender == transfer.toOwner, "Only new owner can submit document");
        require(bytes(_newDocumentHash).length > 0, "Document hash required");
        require(bytes(_newIpfsCID).length > 0, "IPFS CID required");
        
        transfer.newDocumentHash = _newDocumentHash;
        transfer.newIpfsCID = _newIpfsCID;
        
        emit DocumentSubmittedForVerification(
            _transferId,
            transfer.recordId,
            _newDocumentHash,
            _newIpfsCID,
            block.timestamp
        );
    }
    
    /**
     * @dev Step 3: Verify document (can be called by backend after AI verification)
     */
    function verifyTransferDocument(uint256 _transferId, bool _verified)
        external
        transferExists(_transferId)
    {
        TransferRequest storage transfer = transferRequests[_transferId];
        
        require(transfer.isActive, "Transfer request is not active");
        require(bytes(transfer.newDocumentHash).length > 0, "No document submitted yet");
        
        transfer.documentVerified = _verified;
        
        emit DocumentVerified(_transferId, transfer.recordId, _verified, block.timestamp);
    }
    
    /**
     * @dev Step 4: Accept transfer (after document verification)
     */
    function acceptTransfer(uint256 _transferId)
        external
        transferExists(_transferId)
    {
        TransferRequest storage transfer = transferRequests[_transferId];
        
        require(transfer.isActive, "Transfer request is not active");
        require(msg.sender == transfer.toOwner, "Only new owner can accept");
        require(transfer.documentVerified, "Document not verified yet");
        
        LandRecord storage record = landRecords[transfer.recordId];
        
        // Update record with new document
        record.ipfsCID = transfer.newIpfsCID;
        record.documentHash = transfer.newDocumentHash;
        record.currentOwner = transfer.toOwner;
        record.ownershipHistory.push(transfer.toOwner);
        record.pendingOwner = address(0);
        record.timestamp = block.timestamp;
        
        // Mark transfer as completed
        transfer.isActive = false;
        
        emit TransferCompleted(
            _transferId,
            transfer.recordId,
            transfer.fromOwner,
            transfer.toOwner,
            transfer.newDocumentHash,
            block.timestamp
        );
    }
    
    /**
     * @dev Cancel transfer request
     */
    function cancelTransfer(uint256 _transferId)
        external
        transferExists(_transferId)
    {
        TransferRequest storage transfer = transferRequests[_transferId];
        
        require(transfer.isActive, "Transfer already completed or cancelled");
        require(
            msg.sender == transfer.fromOwner || msg.sender == transfer.toOwner,
            "Only parties involved can cancel"
        );
        
        landRecords[transfer.recordId].pendingOwner = address(0);
        transfer.isActive = false;
        
        emit TransferCancelled(_transferId, transfer.recordId, msg.sender);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    function getTransferRequest(uint256 _transferId)
        external
        view
        transferExists(_transferId)
        returns (
            uint256 recordId,
            address fromOwner,
            address toOwner,
            string memory newDocumentHash,
            string memory newIpfsCID,
            bool documentVerified,
            bool isActive,
            uint256 initiatedAt
        )
    {
        TransferRequest storage transfer = transferRequests[_transferId];
        return (
            transfer.recordId,
            transfer.fromOwner,
            transfer.toOwner,
            transfer.newDocumentHash,
            transfer.newIpfsCID,
            transfer.documentVerified,
            transfer.isActive,
            transfer.initiatedAt
        );
    }
    
    function getRecordsByOwner(address _owner) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 ownedCount = 0;
        
        for (uint256 i = 0; i < recordCount; i++) {
            if (landRecords[i].currentOwner == _owner) {
                ownedCount++;
            }
        }
        
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
    
    function getPendingTransfers(address _pendingOwner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 pendingCount = 0;
        
        for (uint256 i = 0; i < transferRequestCount; i++) {
            if (transferRequests[i].toOwner == _pendingOwner && transferRequests[i].isActive) {
                pendingCount++;
            }
        }
        
        uint256[] memory pendingTransfers = new uint256[](pendingCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < transferRequestCount; i++) {
            if (transferRequests[i].toOwner == _pendingOwner && transferRequests[i].isActive) {
                pendingTransfers[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return pendingTransfers;
    }
    
    function verifyHash(uint256 _recordId, string memory _documentHash)
        external
        view
        recordExists(_recordId)
        returns (bool)
    {
        return keccak256(bytes(landRecords[_recordId].documentHash)) == 
               keccak256(bytes(_documentHash));
    }
}