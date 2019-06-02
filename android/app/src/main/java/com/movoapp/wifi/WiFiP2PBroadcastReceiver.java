package com.movoapp.wifi;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.NetworkInfo;
import android.net.wifi.p2p.WifiP2pDeviceList;
import android.net.wifi.p2p.WifiP2pInfo;
import android.net.wifi.p2p.WifiP2pManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.movoapp.EventEmitterModule;


public class WiFiP2PBroadcastReceiver extends BroadcastReceiver {
    private WifiP2pManager manager;
    private WifiP2pManager.Channel channel;
    private WiFiP2PDeviceMapper mapper = new WiFiP2PDeviceMapper();

    public WiFiP2PBroadcastReceiver(WifiP2pManager manager, WifiP2pManager.Channel channel) {
        super();

        this.manager = manager;
        this.channel = channel;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        /**********************************
         Available peer list has changed
         **********************************/
        if (WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION.equals(action)) {
            manager.requestPeers(channel, peerListListener);
        }

        /******************************************************************
         State of connectivity has changed (new connection/disconnection)
         ******************************************************************/
        else if (WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION.equals(action)) {
            NetworkInfo networkInfo = (NetworkInfo) intent.getParcelableExtra(WifiP2pManager.EXTRA_NETWORK_INFO);

            if (networkInfo.isConnected()) {
                manager.requestConnectionInfo(channel, connectionListener);
            }
        }
    }

    private WifiP2pManager.PeerListListener peerListListener = new WifiP2pManager.PeerListListener() {
        @Override
        public void onPeersAvailable(WifiP2pDeviceList deviceList) {
            WritableMap params = mapper.mapDevicesInfoToReactEntity(deviceList);
            EventEmitterModule.emitEvent("WIFI_P2P:PEERS_UPDATED", params);
        }
    };

    private WifiP2pManager.ConnectionInfoListener connectionListener = new WifiP2pManager.ConnectionInfoListener() {
        @Override
        public void onConnectionInfoAvailable(final WifiP2pInfo info) {
            WritableMap params = mapper.mapWiFiP2PInfoToReactEntity(info);
            EventEmitterModule.emitEvent("WIFI_P2P:CONNECTION_INFO_UPDATED", params);
        }
    };
}
