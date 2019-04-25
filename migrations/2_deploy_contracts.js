const Movo = artifacts.require("Movo");
const PaymentChannel = artifacts.require("PaymentChannel");

module.exports = function (deployer) {

    return deployer
        .deploy(Movo)
        .then(() => {
            return deployer.deploy(
                PaymentChannel,
                Movo.address
            );
        });
};