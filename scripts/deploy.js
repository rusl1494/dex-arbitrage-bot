// scripts/deploy.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);

  const ArbitrageBot = await hre.ethers.getContractFactory("ArbitrageBot");

  const uniswapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const sushiswapRouter = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";

  const bot = await ArbitrageBot.deploy(uniswapRouter, sushiswapRouter);
  await bot.deployed();

  const address = bot.address;
  console.log("ArbitrageBot deployed to:", address);

  // ⬇️ Save to deployment.json
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify({ contractAddress: address }, null, 2));
  console.log(`✅ Address saved to ${deploymentPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
