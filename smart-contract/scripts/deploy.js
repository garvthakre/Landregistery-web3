const hre = require("hardhat");

async function main() {
    const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
    const landRegistry = await LandRegistry.deploy();

    await landRegistry.waitForDeployment();

    console.log(`LandRegistry deployed to: ${await landRegistry.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });
