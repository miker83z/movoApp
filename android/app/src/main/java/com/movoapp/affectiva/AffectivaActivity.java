package com.movoapp.affectiva;

import android.os.Bundle;

import com.affectiva.android.affdex.sdk.Frame;
import com.affectiva.android.affdex.sdk.detector.CameraDetector;
import com.affectiva.android.affdex.sdk.detector.Detector;
import com.affectiva.android.affdex.sdk.detector.Face;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.movoapp.EventEmitterModule;
import com.movoapp.R;

import androidx.appcompat.app.AppCompatActivity;

import android.util.Log;
import android.view.SurfaceView;

import java.util.List;
import java.text.SimpleDateFormat;
import java.util.Date;

public class AffectivaActivity extends AppCompatActivity
        implements Detector.FaceListener, Detector.ImageListener {

    private static final String TAG = "MOVO-AFFEX";
    private static final boolean LOG = true;
    private static final int acquireRate = 1000; //In milliseconds
    private long actualLimit;

    private void ifLog(String toLog) {
        if (LOG) Log.d(TAG, toLog);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_affectiva);
        actualLimit = 0;

        initializeCameraDetector();
    }

    void initializeCameraDetector() {
        CameraDetector detector = new CameraDetector(
                this,
                CameraDetector.CameraType.CAMERA_FRONT,
                (SurfaceView) findViewById(R.id.surface_view_camera),
                5,
                Detector.FaceDetectorMode.LARGE_FACES
        );
        detector.setImageListener(this);
        detector.setFaceListener(this);

        detector.setDetectAllExpressions(true);
        detector.setDetectAllEmotions(true);
        detector.setDetectAllAppearances(true);

        detector.setMaxProcessRate(10);

        ifLog("Starting detector");
        detector.start();
    }

    @Override
    public void onFaceDetectionStarted() {
        WritableMap params = Arguments.createMap();
        params.putBoolean("value", true);
        EventEmitterModule.emitEvent("faceDetection", params);
        ifLog("Face detection started");
    }

    @Override
    public void onFaceDetectionStopped() {
        WritableMap params = Arguments.createMap();
        params.putBoolean("value", false);
        EventEmitterModule.emitEvent("faceDetection", params);
        ifLog("Face detection stopped");
    }

    //Retrieve metric values from the Face object
    @Override
    public void onImageResults(List<Face> faces, Frame image, float timestamp) {

        if (faces == null)
            return; //frame was not processed

        if (faces.size() == 0)
            return; //no face found

        long temp = new Date().getTime();
        if ( temp < actualLimit + acquireRate)
            return; //too soon
        else
            actualLimit = temp;

        WritableArray facesArray = Arguments.createArray();

        //For each face found
        for (int i = 0 ; i < faces.size() ; i++) {
            Face face = faces.get(i);

            int faceId = face.getId();

            WritableMap faceObj = Arguments.createMap();
            faceObj.putString("id", String.valueOf(faceId));
            faceObj.putDouble("timestamp", timestamp);

            // Detect identity
            //Appearance
            Face.GENDER genderValue = face.appearance.getGender();
            Face.GLASSES glassesValue = face.appearance.getGlasses();
            Face.AGE ageValue = face.appearance.getAge();
            Face.ETHNICITY ethnicityValue = face.appearance.getEthnicity();
            //Measurements
            float interocular_distance = face.measurements.getInterocularDistance();
            float yaw = face.measurements.orientation.getYaw();
            float roll = face.measurements.orientation.getRoll();
            float pitch = face.measurements.orientation.getPitch();

            WritableMap identity = Arguments.createMap();
            identity.putString("gender", genderValue.toString());
            identity.putString("glasses", glassesValue.toString());
            identity.putString("age", ageValue.toString());
            identity.putString("ethnicity", ethnicityValue.toString());
            identity.putDouble("interocular", interocular_distance);
            identity.putDouble("yaw", yaw);
            identity.putDouble("roll", roll);
            identity.putDouble("pitch", pitch);
            faceObj.putMap("identity", identity);

            //Some Emotions
            float joy = face.emotions.getJoy();
            float anger = face.emotions.getAnger();
            float surprise = face.emotions.getSurprise();
            float fear = face.emotions.getFear();

            //Some Expressions
            float eyeClosure = face.expressions.getEyeClosure();
            float attention = face.expressions.getAttention();

            WritableMap expressions = Arguments.createMap();
            expressions.putDouble("joy",joy);
            expressions.putDouble("anger",anger);
            expressions.putDouble("surprise",surprise);
            expressions.putDouble("fear",fear);
            expressions.putDouble("eyeClosure",eyeClosure);
            expressions.putDouble("attention",attention);
            faceObj.putMap("expressions", expressions);

            facesArray.pushMap(faceObj);
        }

        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("dd-MM-yyyy-hh-mm-ss-z");
        String format = simpleDateFormat.format(new Date());

        ifLog(facesArray.toString());
        WritableMap obj = Arguments.createMap();
        obj.putArray("faces", facesArray);
        obj.putString("timestamp", format);
        EventEmitterModule.emitEvent("faces", obj);
    }

}
