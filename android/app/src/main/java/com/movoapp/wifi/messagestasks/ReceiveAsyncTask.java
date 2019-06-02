package com.movoapp.wifi.messagestasks;

import android.os.AsyncTask;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.movoapp.EventEmitterModule;
import com.movoapp.wifi.Utils;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.net.Socket;


public class ReceiveAsyncTask extends AsyncTask<Void, Void, Void> {

    private String convertStreamToString(InputStream is) throws IOException {
        StringBuilder sb = new StringBuilder(Math.max(16, is.available()));
        char[] tmp = new char[4096];

        try {
            InputStreamReader reader = new InputStreamReader(is, Utils.CHARSET);
            for(int cnt; (cnt = reader.read(tmp)) > 0;)
                sb.append( tmp, 0, cnt );
        } finally {
            is.close();
        }
        return sb.toString();
    }

    @Override
    protected Void doInBackground(Void... params) {
        try {
            ServerSocket serverSocket = new ServerSocket(8688);
            System.out.println("ReceiveAsyncTask: Socket opened");
            WritableMap asdf = Arguments.createMap();
            asdf.putBoolean("payload", true);
            EventEmitterModule.emitEvent("WIFI_P2P:START_RECEIVING", asdf);
            while(true) {
                Socket clientSocket = serverSocket.accept();
                System.out.println("ReceiveAsyncTask: received message");

                InputStream inputstream = clientSocket.getInputStream();
                String result = convertStreamToString(inputstream);
                clientSocket.close();

                WritableMap obj = Arguments.createMap();
                obj.putString("payload", result);
                EventEmitterModule.emitEvent("WIFI_P2P:NEW_MESSAGE", obj);
            }
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
        System.out.println("Opening a ReceiveAsyncTask socket");
    }
}
