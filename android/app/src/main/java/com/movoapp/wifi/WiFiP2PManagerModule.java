package com.movoapp.wifi;

import android.app.Activity;
import android.content.Context;
import android.content.IntentFilter;
import android.net.wifi.WpsInfo;
import android.net.wifi.p2p.WifiP2pConfig;
import android.net.wifi.p2p.WifiP2pInfo;
import android.net.wifi.p2p.WifiP2pManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.movoapp.wifi.messagestasks.InitClientAsyncTask;
import com.movoapp.wifi.messagestasks.InitServerAsyncTask;
import com.movoapp.wifi.messagestasks.ReceiveAsyncTask;
import com.movoapp.wifi.messagestasks.SendMessage;

import java.net.InetAddress;

import static android.os.Looper.getMainLooper;


public class WiFiP2PManagerModule extends ReactContextBaseJavaModule implements WifiP2pManager.ConnectionInfoListener {
    private WifiP2pInfo wifiP2pInfo;
    private WifiP2pManager manager;
    private WifiP2pManager.Channel channel;
    private ReactApplicationContext reactContext;
    private final IntentFilter intentFilter = new IntentFilter();
    private WiFiP2PDeviceMapper mapper = new WiFiP2PDeviceMapper();
    private InetAddress hostAddress;

    public WiFiP2PManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "WiFiP2PManagerModule";
    }

    @Override
    public void onConnectionInfoAvailable(WifiP2pInfo info) {
        this.wifiP2pInfo = info;
    }

    @ReactMethod
    public void init() {
        if (manager != null) { // prevent reinitialization
            return;
        }
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION);
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION);
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION);
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_THIS_DEVICE_CHANGED_ACTION);

        Activity activity = getCurrentActivity();
        if (activity != null) {
            manager = (WifiP2pManager) activity.getSystemService(Context.WIFI_P2P_SERVICE);
            channel = manager.initialize(activity, getMainLooper(), null);

            WiFiP2PBroadcastReceiver receiver = new WiFiP2PBroadcastReceiver(manager, channel);
            activity.registerReceiver(receiver, intentFilter);
        }
    }

    @ReactMethod
    public void isSuccessfulInitialize(Promise promise) {
        Boolean isSuccessfulInitialize = manager != null && channel != null;
        promise.resolve(isSuccessfulInitialize);
    }

    @ReactMethod
    public void discoverPeers(final Callback callback) {
        manager.discoverPeers(channel, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                callback.invoke();
            }

            @Override
            public void onFailure(int reasonCode) {
                callback.invoke(Integer.valueOf(reasonCode));
            }
        });
    }

    @ReactMethod
    public void stopPeerDiscovery(final Callback callback) {
        manager.stopPeerDiscovery(channel, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                callback.invoke();
            }

            @Override
            public void onFailure(int reasonCode) {
                callback.invoke(Integer.valueOf(reasonCode));
            }
        });
    }

    @ReactMethod
    public void connect(String deviceAddress, final Callback callback) {
        WifiP2pConfig config = new WifiP2pConfig();
        config.deviceAddress = deviceAddress;
        config.wps.setup = WpsInfo.PBC;

        manager.connect(channel, config, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                startCommunication();
                callback.invoke();
            }

            @Override
            public void onFailure(int reasonCode) {
                callback.invoke(Integer.valueOf(reasonCode));
            }
        });
    }

    @ReactMethod
    public void disconnect(final Callback callback) {
        manager.cancelConnect(channel, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                callback.invoke();
            }

            @Override
            public void onFailure(int reasonCode) {
                callback.invoke(Integer.valueOf(reasonCode));
            }
        });
    }

    @ReactMethod
    public void startCommunication() {
        WiFiP2PManagerModule temp = this;
        manager.requestConnectionInfo(channel, new WifiP2pManager.ConnectionInfoListener() {
            @Override
            public void onConnectionInfoAvailable(WifiP2pInfo info) {
                if (info.groupFormed && info.isGroupOwner) {
                    new InitServerAsyncTask(temp)
                            .execute();
                } else if (info.groupFormed) {
                    setHostAddress(info.groupOwnerAddress);
                    new InitClientAsyncTask(info.groupOwnerAddress)
                            .execute();
                }
            }
        });
    }

    @ReactMethod
    public void receiveMessage() {
        new ReceiveAsyncTask()
                .execute();
    }

    @ReactMethod
    public void sendMessage(String message) {
        System.out.println("Sending message: " + message);
        new SendMessage(hostAddress.getHostAddress(), message)
                .execute();
    }

    @ReactMethod
    public void getConnectionInfo(final Promise promise) {
        manager.requestConnectionInfo(channel, new WifiP2pManager.ConnectionInfoListener() {
            @Override
            public void onConnectionInfoAvailable(WifiP2pInfo wifiP2pInformation) {
                System.out.println(wifiP2pInformation);

                wifiP2pInfo = wifiP2pInformation;

                promise.resolve(mapper.mapWiFiP2PInfoToReactEntity(wifiP2pInformation));
            }
        });
    }

    public void setHostAddress(InetAddress hostAddress) {
        this.hostAddress = hostAddress;
    }
}
