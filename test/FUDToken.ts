import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("FUDToken", function () {
  let fudToken: {
      balanceOf: (arg0: HardhatEthersSigner) => any;
      totalSupply: () => any;
    },
    owner: any,
    user1: any;

  before(async function () {
    [owner, user1] = await ethers.getSigners();
  });

  it("should be able to deploy the FUDToken contract", async function () {
    // deploy a FUDToken contract
    fudToken = await ethers.deployContract("FUDToken", [owner.address]);

    expect(await fudToken.balanceOf(owner)).to.equal(
      await fudToken.totalSupply()
    );
  });

  it("should have the correct name and symbol", async function () {
    expect(await fudToken.name()).to.equal("FUD Token");
    expect(await fudToken.symbol()).to.equal("FUD");
  });

  it("should have the correct total supply", async function () {
    const totalSupply = await fudToken.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("1500000"));
  });

  it("should assign the total supply to the owner", async function () {
    const ownerBalance = await fudToken.balanceOf(owner.address);
    expect(await fudToken.totalSupply()).to.equal(ownerBalance);
  });

  it("should be able to transfer FUD tokens to another user", async function () {
    const userBalanceInitialy = await fudToken.balanceOf(user1.address);

    expect(userBalanceInitialy).to.equal(0);
    await fudToken.transfer(user1.address, ethers.parseEther("1000"));

    const userBalanceNow = await fudToken.balanceOf(user1.address);
    expect(userBalanceNow).to.equal(ethers.parseEther("1000"));
  });
});
