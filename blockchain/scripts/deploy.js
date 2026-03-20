const hre = require("hardhat");

async function main() {
  console.log("Deploying FakeAccountRegistry...");

  const FakeAccountRegistry = await hre.ethers.getContractFactory("FakeAccountRegistry");
  const contract = await FakeAccountRegistry.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();  // ← gets the address
  console.log("FakeAccountRegistry deployed at:", address);  // ← prints it
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});