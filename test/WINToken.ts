import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WINToken", function () {
  let winToken: {
      balanceOf: (arg0: HardhatEthersSigner) => any;
      totalSupply: () => any;
    },
    owner: any,
    addr1: { address: any; };

  before(async function () {
    [owner, addr1] = await ethers.getSigners();
  });

  it("should be able to deploy the WINToken contract", async function () {
    // deploy a WINToken contract
    winToken = await ethers.deployContract("WINToken", [owner.address]);

    expect(await winToken.totalSupply()).to.equal(0);
  });

  it("should have the correct name and symbol", async function () {
    expect(await winToken.name()).to.equal("WIN Token");
    expect(await winToken.symbol()).to.equal("WIN");
  });

  it("should allow the owner to mint tokens", async function () {
    const mintAmount = ethers.parseEther("100");
    await winToken.mint(owner.address, mintAmount);
    expect(await winToken.balanceOf(owner.address)).to.equal(mintAmount);
  });

  it("should not allow non-owners to mint tokens", async function () {
    const mintAmount = ethers.parseEther("100");
    await expect(
      winToken.connect(addr1).mint(addr1.address, mintAmount)
    ).to.be.revertedWithCustomError(winToken, "OwnableUnauthorizedAccount")
    .withArgs(addr1.address);
  });
});
