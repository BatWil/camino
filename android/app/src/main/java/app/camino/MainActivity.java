package app.camino;

import android.os.Bundle;
import android.webkit.WebSettings;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    /** Larger system fonts still enlarge the text, but only up to 115% so the design keeps its layout. */
    private static final int MAX_TEXT_ZOOM = 115;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Edge-to-edge on every Android version (enforced from Android 15 with targetSdk 35+).
        // Safe areas reach the web layer through SystemBars (insetsHandling: "css").
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebSettings settings = getBridge().getWebView().getSettings();
            settings.setTextZoom(Math.min(settings.getTextZoom(), MAX_TEXT_ZOOM));
        }
    }
}
