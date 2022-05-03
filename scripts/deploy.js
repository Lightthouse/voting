const hre = require('hardhat');

const ethers = hre.ethers;
const CONTRACT_NAME = 'Elections';

async function main() {
    const [firstSigner] = await ethers.getSigners();
    const contractFactory = await ethers.getContractFactory(CONTRACT_NAME, firstSigner);
    const contract = await contractFactory.deploy();
    await contract.deployed();
    console.log(contract.address);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(0)
    })