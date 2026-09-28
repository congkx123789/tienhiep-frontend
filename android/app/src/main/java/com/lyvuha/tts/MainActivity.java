package com.lyvuha.tts;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.browser.customtabs.CustomTabsIntent;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeBrowserPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @CapacitorPlugin(name = "NativeBrowser")
    public static class NativeBrowserPlugin extends Plugin {
        @PluginMethod
        public void open(PluginCall call) {
            String urlStr = call.getString("url");
            if (urlStr == null || urlStr.isEmpty()) {
                call.reject("URL is empty");
                return;
            }
            try {
                CustomTabsIntent customTabsIntent = new CustomTabsIntent.Builder()
                    .setShowTitle(true)
                    .build();
                customTabsIntent.launchUrl(getActivity(), Uri.parse(urlStr));
                call.resolve();
            } catch (Exception e) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(urlStr));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getActivity().startActivity(intent);
                    call.resolve();
                } catch (Exception ex) {
                    call.reject(ex.getMessage());
                }
            }
        }
    }
}
