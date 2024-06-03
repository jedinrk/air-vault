import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { vars } from "hardhat/config";


const AirVaultModule = buildModule("AirVaultModule", (m) => {
  const tokenOwner = m.getAccount(0);

  const fudTokenAddress = vars.get("FUD_TOKEN_ADDRESS");
  const winTokenAddress = vars.get("WIN_TOKEN_ADDRESS");
  const blockInterval = 50;

  /**Deploying AirVault contract */
  const airVault = m.contract("AirVault", [
    fudTokenAddress,
    winTokenAddress,
    blockInterval,
    tokenOwner,
  ]);

  return { airVault };
});

export default AirVaultModule;
