# Decentralized Tribal Land Registry  
A Web3-powered land governance system that secures tribal land rights using **blockchain**, **AI**, and **geo-tagged verification**. The platform ensures transparency, prevents manipulation of land records, and establishes a trusted workflow between landowners and authorities.

---

## Introduction  
Tribal communities often face land record manipulation, missing documentation, and unauthorized boundary changes. Traditional systems rely on fragile paper records and opaque verification processes.

This project solves these challenges by combining **blockchain immutability** (controversial topic) , **AI-powered document analysis**, and **GPS-based geo-tagging**. Landowners can register land digitally, while authorities verify boundaries with transparent on-chain approval.

---

## Why Web3?  
Web3 is the perfect foundation for trustworthy land governance:

- **Decentralized & Trustless** — No single authority can alter land data.  
- **Immutable Records** — Once registered, land titles cannot be changed or deleted.  
- **Self-Sovereign Ownership** — Landowners control identity via MetaMask and on-chain signatures.  
- **Transparent Approvals** — Every verification step is stored publicly on the blockchain.  
- **Tamper-Proof Governance** — Eliminates fraud, corruption, and data manipulation.  

Web3 ensures land rights are protected **permanently and transparently**.

---

## Tech Stack

### **Frontend**
- React.js  
- TailwindCSS  
- Google Maps API (boundary display & coordinates)  
- MetaMask Integration (wallet + signatures)

### **Backend**
- Node.js + Express  
- AI OCR Module (document extraction)  

### **Web3 / Blockchain**
- Solidity Smart Contracts  
- Ethereum / Hardhat  
- IPFS + Pinata (document storage)  

---

## System Flow

### **1. Landowner Registration / KYC**  
User creates an account and verifies identity. Wallet (MetaMask) is linked.

### **2. Land Registration (Document Upload)**  
Landowner uploads original land documents.  
AI–OCR automatically extracts:
- Owner details  
- Survey numbers  
- Land area  
- Boundaries / metadata  

The extracted information + document hash is stored on the blockchain.

### **3. Request for Geo-Tagging**  
To add location proof, the landowner sends a request to the admin/patwari for field verification.

### **4. Admin (Patwari) Field Visit**  
The patwari visits the land physically and:
- Walks the boundary with a mobile device  
- Uses the **geo-tagging trace tool** to capture GPS coordinates  
- The system calculates geofenced area from traced coordinates

### **5. Smart Matching & Tolerance Check**  
The system compares:
- **Document area** (from AI-OCR)  
- **Geo-tagged area** (from field walk)  

If differences are within the acceptable tolerance, the land is approved.

### **6. Approval or Rejection**  
-  **Approved:** Land record + geo-boundary is permanently stored on blockchain.  
-  **Rejected:** Owner is notified and can re-submit updated documents or request re-verification.

---

## This is a hackathon project of IIIT Naya Raipur
>Build with Love & Grind by Team : Adnan Khan, Garv Thakre, Prakash Hamirwasia
