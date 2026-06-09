import type { ReactNode } from "react";
import { Pane, TileLayer } from "react-leaflet";
import { getTencentMapKey } from "./tencentMapConfig";

const tencentSubdomains = ["0", "1", "2", "3"];

export function TencentBasemap({ fallback }: { fallback: ReactNode }) {
  const key = getTencentMapKey();
  if (!key) return <>{fallback}</>;

  return (
    <>
      <TileLayer
        url={`https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={y}&styleid=1&version=347&key=${key}`}
        subdomains={tencentSubdomains}
        maxZoom={18}
        opacity={0.88}
        className="gis-tencent-tile"
      />
      <Pane name="gis-basemap-mask" style={{ zIndex: 210, pointerEvents: "none" }}>
        <div className="gis-map-mask" />
      </Pane>
    </>
  );
}
