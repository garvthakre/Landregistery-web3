 
export const CONTRACT_ADDRESS =  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = [
  "function createRecord(string memory _ownerName, string memory _village, string memory _ipfsCID, string memory _documentHash) external returns (uint256)",
  "function getRecord(uint256 _recordId) external view returns (string memory ownerName, string memory village, string memory ipfsCID, string memory documentHash, uint256 timestamp, address currentOwner, address uploadedBy, address pendingOwner, address[] memory ownershipHistory)",
  "function getRecordsByOwner(address _owner) external view returns (uint256[] memory)",
  "function getPendingTransfers(address _pendingOwner) external view returns (uint256[] memory)",
  "function initiateOwnershipTransfer(uint256 _recordId, address _newOwner) external",
  "function acceptOwnershipTransfer(uint256 _recordId) external",
  "function getRecordCount() external view returns (uint256)",
  "event RecordCreated(uint256 indexed recordId, address indexed owner, string village, string ipfsCID)"
];