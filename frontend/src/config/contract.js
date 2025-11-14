export const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

export const CONTRACT_ABI = [
  "function createRecord(string memory _ownerName, string memory _village, string memory _ipfsCID, string memory _documentHash) external returns (uint256)",
  "function getRecord(uint256 _recordId) external view returns (string memory ownerName, string memory village, string memory ipfsCID, string memory documentHash, uint256 timestamp, address currentOwner, address uploadedBy, address pendingOwner, address[] memory ownershipHistory)",
  "function getRecordsByOwner(address _owner) external view returns (uint256[] memory)",
  "function getRecordCount() external view returns (uint256)",
  
  // New transfer functions
  "function initiateTransfer(uint256 _recordId, address _newOwner) external returns (uint256)",
  "function submitTransferDocument(uint256 _transferId, string memory _newDocumentHash, string memory _newIpfsCID) external",
  "function verifyTransferDocument(uint256 _transferId, bool _verified) external",
  "function acceptTransfer(uint256 _transferId) external",
  "function cancelTransfer(uint256 _transferId) external",
  
  // Transfer view functions
  "function getTransferRequest(uint256 _transferId) external view returns (uint256 recordId, address fromOwner, address toOwner, string memory newDocumentHash, string memory newIpfsCID, bool documentVerified, bool isActive, uint256 initiatedAt)",
  "function getPendingTransfers(address _pendingOwner) external view returns (uint256[] memory)",
  
  // Events
  "event RecordCreated(uint256 indexed recordId, address indexed owner, string village, string ipfsCID)",
  "event TransferInitiated(uint256 indexed transferId, uint256 indexed recordId, address indexed from, address to, uint256 timestamp)",
  "event DocumentSubmittedForVerification(uint256 indexed transferId, uint256 indexed recordId, string newDocumentHash, string newIpfsCID, uint256 timestamp)",
  "event DocumentVerified(uint256 indexed transferId, uint256 indexed recordId, bool verified, uint256 timestamp)",
  "event TransferCompleted(uint256 indexed transferId, uint256 indexed recordId, address indexed from, address to, string newDocumentHash, uint256 timestamp)",
  "event TransferCancelled(uint256 indexed transferId, uint256 indexed recordId, address indexed cancelledBy)"
];