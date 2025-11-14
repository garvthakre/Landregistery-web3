const hre = require("hardhat");

async function main() {
    // Get the ContractFactory
    const DiamondTracker = await hre.ethers.getContractFactory("DiamondTracker"); 

    // Deploy the contract
    const diamondTracker = await DiamondTracker.deploy(); // 🔴 FIXED: Await the deployment

    // Wait until deployment is completed
    await diamondTracker.waitForDeployment();  // ✅ Replaces `deployed()`

    // Get the deployed contract address
    console.log(`DiamondTracker deployed to: ${await diamondTracker.getAddress()}`);
}

// Run the script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });