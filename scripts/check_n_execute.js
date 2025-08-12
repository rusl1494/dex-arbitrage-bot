const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");

async function main() {
  const [signer] = await ethers.getSigners();
  const deployment = JSON.parse(fs.readFileSync("deployment.json"));
  const contractAddress = deployment.contractAddress;

  const routerAbi = [
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory)"
  ];

  const tokenIn = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
  const tokenOut = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI
  const path = [tokenIn, tokenOut];
  const reverse = [tokenOut, tokenIn];
  const amountIn = ethers.utils.parseUnits("100", 6);

  const uniswap = new ethers.Contract("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", routerAbi, signer);
  const sushiswap = new ethers.Contract("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", routerAbi, signer);

  const uniOut = await uniswap.getAmountsOut(amountIn, path);
  const sushiOut = await sushiswap.getAmountsOut(amountIn, path);

  const amountOutUni = uniOut[1];
  const amountOutSushi = sushiOut[1];

  console.log("Uniswap:", ethers.utils.formatUnits(amountOutUni, 18), "DAI");
  console.log("SushiSwap:", ethers.utils.formatUnits(amountOutSushi, 18), "DAI");

  const minProfit = ethers.utils.parseUnits("0.3", 18); // Учитываем комиссии обеих DEX
  let execute = null;
  let amountOutExpected;

  if (amountOutUni.gt(amountOutSushi.add(minProfit))) {
    execute = ["sushi", "uniswap"];
    amountOutExpected = amountOutUni;
  } else if (amountOutSushi.gt(amountOutUni.add(minProfit))) {
    execute = ["uniswap", "sushi"];
    amountOutExpected = amountOutSushi;
  } else {
    console.log("❌ No profitable arbitrage");
    return;
  }

  console.log(`📈 Arbitrage: Buy on ${execute[0]}, Sell on ${execute[1]}`);
  console.log("💰 Expected profit (DAI):", ethers.utils.formatUnits(amountOutExpected.sub(amountOutUni.lt(amountOutSushi) ? amountOutUni : amountOutSushi), 18));

  // 📉 Проскальзывание 
  const slippage = 1;

  let minBuyOut, minSellOut;

  if (execute[0] === "sushi") {
    minBuyOut = amountOutSushi.sub(amountOutSushi.mul(slippage * 1000).div(1000));
    minSellOut = amountOutUni.sub(amountOutUni.mul(slippage * 1000).div(1000));
  } else {
    minBuyOut = amountOutUni.sub(amountOutUni.mul(slippage * 1000).div(1000));
    minSellOut = amountOutSushi.sub(amountOutSushi.mul(slippage * 1000).div(1000));
  }

  console.log("🔒 minBuyOut:", ethers.utils.formatUnits(minBuyOut, 18), "DAI");
  console.log("🔒 minSellOut:", ethers.utils.formatUnits(minSellOut, 18), "DAI");

  const ArbitrageBot = await ethers.getContractFactory("ArbitrageBot");
  const bot = ArbitrageBot.attach(contractAddress);

  const deadline = Math.floor(Date.now() / 1000) + 60;

  const tx = await bot.executeArbitrage(
    amountIn,
    amountOutUni,
    amountOutSushi,
    minBuyOut,
    minSellOut,
    path,
    reverse,
    tokenIn,
    tokenOut,
    deadline
  );

  await tx.wait();
  console.log("✅ Arbitrage executed");
}

main().catch((error) => {
  console.error("💥 Script failed:", error.message || error);
  process.exitCode = 1;
});
