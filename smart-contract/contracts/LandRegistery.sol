// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LandRegistry
 * @dev Decentralized Land Registry System with Area-based Verification
 */
contract LandRegistry {
    
    // ==================== STRUCTS ====================
    
    struct AreaInfo {
        string claimedArea;      // Area from document (e.g., "2.5 acres")
        string verifiedArea;     // Area from geotagging
        string unit;             // Unit (acres, hectares, sq meters)
        bool verified;
        uint256 verifiedAt;
        address verifiedBy;
    }
    
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
        AreaInfo areaInfo;
        bool areaVerified;
        bool pendingAreaVerification;
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
    mapping(address => bool) public patwariAdmins;
    uint256 private recordCount;
    uint256 private transferRequestCount;
    address public owner;
    
    // ==================== EVENTS ====================
    
    event RecordCreated(
        uint256 indexed recordId,
        address indexed owner,
        string village,
        string ipfsCID
    );
    
    event AreaVerificationRequested(
        uint256 indexed recordId,
        string claimedArea,
        string unit,
        uint256 timestamp
    );
    
    event AreaVerificationCompleted(
        uint256 indexed recordId,
        bool matched,
        address indexed verifiedBy,
        uint256 timestamp
    );
    
    event TransferInitiated(
        uint256 indexed transferId,
        uint256 indexed recordId,
        address indexed from,
        address to,
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
    
    event PatwariAdded(address indexed patwari);
    event PatwariRemoved(address indexed patwari);
    
    // ==================== MODIFIERS ====================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyPatwari() {
        require(patwariAdmins[msg.sender], "Only Patwari can perform this action");
        _;
    }
    
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
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() {
        owner = msg.sender;
        patwariAdmins[msg.sender] = true;
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    function addPatwari(address _patwari) external onlyOwner {
        require(_patwari != address(0), "Invalid address");
        patwariAdmins[_patwari] = true;
        emit PatwariAdded(_patwari);
    }
    
    function removePatwari(address _patwari) external onlyOwner {
        patwariAdmins[_patwari] = false;
        emit PatwariRemoved(_patwari);
    }
    
    // ==================== CORE FUNCTIONS ====================
    
    function createRecord(
        string memory _ownerName,
        string memory _village,
        string memory _ipfsCID,
        string memory _documentHash,
        string memory _claimedArea,
        string memory _unit
    ) external returns (uint256) {
        require(bytes(_ownerName).length > 0, "Owner name required");
        require(bytes(_village).length > 0, "Village name required");
        require(bytes(_ipfsCID).length > 0, "IPFS CID required");
        require(bytes(_documentHash).length > 0, "Document hash required");
        require(bytes(_claimedArea).length > 0, "Area required");
        require(bytes(_unit).length > 0, "Unit required");
        
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
        
        newRecord.areaInfo = AreaInfo({
            claimedArea: _claimedArea,
            verifiedArea: "",
            unit: _unit,
            verified: false,
            verifiedAt: 0,
            verifiedBy: address(0)
        });
        
        newRecord.areaVerified = false;
        newRecord.pendingAreaVerification = true;
        
        recordCount++;
        
        emit RecordCreated(newRecordId, msg.sender, _village, _ipfsCID);
        emit AreaVerificationRequested(newRecordId, _claimedArea, _unit, block.timestamp);
        
        return newRecordId;
    }
    
    function verifyArea(
        uint256 _recordId,
        string memory _verifiedArea
    ) 
        external 
        onlyPatwari
        recordExists(_recordId)
    {
        require(landRecords[_recordId].pendingAreaVerification, "No pending verification");
        require(bytes(_verifiedArea).length > 0, "Verified area required");
        
        LandRecord storage record = landRecords[_recordId];
        
        record.areaInfo.verifiedArea = _verifiedArea;
        record.areaInfo.verified = true;
        record.areaInfo.verifiedAt = block.timestamp;
        record.areaInfo.verifiedBy = msg.sender;
        
        // Compare areas (exact match handled off-chain with tolerance)
        bool matched = (
            keccak256(bytes(_verifiedArea)) == keccak256(bytes(record.areaInfo.claimedArea))
        );
        
        record.areaVerified = matched;
        record.pendingAreaVerification = false;
        
        emit AreaVerificationCompleted(_recordId, matched, msg.sender, block.timestamp);
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
            address[] memory ownershipHistory,
            string memory claimedArea,
            string memory verifiedArea,
            string memory unit,
            bool areaVerified,
            bool pendingAreaVerification
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
            record.ownershipHistory,
            record.areaInfo.claimedArea,
            record.areaInfo.verifiedArea,
            record.areaInfo.unit,
            record.areaVerified,
            record.pendingAreaVerification
        );
    }
    
    function getRecordCount() external view returns (uint256) {
        return recordCount;
    }
    
    function getPendingAreaVerifications() external view returns (uint256[] memory) {
        uint256 pendingCount = 0;
        
        for (uint256 i = 0; i < recordCount; i++) {
            if (landRecords[i].pendingAreaVerification) {
                pendingCount++;
            }
        }
        
        uint256[] memory pendingRecords = new uint256[](pendingCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < recordCount; i++) {
            if (landRecords[i].pendingAreaVerification) {
                pendingRecords[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return pendingRecords;
    }
    
    // ==================== TRANSFER FUNCTIONS ====================
    
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
        require(landRecords[_recordId].areaVerified, "Area not verified");
        
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