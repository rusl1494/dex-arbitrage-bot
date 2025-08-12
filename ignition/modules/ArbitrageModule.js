const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ArbitrageModule", (m) => {
  const arbitrageBot = m.contract("ArbitrageBot", [
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
    "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"  // SushiSwap Router
  ]);

  return { arbitrageBot };
});
