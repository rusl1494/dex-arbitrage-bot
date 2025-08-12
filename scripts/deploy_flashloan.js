const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying flashloan contract with:", deployer.address);

  const FlashLoanReceiver = await hre.ethers.getContractFactory("FlashLoanReceiver");
  const contract = await FlashLoanReceiver.deploy(
    "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5", // Aave PoolAddressesProvider
    "0x7BeA39867e4169DBe237d55C8242a8f2fcDcc387"  // Aave Pool
  );
  await contract.deployed();

  console.log("✅ FlashLoanReceiver deployed to:", contract.address);

  // сохранить адрес
  fs.writeFileSync("flashloan.json", JSON.stringify({ receiver: contract.address }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
