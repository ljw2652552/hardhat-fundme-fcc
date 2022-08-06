const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function() {
      let fundMe, deployer, mockV3Aggregator;
      //const sendValue = 1000000000000000000;//1 eth
      const sendValue = ethers.utils.parseEther("1");
      beforeEach(async () => {
        //deploy our fundMe contract
        //using Hardhat-deploy
        //拿到部署者
        deployer = (await getNamedAccounts()).deployer;
        //还可以这样拿到配置文件中的accounts 如果是hardhat网络 就是那十个账户？
        //const accounts = await ethers.getSigners();
        //const accountZero = accounts[0];
        //console.log(`Accounts: ${accounts}---- AccountZero: ${accountZero}`);
        //fixture函数可以通过tags调用自己写好的deploy脚本进行部署
        await deployments.fixture(["all"]);
        //绑定signer，就是之后每次调用fundMe的调用者都是deployer
        fundMe = await ethers.getContract("FundMe", deployer);
        //
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", async function() {
        it("sets the aggregator address correctly", async function() {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("fund", async function() {
        it("Fails if you don't send enough ETH!", async function() {
          //await fundMe.fund();
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });
        it("updated the amount funded data structure", async function() {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });
        it("Adds funder to array if getFunder", async function() {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunder(0);
          assert.equal(funder, deployer);
        });
      });
      describe("withdraw", async function() {
        //取钱前要先存钱
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });
        it("withdraws ETH from a single funder", async () => {
          //获取取钱前的双方余额,fundMe.provide就是获取当前区块链网络
          const startingFundMeBala = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBala = await fundMe.provider.getBalance(
            deployer
          );
          //执行取钱
          //这里deployer调用取钱的交易要消耗gas，
          //withdraw函数里虽然合约账户给调用者转钱了，但是这笔交易是调用者发起的，所以是调用者支付gas，合约账户不用支付gas
          const txRes = await fundMe.withdraw();
          const txReceipt = await txRes.wait(1);
          const { effectiveGasPrice, gasUsed } = txReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          //获取取钱后的双方余额
          const endingFundMeBala = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBala = await fundMe.provider.getBalance(deployer);
          //比较验证
          assert.equal(endingFundMeBala, 0);
          //这种没有考虑汽油费
          assert.equal(
            startingDeployerBala.add(startingFundMeBala).toString(),
            endingDeployerBala.add(gasCost).toString()
          );
        });
        it("is allows us to withdraw with multiple getFunder", async () => {
          //还可以这样拿到配置文件中的accounts 如果是hardhat网络 就是那十个账户？
          const accounts = await ethers.getSigners();
          console.log(`accounts.length: ${accounts.length}`);
          for (i = 1; i < accounts.length; i++) {
            const connectontract = await fundMe.connect(accounts[i]);
            await connectontract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const withdrawGasCost = gasUsed.mul(effectiveGasPrice);
          console.log(`GasCost: ${withdrawGasCost}`);
          console.log(`GasUsed: ${gasUsed}`);
          console.log(`GasPrice: ${effectiveGasPrice}`);
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Assert
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(withdrawGasCost).toString()
          );
          // Make a getter for storage variables
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
        it("cheaper withdraw with multiple getFunder", async () => {
          //还可以这样拿到配置文件中的accounts 如果是hardhat网络 就是那十个账户？
          const accounts = await ethers.getSigners();
          console.log(`accounts.length: ${accounts.length}`);
          for (i = 1; i < accounts.length; i++) {
            const connectontract = await fundMe.connect(accounts[i]);
            await connectontract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const withdrawGasCost = gasUsed.mul(effectiveGasPrice);
          console.log(`GasCost: ${withdrawGasCost}`);
          console.log(`GasUsed: ${gasUsed}`);
          console.log(`GasPrice: ${effectiveGasPrice}`);
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Assert
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(withdrawGasCost).toString()
          );
          // Make a getter for storage variables
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
        it("Only allows the owner to withdraw", async function() {
          const accounts = await ethers.getSigners();
          const fundMeConnectedContract = await fundMe.connect(accounts[1]);
          await expect(fundMeConnectedContract.withdraw()).to.be.reverted;
          // await expect(fundMeConnectedContract.withdraw()).to.be.revertedWith(
          //   "FundMe__NotOwner"
          // );
        });
      });
    });
