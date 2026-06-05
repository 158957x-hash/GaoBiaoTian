import { useState } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import type { Plot } from "@/data/permanentFarmland";

type ArchiveDetailProps = {
  plot: Plot | null;
  onClose: () => void;
};

const tabs = ["基础信息", "质量信息", "高标田关联", "附件材料"] as const;

type Tab = (typeof tabs)[number];

function FieldGrid({ rows }: { rows: Array<[string, string | number]> }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-4">
          <div className="text-xs font-bold text-slate-500">{label}</div>
          <div className="mt-1 text-sm font-black text-[#123d2f]">{value}</div>
        </div>
      ))}
    </div>
  );
}

export default function ArchiveDetail({ plot, onClose }: ArchiveDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>("基础信息");
  const [preview, setPreview] = useState("");

  if (!plot) return null;

  const baseRows: Array<[string, string | number]> = [
    ["档案编号", `DA-340121-2026-${plot.blockNo.slice(-6)}`],
    ["田块编号", plot.blockNo],
    ["图斑编号", plot.plotNo],
    ["所属行政区", `安徽省 / ${plot.city} / ${plot.county} / ${plot.town}`],
    ["图斑面积", `${plot.area} 亩`],
    ["耕地类型", plot.landType],
    ["档案状态", plot.archiveStatus],
    ["建档时间", "2026-05-28"],
    ["更新日期", plot.updatedAt],
  ];

  const qualityRows: Array<[string, string | number]> = [
    ["耕地质量等级", `${plot.qualityLevel} 等`],
    ["土壤类型", plot.soilType],
    ["耕作制度", "一年两熟"],
    ["立地条件", "地势平坦、灌排条件较好"],
    ["有机质", plot.organicMatter],
    ["有效磷", plot.phosphorus],
    ["速效钾", plot.potassium],
    ["pH 值", plot.ph],
    ["田间基础设施", "灌溉渠、田间道路完善"],
    ["质量评价结论", plot.qualityLevel <= 6 ? "质量等级较高，适宜稳定粮食生产" : "需加强地力提升和基础设施维护"],
  ];

  const projectRows: Array<[string, string | number]> = [
    ["是否已建高标准农田", plot.isHighStandard ? "是" : "否"],
    ["关联项目名称", plot.projectName],
    ["项目编号", plot.isHighStandard ? `GBZNT-2024-${plot.county.slice(0, 2).toUpperCase()}-001` : "无"],
    ["建设年度", plot.isHighStandard ? "2024 年" : "未建设"],
    ["建设内容", plot.isHighStandard ? "灌排工程、田间道路、土地平整" : "无"],
    ["验收状态", plot.isHighStandard ? "已验收" : "无"],
    ["与本图斑重叠面积", plot.isHighStandard ? `${Math.max(plot.area - 4.26, 0).toFixed(2)} 亩` : "0 亩"],
  ];

  const files = [
    ["耕地质量调查报告.pdf", "调查报告"],
    ["田块空间图.pdf", "图件"],
    ["高标田项目验收材料.pdf", "关联材料"],
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-sm">
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-4xl flex-col bg-[#f7fbf1] shadow-2xl shadow-slate-950/30">
        <header className="border-b border-emerald-900/10 bg-white/80 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-emerald-700">永久基本农田质量档案</p>
              <h2 className="mt-1 text-2xl font-black text-[#123d2f]">{plot.blockNo}</h2>
              <p className="mt-1 text-sm text-slate-500">{plot.city} · {plot.county} · {plot.town}</p>
            </div>
            <button onClick={onClose} className="rounded-2xl bg-slate-900 p-3 text-white transition hover:bg-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-5 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${activeTab === tab ? "bg-[#123d2f] text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}>
                {tab}
              </button>
            ))}
          </nav>
        </header>

        <section className="flex-1 overflow-auto p-5">
          {activeTab === "基础信息" && <FieldGrid rows={baseRows} />}
          {activeTab === "质量信息" && <FieldGrid rows={qualityRows} />}
          {activeTab === "高标田关联" && <FieldGrid rows={projectRows} />}
          {activeTab === "附件材料" && (
            <div className="space-y-3">
              {files.map(([name, type]) => (
                <div key={name} className="flex items-center justify-between rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                      <Paperclip className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-black text-[#123d2f]">{name}</div>
                      <div className="text-xs text-slate-500">{type}</div>
                    </div>
                  </div>
                  <button onClick={() => setPreview(name)} className="rounded-xl bg-[#123d2f] px-4 py-2 text-sm font-bold text-white hover:bg-[#0b2f24]">预览</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </aside>
      {preview && (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/45 p-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 text-center shadow-2xl">
            <FileText className="mx-auto h-14 w-14 text-emerald-700" />
            <h3 className="mt-4 text-xl font-black text-[#123d2f]">附件预览</h3>
            <p className="mt-2 text-slate-600">{preview}</p>
            <div className="mt-5 rounded-2xl bg-emerald-50 p-8 text-sm text-slate-500">PDF 文件预览区域</div>
            <button onClick={() => setPreview("")} className="mt-5 rounded-2xl bg-[#123d2f] px-6 py-3 font-bold text-white">关闭预览</button>
          </div>
        </div>
      )}
    </div>
  );
}
