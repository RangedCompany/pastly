"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { excludeAdminTelemetry } from "@/lib/telemetry";

export function Telemetry() {
  return (
    <>
      <Analytics beforeSend={excludeAdminTelemetry} />
      <SpeedInsights beforeSend={excludeAdminTelemetry} />
    </>
  );
}
