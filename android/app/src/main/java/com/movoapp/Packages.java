package com.movoapp;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.movoapp.affectiva.AffectivaModule;
import com.movoapp.bluetooth.BluetoothModule;
import com.movoapp.wifi.WiFiP2PManagerModule;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Packages implements ReactPackage {

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(
            ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();

        modules.add(new EventEmitterModule(reactContext));
        modules.add(new BluetoothModule(reactContext));
        modules.add(new AffectivaModule(reactContext));
        modules.add(new WiFiP2PManagerModule(reactContext));

        return modules;
    }

}
