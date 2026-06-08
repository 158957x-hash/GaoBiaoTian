import type { ReactNode } from "react";
import { TileLayer } from "react-leaflet";
import { getTiandituTk } from "./tiandituConfig";

const tiandituSubdomains = ["0", "1", "2", "3", "4", "5", "6", "7"];

export function TiandituBasemap({ fallback }: { fallback: ReactNode }) {
  const tiandituTk = getTiandituTk();
  if (!tiandituTk) return <>{fallback}</>;

  return (
    <>
      <TileLayer
        url={`https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=${tiandituTk}`}
        subdomains={tiandituSubdomains}
        maxZoom={18}
      />
      <TileLayer
        url={`https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=${tiandituTk}`}
        subdomains={tiandituSubdomains}
        maxZoom={18}
      />
    </>
  );
}
