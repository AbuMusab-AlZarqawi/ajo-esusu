import { ethers } from "hardhat";

async function main() {
  console.log("Deploying AjoEsusu to Ritual Chain...");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "RITUAL");

  const AjoEsusu = await ethers.getContractFactory("AjoEsusu");
  const contract = await AjoEsusu.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("\n✅ AjoEsusu deployed successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract Address:", address);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\nCopy the contract address above into your .env file:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
