import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("FUDToken", function () {
  let fudToken: {
      balanceOf: (arg0: HardhatEthersSigner) => any;
      totalSupply: () => any;
    },
    owner: any,
    user1: any,
    user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    // deploy a FUDToken contract
    fudToken = await ethers.deployContract("FUDToken", [owner.address]);
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

  it("should be able to transfer tokens between accounts", async function () {
    // Transfer 50 tokens from owner to user1
    await fudToken.transfer(user1.address, 50);
    const user1Balance = await fudToken.balanceOf(user1.address);
    expect(user1Balance).to.equal(50);

    // Transfer 50 tokens from user1 to user2
    // We use .connect(signer) to send a transaction from another account
    await fudToken.connect(user1).transfer(user2.address, 50);
    const user2Balance = await fudToken.balanceOf(user2.address);
    expect(user2Balance).to.equal(50);
  });

  it("should fail if sender doesn’t have enough tokens", async function () {
    const initialOwnerBalance = await fudToken.balanceOf(owner.address);

    // Try to send 1 token from user1 (0 tokens) to owner (1000 tokens).
    // `require` will evaluate false and revert the transaction.
    await expect(fudToken.connect(user1).transfer(owner.address, 1))
      .to.be.revertedWithCustomError(fudToken, "ERC20InsufficientBalance")
      .withArgs(user1.address, 0, 1);

    // Owner balance shouldn't have changed.
    expect(await fudToken.balanceOf(owner.address)).to.equal(
      initialOwnerBalance
    );
  });

  it("should update balances after transfers", async function () {
    const initialOwnerBalance = await fudToken.balanceOf(owner.address);

    // Transfer 100 tokens from owner to user1.
    await fudToken.transfer(user1.address, ethers.parseEther("100"));

    // Transfer another 50 tokens from owner to user2.
    await fudToken.transfer(user2.address, ethers.parseEther("50"));

    // Check balances.
    const finalOwnerBalance = await fudToken.balanceOf(owner.address);
    expect(finalOwnerBalance).to.equal(initialOwnerBalance - ethers.parseEther("150"));

    const user1Balance = await fudToken.balanceOf(user1.address);
    expect(user1Balance).to.equal(ethers.parseEther("100"));

    const user2Balance = await fudToken.balanceOf(user2.address);
    expect(user2Balance).to.equal(ethers.parseEther("50"));
  });
});
