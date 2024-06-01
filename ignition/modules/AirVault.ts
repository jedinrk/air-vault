import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AirVaultModule = buildModule("AirVaultModule", (m) => {
  const tokenOwner = m.getAccount(0);

  const fudTokenAddress = "";
  const winTokenAddress = "";
  const windowSize = 10;

  /**Deploying FUDToken */
  const airVault = m.contract("AirVault", [
    fudTokenAddress,
    winTokenAddress,
    windowSize,
    tokenOwner,
  ]);

  return { airVault };
});

export default AirVaultModule;
