export const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

export const CONTRACT_ABI = [
  "function createRecord(string memory _ownerName, string memory _village, string memory _ipfsCID, string memory _documentHash) external returns (uint256)",
  "function getRecord(uint256 _recordId) external view returns (string memory ownerName, string memory village, string memory ipfsCID, string memory documentHash, uint256 timestamp, address currentOwner, address uploadedBy, address pendingOwner, address[] memory ownershipHistory)",
  "function getRecordsByOwner(address _owner) external view returns (uint256[] memory)",
  "function getPendingTransfers(address _pendingOwner) external view returns (uint256[] memory)",
  "function initiateOwnershipTransfer(uint256 _recordId, address _newOwner) external",
  "function acceptOwnershipTransfer(uint256 _recordId) external"
];
