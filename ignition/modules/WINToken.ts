import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WINTokenModule = buildModule("WINTokenModule", (m) => {

  const tokenOwner = m.getAccount(0);

  /**Deploying FUDToken */
  const win = m.contract("WINToken", [tokenOwner]);

  return { win };
});

export default WINTokenModule;

