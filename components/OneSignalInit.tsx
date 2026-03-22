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
        appId: "b70baff3-2e8b-4292-bae8-5b69f503d29b",
        serviceWorkerPath: "/sw.js",
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
