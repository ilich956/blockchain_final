const Election = artifacts.require("Election");

contract("Election", (accounts) => {
  const admin = accounts[0];
  const voter = accounts[1];
  const nonAdmin = accounts[2];

  let electionInstance;

  beforeEach(async () => {
    electionInstance = await Election.new({ from: admin });
  });

  it("should initialize with the correct admin", async () => {
    const adminAddress = await electionInstance.getAdmin();
    assert.equal(adminAddress, admin, "Admin is not correctly set");
  });

  it("should allow admin to add a candidate", async () => {
    await electionInstance.addCandidate("John Doe", "Equality for all", {
      from: admin,
    });
    const candidate = await electionInstance.candidateDetails(0);
    assert.equal(candidate.header, "John Doe", "Candidate header is incorrect");
    assert.equal(
      candidate.slogan,
      "Equality for all",
      "Candidate slogan is incorrect"
    );
    assert.equal(
      candidate.voteCount.toNumber(),
      0,
      "Candidate vote count should be 0"
    );
  });

  it("should not allow non-admin to add a candidate", async () => {
    try {
      await electionInstance.addCandidate("John Doe", "Equality for all", {
        from: nonAdmin,
      });
      assert.fail("Non-admin should not be able to add a candidate");
    } catch (error) {
      assert(
        error.message.indexOf("revert") >= 0,
        "Expected revert, got '" + error.message + "' instead"
      );
    }
  });

  it("should allow admin to set election details", async () => {
    await electionInstance.setElectionDetails(
      "Admin",
      "admin@example.com",
      "Chair",
      "2024 Election",
      "Example Org",
      { from: admin }
    );
    const details = await electionInstance.getElectionDetails();
    assert.equal(details.adminName, "Admin", "Admin name is incorrect");
    assert.equal(
      details.adminEmail,
      "admin@example.com",
      "Admin email is incorrect"
    );
    assert.equal(details.adminTitle, "Chair", "Admin title is incorrect");
    assert.equal(
      details.electionTitle,
      "2024 Election",
      "Election title is incorrect"
    );
    assert.equal(
      details.organizationTitle,
      "Example Org",
      "Organization title is incorrect"
    );
  });

  it("should allow voters to register", async () => {
    await electionInstance.registerAsVoter("Voter Name", "1234567890", {
      from: voter,
    });
    const voterDetails = await electionInstance.voterDetails(voter);
    assert.equal(voterDetails.name, "Voter Name", "Voter name is incorrect");
    assert.equal(voterDetails.phone, "1234567890", "Voter phone is incorrect");
    assert.equal(
      voterDetails.isRegistered,
      true,
      "Voter registration status is incorrect"
    );
  });

  it("should allow admin to verify a voter", async () => {
    await electionInstance.registerAsVoter("Voter Name", "1234567890", {
      from: voter,
    });
    await electionInstance.verifyVoter(true, voter, { from: admin });
    const voterDetails = await electionInstance.voterDetails(voter);
    assert.equal(
      voterDetails.isVerified,
      true,
      "Voter verification status is incorrect"
    );
  });

  it("should not allow non-admin to verify a voter", async () => {
    await electionInstance.registerAsVoter("Voter Name", "1234567890", {
      from: voter,
    });
    try {
      await electionInstance.verifyVoter(true, voter, { from: nonAdmin });
      assert.fail("Non-admin should not be able to verify a voter");
    } catch (error) {
      assert(
        error.message.indexOf("revert") >= 0,
        "Expected revert, got '" + error.message + "' instead"
      );
    }
  });

  it("should allow verified voters to vote", async () => {
    await electionInstance.addCandidate("John Doe", "Equality for all", {
      from: admin,
    });
    await electionInstance.registerAsVoter("Voter Name", "1234567890", {
      from: voter,
    });
    await electionInstance.verifyVoter(true, voter, { from: admin });
    await electionInstance.setElectionDetails(
      "Admin",
      "admin@example.com",
      "Chair",
      "2024 Election",
      "Example Org",
      { from: admin }
    );
    await electionInstance.vote(0, { from: voter });
    const candidate = await electionInstance.candidateDetails(0);
    assert.equal(
      candidate.voteCount.toNumber(),
      1,
      "Candidate vote count should be 1"
    );
    const voterDetails = await electionInstance.voterDetails(voter);
    assert.equal(
      voterDetails.hasVoted,
      true,
      "Voter vote status should be true"
    );
  });

  it("should not allow unverified voters to vote", async () => {
    await electionInstance.addCandidate("John Doe", "Equality for all", {
      from: admin,
    });
    await electionInstance.registerAsVoter("Voter Name", "1234567890", {
      from: voter,
    });
    try {
      await electionInstance.vote(0, { from: voter });
      assert.fail("Unverified voter should not be able to vote");
    } catch (error) {
      assert(
        error.message.indexOf("revert") >= 0,
        "Expected revert, got '" + error.message + "' instead"
      );
    }
  });

  it("should allow admin to end the election", async () => {
    await electionInstance.setElectionDetails(
      "Admin",
      "admin@example.com",
      "Chair",
      "2024 Election",
      "Example Org",
      { from: admin }
    );
    await electionInstance.endElection({ from: admin });
    const endStatus = await electionInstance.getEnd();
    assert.equal(endStatus, true, "Election end status should be true");
  });

  it("should not allow non-admin to end the election", async () => {
    try {
      await electionInstance.endElection({ from: nonAdmin });
      assert.fail("Non-admin should not be able to end the election");
    } catch (error) {
      assert(
        error.message.indexOf("revert") >= 0,
        "Expected revert, got '" + error.message + "' instead"
      );
    }
  });
});
