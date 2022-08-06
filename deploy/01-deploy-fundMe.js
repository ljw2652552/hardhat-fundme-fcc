// function deployFunc(){
// }
// module.exports.default = deployFunc;
// module.exports = async (hre) => {
//     const{getNameAccounts,deployments} = hre;
//     //hre.getNameAccounts
//     //hre.deployments
// }
const { network } = require("hardhat");
const { networkConfig, developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({getNamedAccounts,deployments}) => {
    const{deploy,log} = deployments;
    const{deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;
    
    //if chainid is x use address y
    //const ethUsdContractAddr = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdContractAddr;
    if(developmentChains.includes(network.name)){
    //如果是运行本地区块链网络就不存在这个合约地址,要用00-deploy里部署的mock合约地址
       const mockV3Aggregator = await deployments.get("MockV3Aggregator");
       ethUsdContractAddr = mockV3Aggregator.address;
    }else{
        ethUsdContractAddr = networkConfig[chainId]["ethUsdPriceFeed"];
    }


    //how to do when change chains?解决调用chainlink合约地址硬编码的问题
    //when going for localhost or hardhat network we want to use a mock
    const fundMe = await deploy("FundMe",{
        from: deployer,
        args: [ethUsdContractAddr],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    if(!developmentChains.includes(network.name) && process.env.ES_API_KEY){
        await verify(fundMe.address,[ethUsdContractAddr]);
    }
    log("-------------------------------");
}

module.exports.tags=["all","fundme"];