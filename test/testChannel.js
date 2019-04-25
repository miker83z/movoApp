const Movo = artifacts.require('Movo');
const PaymentChannel = artifacts.require('PaymentChannel');

let blockNumber;

contract('PaymentsChannel', async accounts => {
    it("puts 10000 Movo in the first account", async () => {
        const movo = await Movo.deployed();
        let balance = await movo.balanceOf.call(accounts[0]);
        assert.equal(balance.valueOf(), 0);
        assert.equal(await movo.isOwner.call(accounts[0]), true);
        assert.equal(await movo.isMinter.call(accounts[0]), true);

        await movo.mint(accounts[0], 10000);
        balance = await movo.balanceOf.call(accounts[0]);
        assert.equal(balance.valueOf(), 10000, "Amount was not correctly minted");
    });

    it("opens a channel from first account to second", async () => {
        const movo = await Movo.deployed();
        const channel = await PaymentChannel.deployed();

        await movo.approve(PaymentChannel.address, 5000);
        const result = await channel.createChannel(accounts[1], 5000);
        blockNumber = result.receipt.blockNumber;
    });

    it("closes a channel", async () => {
        const channel = await PaymentChannel.deployed();
        const balance = 1300;

        const receiverHash = web3.utils.soliditySha3({
            type: 'address',
            value: accounts[0]
        }, {
            type: 'uint32',
            value: blockNumber
        }, {
            type: 'uint192',
            value: balance
        }, {
            type: 'address',
            value: PaymentChannel.address
        });
        const receiverSign = await web3.eth.sign(receiverHash, accounts[1]);
        //console.log('\n Receiver: ' + accounts[1]);
        //console.log(receiverHash);
        //console.log(receiverSign);

        const senderHash = web3.utils.soliditySha3({
            type: 'address',
            value: accounts[1]
        }, {
            type: 'uint32',
            value: blockNumber
        }, {
            type: 'uint192',
            value: balance
        }, {
            type: 'address',
            value: PaymentChannel.address
        });
        const senderSign = await web3.eth.sign(senderHash, accounts[0]);
        //console.log('\n Sender: ' + accounts[0]);
        //console.log(senderHash);
        //console.log(senderSign);

        //await channel.closeChannel(accounts[1], blockNumber, balance, senderSign, receiverSign);
        await channel.closeChannel(accounts[1], blockNumber, balance, senderSign, receiverSign, {
            from: accounts[1]
        });
    });
});