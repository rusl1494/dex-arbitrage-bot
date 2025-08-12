// scripts/run-arbitrage.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [signer] = await ethers.getSigners();

  const { contractAddress } = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployment.json"))
  );

  const arbAbi = [
    "function executeArbitrage(uint,uint,uint,uint,address[],address[],address,address,uint) external"
  ];

  const arb = new ethers.Contract(contractAddress, arbAbi, signer);

  const routerAbi = [
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory)"
  ];

  const uniswap = new ethers.Contract(
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    routerAbi,
    signer
  );

  const sushiswap = new ethers.Contract(
    "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
    routerAbi,
    signer
  );

  const inToken = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
  const outToken = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI

  const inputAmount = ethers.utils.parseUnits("100", 6);
  const swapPath = [inToken, outToken];
  const swapBack = [outToken, inToken];
  const deadline = Math.floor(Date.now() / 1000) + 60;

  const [_, uniOutRaw] = await uniswap.getAmountsOut(inputAmount, swapPath);
  const [__, sushiOutRaw] = await sushiswap.getAmountsOut(inputAmount, swapPath);

  const uniOut = uniOutRaw;
  const sushiOut = sushiOutRaw;
  const minReceived = 1;

  console.log(`Uniswap: ${ethers.utils.formatUnits(uniOut, 18)} DAI`);
  console.log(`SushiSwap: ${ethers.utils.formatUnits(sushiOut, 18)} DAI`);

  if (uniOut.gt(sushiOut)) {
    console.log("📈 Arbitrage: Buy on Sushi, Sell on Uni");
  } else if (sushiOut.gt(uniOut)) {
    console.log("📈 Arbitrage: Buy on Uni, Sell on Sushi");
  } else {
    console.log("No arbitrage opportunity.");
    return;
  }

  // 🔹 Переводим токены USDC в контракт перед арбитражем
  const usdcAbi = [
  "function transfer(address to, uint amount) external returns (bool)"
  ];
  const usdc = new ethers.Contract(inToken, usdcAbi, signer);
  await usdc.transfer(contractAddress, inputAmount);


  const tx = await arb.executeArbitrage(
    inputAmount,
    uniOut,
    sushiOut,
    minReceived,
    swapPath,
    swapBack,
    inToken,
    outToken,
    deadline
  );

  await tx.wait();
  console.log("✅ Arbitrage executed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
