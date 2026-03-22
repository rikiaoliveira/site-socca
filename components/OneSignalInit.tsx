"use client";
import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    OneSignalDeferred?: ((os: any) => void)[];
  }
}

export default function OneSignalInit() {
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId: "decb3977-7e1e-4c49-a9a8-974de37e3d1c",
        notifyButton: { enable: false },
      });
    });
  }, []);

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      defer
    />
  );
}
