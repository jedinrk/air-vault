import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AirVaultModule = buildModule("AirVaultModule", (m) => {
  const tokenOwner = m.getAccount(0);

  const fudTokenAddress = "0xD3b7E82d32D842958E3F01fD9490b57e66bA068F";
  const winTokenAddress = "0x443161F34026eC906D33D8575a4D69E3332C9181";
  const blockInterval = 100;

  /**Deploying FUDToken */
  const airVault = m.contract("AirVault", [
    fudTokenAddress,
    winTokenAddress,
    blockInterval,
    tokenOwner,
  ]);

  return { airVault };
});

export default AirVaultModule;
