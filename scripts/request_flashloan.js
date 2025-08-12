const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");

async function main() {
  const [signer] = await ethers.getSigners();
  const { receiver } = JSON.parse(fs.readFileSync("flashloan.json"));

  const contract = await ethers.getContractAt("FlashLoanReceiver", receiver);

  const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH
  const amount = ethers.utils.parseEther("10"); // 10 WETH

  const tx = await contract.requestFlashLoan(weth, amount);
  await tx.wait();

  console.log("✅ Flashloan executed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
