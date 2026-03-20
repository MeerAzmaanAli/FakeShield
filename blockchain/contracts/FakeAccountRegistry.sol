pragma solidity ^0.8.28;

contract FakeAccountRegistry {

    struct FakeAccountReport {
        uint256 reportId;
        string profileURL;
        string platform;
        string verdict;
        address officerWallet;
        uint256 timestamp;
    }

    uint256 public reportCount;
    mapping(uint256 => FakeAccountReport) public reports;

    event ReportLogged(
        uint256 indexed reportId,
        string profileURL,
        string platform,
        string verdict,
        address indexed officerWallet,
        uint256 timestamp
    );

    function logReport(
        string memory profileURL,
        string memory platform,
        string memory verdict
    ) public returns (uint256) {

        reportCount++;

        reports[reportCount] = FakeAccountReport({
            reportId:      reportCount,
            profileURL:    profileURL,
            platform:      platform,
            verdict:       verdict,
            officerWallet: msg.sender,
            timestamp:     block.timestamp
        });

        emit ReportLogged(
            reportCount,
            profileURL,
            platform,
            verdict,
            msg.sender,
            block.timestamp
        );

        return reportCount;
    }

    function getReport(uint256 reportId) public view returns (FakeAccountReport memory) {
        require(reportId > 0 && reportId <= reportCount, "Report does not exist");
        return reports[reportId];
    }

    function getAllReports() public view returns (FakeAccountReport[] memory) {
        FakeAccountReport[] memory allReports = new FakeAccountReport[](reportCount);
        for (uint256 i = 1; i <= reportCount; i++) {
            allReports[i - 1] = reports[i];
        }
        return allReports;
    }
}