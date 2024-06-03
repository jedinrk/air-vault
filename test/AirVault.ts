import { expect } from "chai";
import { ethers, network } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("AirVault", function () {
  let fudToken: any, winToken: any, airVault: any;
  let owner, user1: any, user2: any;
  const blockInterval = 100;

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy FUDToken
    fudToken = await ethers.deployContract("FUDToken", [owner.address]);

    await fudToken.waitForDeployment();

    // Deploy WINToken
    winToken = await ethers.deployContract("WINToken", [owner.address]);

    await winToken.waitForDeployment();

    // Deploy AirVault
    airVault = await ethers.deployContract("AirVault", [
      fudToken.getAddress(),
      winToken.getAddress(),
      blockInterval,
      owner.address,
    ]);

    await airVault.waitForDeployment();

    // Distribute some FUD tokens to user1 and user2
    await fudToken.transfer(user1.address, ethers.parseEther("1000"));
    await fudToken.transfer(user2.address, ethers.parseEther("1000"));
  });

  it("should accept deposits of FUD tokens", async function () {
    const depositAmount = ethers.parseEther("100");
    await fudToken.connect(user1).approve(airVault.getAddress(), depositAmount);
    await airVault.connect(user1).deposit(depositAmount);

    expect(await fudToken.balanceOf(airVault.getAddress())).to.equal(
      depositAmount
    );
    expect(await airVault.lockedBalanceOf(user1.address)).to.equal(
      depositAmount
    );
  });

  it("should emit Deposited event on deposit", async function () {
    const userLockedBalance = await airVault.lockedBalanceOf(user1.address);
    const depositAmount = ethers.parseEther("100");
    await fudToken.connect(user1).approve(airVault.getAddress(), depositAmount);

    const blockNumber = await time.latestBlock();

    await expect(airVault.connect(user1).deposit(depositAmount))
      .to.emit(airVault, "Deposited")
      .withArgs(
        user1.address,
        depositAmount,
        depositAmount + userLockedBalance,
        blockNumber + 1
      );
  });

  it("should allow withdrawals of FUD tokens", async function () {
    const vaultInitBalance = await fudToken.balanceOf(airVault.getAddress());
    const depositAmount = ethers.parseEther("100");
    const withdrawAmount = ethers.parseEther("50");

    await fudToken.connect(user2).approve(airVault.getAddress(), depositAmount);
    await airVault.connect(user2).deposit(depositAmount);

    const vaultBalanceAfterDeposit = await fudToken.balanceOf(
      airVault.getAddress()
    );

    expect(vaultBalanceAfterDeposit).to.equal(vaultInitBalance + depositAmount);

    await airVault.connect(user2).withdraw(withdrawAmount);

    expect(await fudToken.balanceOf(airVault.getAddress())).to.equal(
      vaultBalanceAfterDeposit - withdrawAmount
    );
    expect(await airVault.lockedBalanceOf(user2.address)).to.equal(
      depositAmount - withdrawAmount
    );
  });

  it("should emit Withdrawn event on withdrawal", async function () {
    const depositAmount = ethers.parseEther("100");
    const withdrawAmount = ethers.parseEther("50");

    await fudToken.connect(user1).approve(airVault.getAddress(), depositAmount);
    await airVault.connect(user1).deposit(depositAmount);

    const userBalanceAfterDeposit = await airVault.lockedBalanceOf(
      user1.address
    );

    const blockNumber = await time.latestBlock();

    await expect(airVault.connect(user1).withdraw(withdrawAmount))
      .to.emit(airVault, "Withdrawn")
      .withArgs(
        user1.address,
        withdrawAmount,
        userBalanceAfterDeposit - withdrawAmount,
        blockNumber + 1
      );
  });

  it("should not allow withdrawals exceeding the deposited amount", async function () {
    const depositedAmount = await airVault.lockedBalanceOf(user1.address);
    const withdrawAmount = depositedAmount + ethers.parseEther("150");

    await expect(
      airVault.connect(user1).withdraw(withdrawAmount)
    ).to.be.revertedWith("Insufficient balance for the user");
  });

  it("should be able to update the block interval for airdrop", async function () {
    const currentBlockInterval = await airVault.blockInterval();

    expect(currentBlockInterval).to.equal(100);

    await airVault.updateBlockInterval(500);

    expect(await airVault.blockInterval()).to.equal(500);
  });

  it("should not be able to update the block interval for airdrop other than owner", async function () {
    const currentBlockInterval = await airVault.blockInterval();

    expect(currentBlockInterval).to.equal(500);

    await expect(airVault.connect(user1).updateBlockInterval(100))
      .to.be.revertedWithCustomError(airVault, "OwnableUnauthorizedAccount")
      .withArgs(user1.address);
  });
});
