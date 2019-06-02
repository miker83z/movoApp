package com.movoapp.wifi.messagestasks;

import android.os.AsyncTask;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.movoapp.EventEmitterModule;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;


public class InitClientAsyncTask extends AsyncTask<Void, Void, Void> {
    public static InetAddress server;

    public InitClientAsyncTask(InetAddress serverAddr) {
        server = serverAddr;
    }

    @Override
    protected Void doInBackground(Void... params) {
        boolean flag = false;
        try{
            while(!flag) {
                try {
                    Socket socket = new Socket();
                    System.out.println("Client: Socket opened");
                    socket.bind(null);
                    socket.connect(new InetSocketAddress(server, 8988), 5000);
                    flag = true;
                    socket.close();
                    System.out.println("Client: connection done");

                    WritableMap obj = Arguments.createMap();
                    obj.putBoolean("payload", true);
                    EventEmitterModule.emitEvent("WIFI_P2P:START_SERVICE", obj);
                } catch (IOException e) {
                    System.err.println(e.getMessage());
                }
                Thread.sleep(5000);
            }
        } catch ( InterruptedException e ) {
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
