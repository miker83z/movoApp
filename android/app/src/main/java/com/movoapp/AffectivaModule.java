package com.movoapp;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AffectivaModule extends ReactContextBaseJavaModule {

    public AffectivaModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AffectivaModule";
    }

    @ReactMethod
    public void start() {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            Intent intent = new Intent(activity, AffectivaActivity.class);
            activity.startActivity(intent);
        }
    }

}
