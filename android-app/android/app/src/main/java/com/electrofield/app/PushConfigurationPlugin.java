package com.electrofield.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.firebase.FirebaseApp;

@CapacitorPlugin(name = "PushConfiguration")
public class PushConfigurationPlugin extends Plugin {
    @PluginMethod
    public void isReady(PluginCall call) {
        JSObject result = new JSObject();
        result.put("ready", !FirebaseApp.getApps(getContext()).isEmpty());
        call.resolve(result);
    }
}
