require("@nomiclabs/hardhat-waffle");
require('solidity-coverage');
require('dotenv').config();
require('./tasks/elections');


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts: [process.env.RINKEBY_KEY]
    },
    hardhat: {
      chainId: 1337
    }
  }
};
