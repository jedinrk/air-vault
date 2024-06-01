import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FUDTokenModule = buildModule("FUDTokenModule", (m) => {

  const tokenOwner = m.getAccount(0);

  /**Deploying FUDToken */
  const fudToken = m.contract("FUDToken", [tokenOwner]);

  return { fudToken };
});

export default FUDTokenModule;

