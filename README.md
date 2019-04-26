# Movo prototype

An android app prototype that allows to share vehicle data using IOTA

---

## Usage

Only on real android device (because of Bluetooth connection).

Requires **[Truffle](https://truffleframework.com/docs/truffle/overview)**, **[Ganache](https://truffleframework.com/docs/ganache/overview)** and **[High Mobility emulator](https://high-mobility.com/)**.

```
npm install
react-native link react-native-randombytes
truffle compile && truffle migrate
// Need to copy manually contracts addresses and accounts private keys (Drizzle)
adb reverse tcp:7545 tcp:7545 //Run Ganache on this port
react-native run-android
```
