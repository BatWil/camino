package app.camino;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Edge-to-edge on every Android version (enforced from Android 15 with targetSdk 35+).
        // Safe areas reach the web layer through SystemBars (insetsHandling: "css").
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
