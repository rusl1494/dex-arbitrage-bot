const { ethers, network } = require("hardhat");

async function main() {
  const USDC_HOLDER = "0x55fe002aeff02f77364de339a1292923a15844b8"; // Whale
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const [receiver] = await ethers.getSigners();
  const amount = ethers.utils.parseUnits("1000", 6);

  console.log(`Impersonating USDC whale: ${USDC_HOLDER}`);
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [USDC_HOLDER],
  });

  const whaleSigner = await ethers.getSigner(USDC_HOLDER);
  const usdcAbi = [
  "function transfer(address to, uint amount) external returns (bool)"
  ];
  const usdc = new ethers.Contract(USDC, usdcAbi, whaleSigner);


  const tx = await usdc.transfer(receiver.address, amount);
  await tx.wait();

  console.log(`✅ Transferred 1000 USDC to ${receiver.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
