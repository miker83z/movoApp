package com.movoapp.wifi.messagestasks;

import android.os.AsyncTask;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.movoapp.EventEmitterModule;
import com.movoapp.wifi.WiFiP2PManagerModule;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;


public class InitServerAsyncTask extends AsyncTask<Void, Void, Void> {
    private WiFiP2PManagerModule manager;

    public InitServerAsyncTask(WiFiP2PManagerModule manager) {
        this.manager = manager;
    }

    @Override
    protected Void doInBackground(Void... params) {
        try {
            ServerSocket serverSocket = new ServerSocket(8988);
            System.out.println("Server: Socket opened");
            Socket clientSocket = serverSocket.accept();
            InetAddress client = clientSocket.getInetAddress();
            manager.setHostAddress(client);
            System.out.println("Server: connection done");

            clientSocket.close();
            serverSocket.close();

            WritableMap obj = Arguments.createMap();
            obj.putBoolean("payload", true);
            EventEmitterModule.emitEvent("WIFI_P2P:START_SERVICE", obj);
        } catch (IOException e) {
            System.err.println(e.getMessage());
        }

        return null;
    }

    /*
     * (non-Javadoc)
     * @see android.os.AsyncTask#onPreExecute()
     */
    @Override
    protected void onPreExecute() {
        System.out.println("Opening a server socket");
    }
}
