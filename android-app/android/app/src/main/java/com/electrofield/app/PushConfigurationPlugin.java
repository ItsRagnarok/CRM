package com.electrofield.app;

import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.List;

@CapacitorPlugin(name = "PushConfiguration")
public class PushConfigurationPlugin extends Plugin {
    @PluginMethod
    public void isReady(PluginCall call) {
        JSObject result = new JSObject();
        boolean ready = false;
        try {
            // Firebase is an implementation dependency of the push plugin.
            // Inspect its runtime state without adding a second SDK dependency.
            Class<?> firebase = Class.forName("com.google.firebase.FirebaseApp");
            List<?> apps = (List<?>) firebase.getMethod("getApps", Context.class).invoke(null, getContext());
            ready = !apps.isEmpty();
        } catch (ReflectiveOperationException | RuntimeException error) {
            ready = false;
        }
        result.put("ready", ready);
        call.resolve(result);
    }
}
