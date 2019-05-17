package com.movoapp;

import android.graphics.PointF;
import android.os.Bundle;

import com.affectiva.android.affdex.sdk.Frame;
import com.affectiva.android.affdex.sdk.detector.CameraDetector;
import com.affectiva.android.affdex.sdk.detector.Detector;
import com.affectiva.android.affdex.sdk.detector.Face;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import androidx.appcompat.app.AppCompatActivity;

import android.util.Log;
import android.view.SurfaceView;

import java.util.List;

public class AffectivaActivity extends AppCompatActivity
        implements Detector.FaceListener, Detector.ImageListener {

    private static final String TAG = "MOVO-AFFEX";
    private static final boolean LOG = true;
    private CameraDetector detector;
    private SurfaceView cameraView;

    private void ifLog(String toLog) {
        if (LOG) Log.d(TAG, toLog);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_affectiva);

        initializeCameraDetector();
    }

    void initializeCameraDetector() {
        /* Put the SDK in camera mode by using this constructor. The SDK will be in control of
         * the camera. If a SurfaceView is passed in as the last argument to the constructor,
         * that view will be painted with what the camera sees.
         */
        detector = new CameraDetector(
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
        detector.setDetectAllEmojis(true);
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

        //For each face found
        for (int i = 0 ; i < faces.size() ; i++) {
            Face face = faces.get(i);

            int faceId = face.getId();

            WritableMap params = Arguments.createMap();
            params.putString("id", String.valueOf(faceId));
            EventEmitterModule.emitEvent("face", params);
            ifLog(Integer.toString(faceId));

            //Appearance
            Face.GENDER genderValue = face.appearance.getGender();
            ifLog(genderValue.toString());
            Face.GLASSES glassesValue = face.appearance.getGlasses();
            Face.AGE ageValue = face.appearance.getAge();
            Face.ETHNICITY ethnicityValue = face.appearance.getEthnicity();


            //Some Emoji
            float smiley = face.emojis.getSmiley();
            float laughing = face.emojis.getLaughing();
            float wink = face.emojis.getWink();


            //Some Emotions
            float joy = face.emotions.getJoy();
            float anger = face.emotions.getAnger();
            float disgust = face.emotions.getDisgust();

            //Some Expressions
            float smile = face.expressions.getSmile();
            float brow_furrow = face.expressions.getBrowFurrow();
            float brow_raise = face.expressions.getBrowRaise();

            //Measurements
            float interocular_distance = face.measurements.getInterocularDistance();
            float yaw = face.measurements.orientation.getYaw();
            float roll = face.measurements.orientation.getRoll();
            float pitch = face.measurements.orientation.getPitch();

            //Face feature points coordinates
            PointF[] points = face.getFacePoints();

        }
    }

}
