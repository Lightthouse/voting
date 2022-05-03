//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.0;

import "hardhat/console.sol";


contract Elections {

    /**
     * Election campaign unit
     * Has election finish timestamp, total votes, candidates list, votes for every candidate
     */
    struct ElectionCampaign {
        uint finishDate;
        uint votesTotal;

        // number (from 1, to 3) => candidate address
        mapping(uint => address) candidates;

        // number (from 1, to 3) => candidate votes count
        mapping(uint => uint) candidateVotes;

        // voter address => exist
        mapping(address => bool) voters;
    }

    // campaignName => ElectionCampaign
    mapping(string => ElectionCampaign) private electionCampaign;
    // commission from all elections
    uint private voteCommission;
    // owner
    address private owner;

    // voting cost 0.01 eth
    // voting commission 0.001 eth

    modifier onlyOwner() {
        require(msg.sender == owner, "Permission denied");
        _;
    }
    modifier campaignRequire(string memory _name) {
        require(electionCampaign[_name].finishDate > 0, "Campaign doesn't exist");
        _;
    }

    modifier campaignUniq(string memory _name) {
        require(electionCampaign[_name].finishDate == 0, "Campaign already exist");
        _;
    }
    modifier campaignExpired(string memory _name) {
        require(electionCampaign[_name].finishDate < block.timestamp, "Campaign duration is 3 days");
        _;
    }
    /**
     * Check if sender can vote.
     *
     * Check if candidate exist.
     * Check if campaign name exist.
     * Check if sender hasn't already voted.
     * Check if sender has send enough money.
     * Check if election is not expired.
     */
    modifier votingAllow(string memory _campaignName, uint _candidateNumber) {
        require(electionCampaign[_campaignName].finishDate > 0, "Campaign doesn't exist");
        require(msg.value == 0.01 ether, "Vote price must be 0.01 ether");
        require(electionCampaign[_campaignName].voters[msg.sender] == false, "User has already voted");
        require(electionCampaign[_campaignName].finishDate > block.timestamp, "Election is over");
        require(electionCampaign[_campaignName].candidates[_candidateNumber] != address(0), "Candidate doesn't exist");
        _;
    }

    constructor() {
        owner = msg.sender;
    }
    /**
     * Candidates' addresses.
     * @dev always 3
     */
    function getCandidatesList(string memory _name) campaignRequire(_name) external view returns(address, address, address) {
        return (electionCampaign[_name].candidates[1], electionCampaign[_name].candidates[2], electionCampaign[_name].candidates[3]);
    }
    /**
     * Candidate votes count.
     */
    function getCandidateVotesCount(string memory _campaignName, uint _candidateNumber) external view campaignRequire(_campaignName) returns(uint) {
        return electionCampaign[_campaignName].candidateVotes[_candidateNumber];
    }
    /**
     * Contract commission balance.
     */
    function getVoteCommission() external view returns(uint) {
        return voteCommission;
    }
    /**
     * Election campaign finish timestamp and votes count.
     */
    function getElectionInfo(string memory _name) external view campaignRequire(_name) returns(uint, uint) {
        return (electionCampaign[_name].finishDate, electionCampaign[_name].votesTotal);
    }
    /**
     * Election campaign balance.
     */
    function getElectionBalance(string memory _name) external view campaignRequire(_name) returns(uint) {
        return electionCampaign[_name].votesTotal * 0.009 ether;
    }
    /**
     * Create new election campaign.
     * @dev only 3 candidates allowed.
     */
    function createElectionCampaign(
        string memory _name,
        address _candidate_1,
        address _candidate_2,
        address _candidate_3) external onlyOwner campaignUniq(_name)
    {

        electionCampaign[_name].finishDate = block.timestamp + 3 days;
        electionCampaign[_name].candidates[1] = _candidate_1;
        electionCampaign[_name].candidates[2] = _candidate_2;
        electionCampaign[_name].candidates[3] = _candidate_3;

    }
    /**
     * Vote to candidate at election campaign.
     */
    function vote(string memory _campaignName, uint _candidateNumber) external votingAllow(_campaignName, _candidateNumber) payable {
        electionCampaign[_campaignName].voters[msg.sender] = true;
        voteCommission += 0.001 ether;
        electionCampaign[_campaignName].votesTotal += 1;
        electionCampaign[_campaignName].candidateVotes[_candidateNumber] += 1;
    }

    /**
      * Finnish election campaign and send money to the winner.
      * @dev There is no draw. Only one candidate can get money.
     */
    function finishElection(string memory _name) external campaignRequire(_name) campaignExpired(_name){

        if(electionCampaign[_name].votesTotal > 0) {
            address payable _winner;
            uint _maxCount;

            _winner = payable(electionCampaign[_name].candidates[1]);
            _maxCount = electionCampaign[_name].candidateVotes[1];

            if(electionCampaign[_name].candidateVotes[2] > _maxCount) {
                _winner = payable(electionCampaign[_name].candidates[2]);
                _maxCount = electionCampaign[_name].candidateVotes[2];
            }

            if(electionCampaign[_name].candidateVotes[3] > _maxCount) {
                _winner = payable(electionCampaign[_name].candidates[3]);
            }

            _winner.transfer(electionCampaign[_name].votesTotal * 0.009 ether);

        }
        delete electionCampaign[_name];

    }
    /**
     * Send commission money to owner.
     */
    function withdrawCommission() external onlyOwner {
        require(voteCommission > 0, "Current commission balance is empty");
        address payable _to = payable(owner);
        _to.transfer(voteCommission);
        voteCommission = 0;
    }

}
