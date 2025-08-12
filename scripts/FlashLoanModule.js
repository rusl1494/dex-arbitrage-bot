const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("FlashLoanModule", (m) => {
  const receiver = m.contract("FlashLoanReceiver", [
    "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5", // Aave v3 PoolAddressesProvider (mainnet)
    "0x7BeA39867e4169DBe237d55C8242a8f2fcDcc387", // Aave v3 Pool (mainnet)
  ]);

  return { receiver };
});

