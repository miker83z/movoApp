# Movo prototype

An android app prototype that allows to share vehicle data using IOTA

---

## Usage

Only on real android device (because of Bluetooth connection).

Requires **[Truffle](https://truffleframework.com/docs/truffle/overview)**, **[Ganache](https://truffleframework.com/docs/ganache/overview)** and **[High Mobility emulator](https://high-mobility.com/)**.

```
npm install
react-native link nodejs-mobile-react-native
cd nodejs-assets/nodejs-project/
npm install
cd ../..
// requires to open project's android folder in Android Studio, in order to detect, download and cofigure requirements that might be missing
export ANDROID_NDK_HOME=[*path to* Android/sdk/ndk-bundle]
truffle compile
// open Ganache to 127.0.0.1:7545
truffle migrate
// Need to copy manually contracts address in nodejs-assets/nodejs-project/main.js
adb reverse tcp:7545 tcp:7545
react-native run-android
```
