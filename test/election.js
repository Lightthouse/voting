const { expect } = require("chai");
const { ethers } = require("hardhat");

const CONTRACT_NAME = "Elections";
let contract;
let election;
let voting;
const fourDaysOffset = 3600 * 24 * 4;
const candidateNumbers = [1, 2, 3];
const candidateAddresses = ["0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
    "0xdD2FD4581271e230360230F9337D5c0430Bf44C0", "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"];
const electionName = "GD2021";

const deployContract = async () => {
    const signers = await ethers.getSigners();
    const contractFactory = await ethers.getContractFactory(CONTRACT_NAME, signers[0]);
    contract = await contractFactory.deploy();
    await contract.deployed();
    return contract;
}

const electionCreate = async(contract) => {
    election = await contract.createElectionCampaign(electionName, ...candidateAddresses);
    await election.wait();
    return election;
}
const toVote = async(contract) => {
    const signers = await ethers.getSigners();
    voting = await contract.connect(signers[1]).vote(electionName, candidateNumbers[0], {value: ethers.utils.parseEther("0.01")});
    await voting.wait();
    return voting;
}

describe("Contract", () => {

    let signers;
    beforeEach(async function() {
        signers = await ethers.getSigners();
        contract = await deployContract();
    })

    it("Contract exists", async function() {
        await expect(contract.address).to.be.properAddress;
    })

    it("Commission balance is empty", async function () {
        await expect(contract.withdrawCommission()).to.be.revertedWith("Current commission balance is empty");
    })

    it("Commission only by owner", async function () {
        await expect(contract.connect(signers[2]).withdrawCommission()).to.be.revertedWith("Permission denied");
    })


})

describe("Election", () => {
    let election;
    let signers;

    beforeEach(async function() {
        signers = await ethers.getSigners();
        contract = await deployContract();
        election = await electionCreate(contract);
    })

    it("Candidates list", async () => {
        let candidates = await contract.getCandidatesList(electionName);
        expect(candidates).to.have.members(candidateAddresses)
    })

    it("Election initial state", async () => {
        let electionInfo = await contract.getElectionInfo(electionName);

        let tt = await ethers.provider.getBlock(election.blockNumber);
        let electionFinishDay = tt["timestamp"] + 3 * 24 * 3600;
        expect(electionInfo[0]).to.be.equal(electionFinishDay); // finish timestamp
        expect(electionInfo[1]).to.be.eq(0); // votes count
    })

    it("Election name already exists", async () => {
        await expect (contract.createElectionCampaign(electionName, ...candidateAddresses)).to.be.revertedWith("Campaign already exist")
    })

    it("Election can be created only by owner", async () => {
        await expect (contract.connect(signers[1]).createElectionCampaign(electionName, ...candidateAddresses)).to.be.revertedWith("Permission denied")
    })


})

describe("Voting", () => {
    let election;
    let voting;

    beforeEach(async function() {
        const signers = await ethers.getSigners();
        contract = await deployContract();
        election = await electionCreate(contract);
        voting = await toVote(contract);

    })

    it("Vote initial state ", async () => {
        let balance = await ethers.provider.getBalance(contract.address);
        let ethValue = ethers.utils.formatEther(balance).toString();
        expect(ethValue).to.be.eq("0.01");
    })


    it("Elect balance ", async () => {
        let electionBalance = await contract.getElectionBalance(electionName);
        let ethValue = ethers.utils.formatEther(electionBalance).toString();
        expect(ethValue).to.be.eq("0.009");
    })

    it("Commission balance", async () => {
        let commission = await contract.getVoteCommission();
        let ethValue = ethers.utils.formatEther(commission).toString();
        expect(ethValue).to.be.eq("0.001");
    })

    it("Candidate votes number", async () => {
        let votesCount = await contract.getCandidateVotesCount(electionName, candidateNumbers[0]);
        expect(votesCount).to.be.eq(1);
    })

    it("Candidate more votes", async () => {

        const signers = await ethers.getSigners();
        voting = await contract.connect(signers[2]).vote(electionName, candidateNumbers[1], {value: ethers.utils.parseEther("0.01")});
        await voting.wait();

        voting = await contract.connect(signers[3]).vote(electionName, candidateNumbers[1], {value: ethers.utils.parseEther("0.01")});
        await voting.wait();

        let votesCount = await contract.getCandidateVotesCount(electionName, candidateNumbers[1]);
        expect(votesCount).to.be.eq(2);
    })


    it("User has already voted", async () => {
        const signers = await ethers.getSigners();
        await expect(contract.connect(signers[1]).
            vote(electionName, candidateNumbers[0], {value: ethers.utils.parseEther("0.01")})
        ).to.be.revertedWith("User has already voted");
    })

    it("Election campaign doesn't exist", async () => {
        const signers = await ethers.getSigners();
        await expect(contract.connect(signers[1]).
            vote("Wrong election name", candidateNumbers[0], {value: ethers.utils.parseEther("0.01")})
        ).to.be.revertedWith("Campaign doesn't exist");
    })

    it("Vote price must be 0.1eth", async () => {
        const signers = await ethers.getSigners();
        await expect(contract.connect(signers[1]).
            vote(electionName, candidateNumbers[0], {value: ethers.utils.parseEther("0.011")})
        ).to.be.revertedWith("Vote price must be 0.01 ether");
    })

    it("Candidate doesn't exist", async () => {
        const signers = await ethers.getSigners();
        await expect(contract.connect(signers[2]).
            vote(electionName, candidateNumbers[candidateNumbers.length -1] + 1, {value: ethers.utils.parseEther("0.01")})
        ).to.be.revertedWith("Candidate doesn't exist");
    })

})

describe("Finish", () => {
    let election;
    let voting;
    let signers;

    beforeEach(async function() {
        signers = await ethers.getSigners();
        contract = await deployContract();
        election = await electionCreate(contract);
        voting = await toVote(contract);
    })

    it("Finish election", async () => {
        await ethers.provider.send('evm_increaseTime', [fourDaysOffset]);
        await ethers.provider.send('evm_mine', []);

        let electionEnd = await contract.finishElection(electionName);
        await electionEnd.wait();

        await expect(contract.getElectionInfo(electionName)).to.be.revertedWith("Campaign doesn't exist");
    })

    it("Election is not finished", async () => {
        await expect(contract.finishElection(electionName)).to.be.revertedWith("Campaign duration is 3 days");
    })

    it("Third candidate won", async () => {

        voting = await contract.connect(signers[2]).vote(electionName, candidateNumbers[2], {value: ethers.utils.parseEther("0.01")});
        await voting.wait();

        voting = await contract.connect(signers[3]).vote(electionName, candidateNumbers[2], {value: ethers.utils.parseEther("0.01")});
        await voting.wait();

        await ethers.provider.send('evm_increaseTime', [fourDaysOffset]);
        await ethers.provider.send('evm_mine', []);


        let electionEnd = await contract.finishElection(electionName);
        await electionEnd.wait();

        await expect(electionEnd).to.changeEtherBalances([contract, signers[19]],
            [ethers.utils.parseEther("-0.027"), ethers.utils.parseEther("0.027") ])
    })


    it("Second candidate won", async () => {

        voting = await contract.connect(signers[2]).vote(electionName, candidateNumbers[1], {value: ethers.utils.parseEther("0.01")});
        await voting.wait();


        voting = await contract.connect(signers[4]).vote(electionName, candidateNumbers[1], {value: ethers.utils.parseEther("0.01")});
        await voting.wait();

        voting = await contract.connect(signers[5]).vote(electionName, candidateNumbers[2], {value: ethers.utils.parseEther("0.01")});
        await voting.wait();

        await ethers.provider.send('evm_increaseTime', [fourDaysOffset]);
        await ethers.provider.send('evm_mine', []);

        let electionEnd = await contract.finishElection(electionName);
        await electionEnd.wait();

        await expect(electionEnd).to.changeEtherBalances([contract, signers[18]],
            [ethers.utils.parseEther("-0.036"), ethers.utils.parseEther("0.036") ])
    })

    it("First candidate won", async () => {

        await ethers.provider.send('evm_increaseTime', [fourDaysOffset]);
        await ethers.provider.send('evm_mine', []);


        let electionEnd = await contract.finishElection(electionName);
        await electionEnd.wait();


        await expect(electionEnd).to.changeEtherBalances([contract, signers[17]],
            [ethers.utils.parseEther("-0.009"), ethers.utils.parseEther("0.009") ])
    })


    it("Equal votes count", async () => {
        voting = await contract.connect(signers[2]).vote(electionName, candidateNumbers[2], {value: ethers.utils.parseEther("0.01")});
        await voting.wait();

        voting = await contract.connect(signers[3]).vote(electionName, candidateNumbers[1], {value: ethers.utils.parseEther("0.01")});
        await voting.wait();

        await ethers.provider.send('evm_increaseTime', [fourDaysOffset]);
        await ethers.provider.send('evm_mine', []);

        let electionEnd = await contract.finishElection(electionName);
        await electionEnd.wait();

        await expect(electionEnd).to.changeEtherBalances([contract, signers[17]],
            [ethers.utils.parseEther("-0.027"), ethers.utils.parseEther("0.027") ])
    })


    it("Withdraw commission", async () => {
        let wd = await contract.withdrawCommission();
        await wd.wait();
        await expect(wd).to.changeEtherBalances([contract, signers[0]], [ethers.utils.parseEther("-0.001"), ethers.utils.parseEther("0.001") ])
    })
})

describe("Extra", () => {
    let election;
    let signers;
    let voting;

    beforeEach(async function() {
        signers = await ethers.getSigners();
        contract = await deployContract();
        election = await electionCreate(contract);
    })

    it("Voting at overtime", async () => {
        await ethers.provider.send('evm_increaseTime', [fourDaysOffset]);
        await ethers.provider.send('evm_mine', []);

        let vt = contract.connect(signers[2]).vote(electionName, candidateNumbers[2], {value: ethers.utils.parseEther("0.01")});
        await expect(vt).to.revertedWith("Election is over")

    })

    it("Campaign deleted just one time", async () => {
        await ethers.provider.send('evm_increaseTime', [fourDaysOffset]);
        await ethers.provider.send('evm_mine', []);

        let electionEnd = await contract.connect(signers[4]).finishElection(electionName);
        await electionEnd.wait();
        await expect(contract.connect(signers[4]).finishElection(electionName)).to.be.revertedWith("Campaign doesn't exist");
    })



})