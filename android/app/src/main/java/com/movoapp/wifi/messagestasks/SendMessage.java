package com.movoapp.wifi.messagestasks;

import com.movoapp.wifi.Utils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.Charset;

/**
 * Created by zyusk on 03.11.2018.
 */
public class SendMessage {

    private String hostAddress;
    private String message;

    public SendMessage(String hostAddress, String message) {
        this.hostAddress = hostAddress;
        this.message = message;
    }

    public void execute() {
        int counter = 0;
        boolean flag = false;
        Socket socket = null;
        try{
            while( !flag && counter++ < 3 ) {
                try {
                    socket = new Socket();
                    socket.bind(null);
                    System.out.println("Opening client socket - ");
                    socket.connect((new InetSocketAddress(hostAddress, 8688)), 5000);

                    System.out.println("Client socket - " + socket.isConnected());
                    OutputStream stream = socket.getOutputStream();
                    InputStream is = new ByteArrayInputStream(message.getBytes(Charset.forName(Utils.CHARSET)));
                    Utils.copyBytes(is, stream);
                    System.out.println("Client: Data written");
                    flag = true;
                } catch (IOException e) {
                    System.err.println(e.getMessage());
                } finally {
                    if (socket != null) {
                        if (socket.isConnected()) {
                            try {
                                socket.close();
                            } catch (IOException e) {
                                // Give up
                                e.printStackTrace();
                            }
                        }
                    }
                }

                Thread.sleep(5000);
            }
        } catch ( InterruptedException e ) {
            System.err.println(e.getMessage());
        }
    }
}
