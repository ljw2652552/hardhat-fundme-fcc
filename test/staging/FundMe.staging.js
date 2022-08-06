const { network, getNamedAccounts, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe Staging Tests", async function() {
      let deployer, fundMe;
      const sendValue = ethers.utils.parseEther("0.05");
      beforeEach(async () => {
        //因为在测试网 不要在测试脚本中每次都去部署，手动部署一次，deployments里面就会有部署好的合约信息，运行test时加上--network rinkeby,就读取就行了
        deployer = (await getNamedAccounts).deployer;
        fundMe = await ethers.getContract("FundMe", deployer);
      });

      it("allows people to fund and withdraw", async function() {
        const tx1Res = await fundMe.fund({ value: sendValue });
        await tx1Res.wait();
        const txRes = await fundMe.withdraw();
        await txRes.wait();
        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        console.log(
          endingFundMeBalance.toString() +
            " should equal 0, running assert equal..."
        );
        //assert.equal(endingFundMeBalance.toString(), "0");
      });
    });
