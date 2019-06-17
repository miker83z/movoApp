package com.movoapp.bluetooth;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.highmobility.autoapi.Capabilities;
import com.highmobility.autoapi.Command;
import com.highmobility.autoapi.CommandResolver;
import com.highmobility.autoapi.GetCapabilities;
import com.highmobility.autoapi.GetVehicleStatus;
import com.highmobility.autoapi.VehicleLocation;
import com.highmobility.autoapi.VehicleStatus;
import com.highmobility.crypto.value.DeviceSerial;
import com.highmobility.hmkit.Broadcaster;
import com.highmobility.hmkit.BroadcasterListener;
import com.highmobility.hmkit.ConnectedLink;
import com.highmobility.hmkit.ConnectedLinkListener;
import com.highmobility.hmkit.HMKit;
import com.highmobility.hmkit.Link;
import com.highmobility.hmkit.error.BroadcastError;
import com.highmobility.hmkit.error.DownloadAccessCertificateError;
import com.highmobility.hmkit.error.LinkError;
import com.highmobility.value.Bytes;
import com.movoapp.EventEmitterModule;

public class BluetoothModule extends ReactContextBaseJavaModule {

    private static final String TAG = "MOVO-BLUE";
    private static final boolean LOG = false;

    public BluetoothModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "BluetoothModule";
    }

    private void ifLog(String toLog) {
        if (LOG) Log.d(TAG, toLog);
    }

    @ReactMethod
    public void initHM() {

        HMKit.getInstance().initialise(
                "dGVzdHZ+c0Q/87hmvKQKU0LhA0S0Wbk4ASadD14tAqkIU9DGM9KmxB4URXLjlm48x9dSGf3ZDU+H2bzdA8bwpK6hzQSmjtv556OCNEvuWWctsoDNvvqjUXxs8XGpSfUBIYKpM2WoyT6HumMyxQvrxqNsW6pRcSZrkNoCnwCEEOoGNuMEJ7sJrCDHHLX65rS7vWXqc6KkXpLV",
                "QJNlA00raRnsgA/StDYJ0+BcPhyg8fjCgfyCklsm5ms=",
                "gmm0gb7ZgoMM3g4hoZsPDmrB6CBfkbqyytF/OVEpAr3iVAYWWP2a0ae2LzDS7BEDXhphbvfMN2OHiuaPPtf7NA==",
                getReactApplicationContext().getApplicationContext()
        );

        String accessToken = "f009739d-3530-48cb-a60f-5ce07718128b";

        HMKit.getInstance().downloadAccessCertificate(accessToken, new HMKit.DownloadCallback() {
            @Override
            public void onDownloaded(DeviceSerial serial) {
                ifLog("Certificate downloaded for vehicle: " + serial);
                // Send command to the car through Telematics, make sure that the emulator is
                // opened for this to work, otherwise "Vehicle asleep" will be returned
                //workWithTelematics(serial);

                // Also make the device visible through Bluetooth to the car
                workWithBluetooth();
            }

            @Override
            public void onDownloadFailed(DownloadAccessCertificateError error) {
                ifLog("Could not download a certificate with token: " + error.getMessage());
            }
        });
    }

    private void workWithBluetooth() {
        // Start Bluetooth broadcasting, so that the car can connect to this device
        final Broadcaster broadcaster = HMKit.getInstance().getBroadcaster();

        if (broadcaster == null) return; // emulator

        broadcaster.setListener(new BroadcasterListener() {
            @Override
            public void onStateChanged(Broadcaster.State state) {
                ifLog("Broadcasting state changed: " + state);
            }

            @Override
            public void onLinkReceived(ConnectedLink connectedLink) {
                connectedLink.setListener(new ConnectedLinkListener() {
                    @Override
                    public void onAuthorizationRequested(ConnectedLink connectedLink,
                                                         ConnectedLinkListener.AuthorizationCallback authorizationCallback) {
                        // Approving without user input
                        authorizationCallback.approve();
                    }

                    @Override
                    public void onAuthorizationTimeout(ConnectedLink connectedLink) {

                    }

                    @Override
                    public void onStateChanged(final Link link, Link.State state) {
                        if (link.getState() == Link.State.AUTHENTICATED) {
                            Bytes command = new GetCapabilities();
                            link.sendCommand(command, new Link.CommandCallback() {
                                @Override
                                public void onCommandSent() {
                                    ifLog("Command successfully sent through " +
                                            "Bluetooth");
                                }

                                @Override
                                public void onCommandFailed(LinkError linkError) {

                                }
                            });
                        }
                    }

                    @Override
                    public void onCommandReceived(final Link link, Bytes bytes) {
                        final Command command;

                        command = CommandResolver.resolve(bytes);
                        if (command instanceof VehicleLocation) {
                            VehicleLocation location = (VehicleLocation) command;
                            // vehicle location testState can now be accessed:

                            // coordinates
                            double lat = location.getCoordinates().getValue().getLatitude();
                            double lon = location.getCoordinates().getValue().getLongitude();
                            //String.valueOf(lat));
                            WritableMap params = Arguments.createMap();
                            params.putString("lat", String.valueOf(lat));
                            params.putString("lon", String.valueOf(lon));
                            EventEmitterModule.emitEvent("coordinates", params);


                        } else if (command instanceof Capabilities) {

                            link.sendCommand(new GetVehicleStatus(), new
                                    Link.CommandCallback() {
                                        @Override
                                        public void onCommandSent() {
                                            ifLog("VS Command successfully " +
                                                    "sent through Bluetooth");
                                        }

                                        @Override
                                        public void onCommandFailed(LinkError
                                                                            linkError) {

                                        }
                                    });

                        } else if (command instanceof VehicleStatus) {
                            VehicleStatus status = (VehicleStatus) command;
                            ifLog("BLE Vehicle Status received\nvin:" + status.getVin());

                        }
                    }
                });
                WritableMap params = Arguments.createMap();
                params.putString("bluetooth", "ON");
                EventEmitterModule.emitEvent("bluetooth", params);
            }

            @Override
            public void onLinkLost(ConnectedLink connectedLink) {
                // Bluetooth disconnected
                ifLog("Bluetooth disconnected");

                WritableMap params = Arguments.createMap();
                params.putString("bluetooth", "OFF");
                EventEmitterModule.emitEvent("bluetooth", params);
            }
        });

        broadcaster.startBroadcasting(new Broadcaster.StartCallback() {
            @Override
            public void onBroadcastingStarted() {
                ifLog("Bluetooth broadcasting started");
            }

            @Override
            public void onBroadcastingFailed(BroadcastError broadcastError) {
                ifLog("Bluetooth broadcasting started: " + broadcastError);
            }
        });
    }
}
