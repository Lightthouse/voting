const {task} = require("hardhat/config");

async function initContract(ethers) {
    const [firstSigner] = await ethers.getSigners();
    const contractFactory = await ethers.getContractFactory("Elections", firstSigner);
    const contract = await contractFactory.attach(process.env.CONTRACT_ADDRESS);
    return contract
}

task("candidates", "Print list of candidates")
    .addParam("campaign", "campaign name")
    .setAction(async (taskArgs, hre) => {
        const contract = await initContract(hre.ethers);
        const candidates = await contract.getCandidatesList(taskArgs.campaign);
        console.log(candidates)
    });


task("election-create", "Create new election campaign")
    .addParam("campaign", "campaign name")
    .addParam("candidate1", "candidate address")
    .addParam("candidate2", "candidate address")
    .addParam("candidate3", "candidate address")
    .setAction(async (taskArgs, hre) => {
        const contract = await initContract(hre.ethers);
        const election = await contract.createElectionCampaign(
            taskArgs.campaign, taskArgs.candidate1, taskArgs.candidate2, taskArgs.candidate3);

    });

task("election-balance", "Print election balance")
    .addParam("campaign", "campaign name")
    .setAction(async (taskArgs, hre) => {
        const contract = await initContract(hre.ethers);
        const electionInfo = await contract.getElectionBalance(taskArgs.campaign);
        console.log(electionInfo)
    });

task("election-candidate-info", "Print candidate votes count")
    .addParam("campaign", "campaign name")
    .addParam("candidate", "candidate number at campaign")
    .setAction(async (taskArgs, hre) => {
        const contract = await initContract(hre.ethers);
        const candidateInfo = await contract.getCandidateVotesCount(taskArgs.campaign, taskArgs.candidate)
        console.log(candidateInfo)
    });


task("election-info", "Print votes count and finish date")
    .addParam("campaign", "campaign name")
    .setAction(async (taskArgs, hre) => {
        const contract = await initContract(hre.ethers);
        const electionInfo = await contract.getElectionInfo(taskArgs.campaign);
        console.log(electionInfo)
    });

task("election-finish", "Finish the election campaign")
    .addParam("campaign")
    .setAction(async (taskArgs, hre) => {
        const contract = await initContract(hre.ethers);
        const election = await contract.finishElection(taskArgs.campaign);
    });

task("vote", "Vote in election")
    .addParam("campaign", "campaign name")
    .addParam("candidate", "candidate number at campaign")
    .addOptionalParam("account", "transaction account address")
    .setAction(async (taskArgs, hre) => {
        const contract = await initContract(hre.ethers);

        if (taskArgs.account) {
            const signer = contract.provider.getSigner(taskArgs.account)
            const voting = await contract.connect(signer).vote(taskArgs.campaign,
                taskArgs.candidate, {value: ethers.utils.parseEther("0.1")});
        } else {
            const voting = await contract.vote(taskArgs.campaign,
                taskArgs.candidate, {value: ethers.utils.parseEther("0.1")});
        }
    });

task("withdraw-balance", "Vote commission balance")
    .addOptionalParam("account", "transaction account address")
    .setAction(async (taskArgs, hre) => {
        const contract = await initContract(hre.ethers);
        const commissionBalance = await contract.getVoteCommission();
        console.log(commissionBalance)
    });


task("withdraw", "Withdraw vote commission to owner")
    .addOptionalParam("account", "transaction account address")
    .setAction(async (taskArgs, hre) => {
        const contract = await initContract(hre.ethers);
        if (taskArgs.account) {
            const signer = contract.provider.getSigner(taskArgs.account)
            const withdrdaw = await contract.connect(signer).withdrawCommission();
        } else {
            const withdrdaw = await contract.withdrawCommission();
        }
    });

