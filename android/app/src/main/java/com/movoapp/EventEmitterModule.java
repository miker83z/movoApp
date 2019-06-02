package com.movoapp;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;


public class EventEmitterModule extends ReactContextBaseJavaModule {

    private static DeviceEventManagerModule.RCTDeviceEventEmitter eventEmitter = null;

    EventEmitterModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public void initialize() {
        super.initialize();
        eventEmitter = getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
    }

    @Override
    public String getName() {
        return "EventEmitter";
    }

    public static void emitEvent(@NonNull String eventName, WritableMap params) {
        eventEmitter.emit(eventName, params);
    }
}
