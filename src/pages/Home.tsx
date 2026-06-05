import { useMemo, useState } from "react";
import PermanentFarmland from "@/pages/PermanentFarmland";
import SupervisionMap from "@/pages/SupervisionMap";
import {
  BarChart3,
  Building2,
  ChevronRight,
  DatabaseZap,
  Layers3,
  LockKeyhole,
  MapPinned,
  Settings2,
  ShieldCheck,
  Sprout,
  UserRound,
} from "lucide-react";

type PortalProps = {
  onLogout: () => void;
  onOpenPermanent: () => void;
  onOpenSupervisionMap: () => void;
};

const systems = [
  { title: "高标准农田建设监管系统", desc: "建设进度、项目验收、资金监管、工程质量闭环调度", icon: Building2, tone: "from-emerald-500 to-lime-400", badge: "建设监管", count: "438", unit: "项目" },
  { title: "补充耕地验收管理系统", desc: "指标核验、外业举证、资料归档、验收结论统一管理", icon: Sprout, tone: "from-amber-400 to-orange-300", badge: "验收管理", count: "12.8", unit: "万亩" },
  { title: "永久基本农田质量管理", desc: "质量等级评价、地块档案、一张图展示和高标田关联", icon: ShieldCheck, tone: "from-teal-400 to-cyan-300", badge: "质量保护", count: "36,218", unit: "图斑" },
  { title: "系统管理", desc: "组织机构、角色权限、平台参数、运行日志与安全审计", icon: Settings2, tone: "from-slate-300 to-emerald-200", badge: "平台配置", count: "128", unit: "用户" },
  { title: "农田监管一张图", desc: "汇聚耕地资源、项目建设、质量评价、预警监测空间图层", icon: MapPinned, tone: "from-sky-400 to-emerald-300", badge: "空间总览", count: "32", unit: "图层", wide: true },
];

const metrics = [
  { label: "监管耕地面积", value: "7,826", unit: "万亩" },
  { label: "在管建设项目", value: "438", unit: "个" },
  { label: "验收通过率", value: "96.8", unit: "%" },
  { label: "一张图图层", value: "32", unit: "类" },
];

const notices = ["高标田建设进度已同步至省级监管库", "补充耕地验收资料完整率持续提升", "永久基本农田质量监测专题图层已更新"];

function LoginView({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071d19] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(250,204,21,0.2),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(20,184,166,0.24),transparent_30%),linear-gradient(135deg,#06221c_0%,#0a352e_42%,#10251f_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:46px_46px]" />
      <section className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1.12fr_0.88fr] lg:px-10">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200/20 bg-white/8 px-5 py-2 text-sm text-emerald-50 shadow-2xl shadow-emerald-950/20 backdrop-blur">
            <DatabaseZap className="h-4 w-4 text-amber-200" />
            安徽粮食 · 农田数字监管门户
          </div>
          <div className="max-w-3xl space-y-5">
            <h1 className="text-5xl font-black leading-tight tracking-tight md:text-7xl">一屏统管<span className="block bg-gradient-to-r from-amber-200 via-lime-100 to-emerald-200 bg-clip-text text-transparent">良田建设与保护</span></h1>
            <p className="max-w-2xl text-lg leading-8 text-emerald-50/78">汇聚高标准农田、补充耕地、永久基本农田质量与空间监管能力，为农田保护和项目监管提供统一入口。</p>
          </div>
          <div className="grid max-w-2xl grid-cols-3 gap-4">
            {metrics.slice(0, 3).map((item) => <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md"><div className="text-2xl font-black text-amber-100">{item.value}</div><div className="mt-1 text-xs text-emerald-50/65">{item.label}</div></div>)}
          </div>
        </div>
        <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/16 bg-white/12 p-7 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="mb-8 flex items-center justify-between"><div><p className="text-sm text-emerald-100/70">欢迎登录</p><h2 className="mt-1 text-2xl font-black">农田监管门户</h2></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-200 to-emerald-300 text-emerald-950 shadow-lg shadow-amber-500/20"><LockKeyhole className="h-6 w-6" /></div></div>
          <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onLogin(); }}>
            <label className="block"><span className="mb-2 block text-sm text-emerald-50/78">账号</span><div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-emerald-950/40 px-4 py-3 focus-within:border-amber-200/80"><UserRound className="h-5 w-5 text-amber-100" /><input className="w-full bg-transparent text-white outline-none" defaultValue="admin" /></div></label>
            <label className="block"><span className="mb-2 block text-sm text-emerald-50/78">密码</span><div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-emerald-950/40 px-4 py-3 focus-within:border-amber-200/80"><LockKeyhole className="h-5 w-5 text-amber-100" /><input className="w-full bg-transparent text-white outline-none" defaultValue="123456" type="password" /></div></label>
            <div className="flex items-center justify-between text-sm text-emerald-50/70"><label className="flex items-center gap-2"><input className="h-4 w-4 accent-emerald-400" defaultChecked type="checkbox" />记住账号</label><span>政务专网访问</span></div>
            <button className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-200 via-lime-200 to-emerald-300 px-5 py-4 font-black text-emerald-950 shadow-2xl shadow-emerald-950/30 transition hover:-translate-y-0.5">进入门户首页<ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" /></button>
          </form>
        </div>
      </section>
    </main>
  );
}

function PortalHome({ onLogout, onOpenPermanent, onOpenSupervisionMap }: PortalProps) {
  const [toast, setToast] = useState("");
  const dateText = useMemo(() => new Intl.DateTimeFormat("zh-CN", { dateStyle: "full" }).format(new Date()), []);
  const openPlaceholder = (name: string) => { setToast(`${name} 暂未建设二级页面`); window.setTimeout(() => setToast(""), 1800); };

  return (
    <main className="min-h-screen bg-[#edf3ec] text-slate-900">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_2%,rgba(210,166,65,0.22),transparent_26%),radial-gradient(circle_at_80%_8%,rgba(15,118,110,0.18),transparent_28%),linear-gradient(180deg,#f5f8ef_0%,#e8f0e7_52%,#f6f1df_100%)]" />
      <div className="fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(15,79,58,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(15,79,58,0.07)_1px,transparent_1px)] [background-size:48px_48px]" />
      <section className="relative mx-auto max-w-[1480px] px-8 py-7">
        <header className="flex items-center justify-between rounded-3xl border border-white/80 bg-white/78 px-7 py-5 shadow-[0_20px_70px_rgba(18,61,47,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#0d4a36] to-[#1f7a58] text-amber-100 shadow-lg shadow-emerald-900/20"><Layers3 className="h-8 w-8" /></div>
            <div><p className="text-sm font-bold tracking-[0.32em] text-emerald-700">ANHUI FARMLAND SUPERVISION</p><h1 className="mt-1 text-3xl font-black tracking-tight text-[#123d2f]">安徽粮食农田综合监管门户</h1></div>
          </div>
          <div className="flex items-center gap-4"><div className="text-right"><p className="text-sm font-bold text-[#123d2f]">省级监管中心</p><p className="text-xs text-slate-500">{dateText}</p></div><button onClick={onLogout} className="rounded-2xl bg-[#123d2f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0b2f24]">退出登录</button></div>
        </header>

        <section className="mt-7 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-[2.2rem] bg-[#123d2f] p-8 text-white shadow-2xl shadow-emerald-950/20">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_70%_35%,rgba(250,204,21,0.22),transparent_28%),linear-gradient(135deg,transparent,rgba(255,255,255,0.08))]" />
            <div className="relative max-w-3xl"><p className="inline-flex rounded-full border border-amber-200/20 bg-white/10 px-4 py-2 text-sm font-bold text-amber-100">耕地保护 · 建设监管 · 质量评价 · 空间一张图</p><h2 className="mt-6 text-5xl font-black leading-tight">统筹农田建设、保护、验收与质量档案</h2><p className="mt-5 max-w-2xl leading-8 text-emerald-50/74">围绕粮食安全和耕地保护目标，整合业务系统入口、监管指标、空间图层和运行动态，形成统一的农田监管工作台。</p></div>
            <div className="relative mt-8 grid grid-cols-4 gap-4">{metrics.map((item) => <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur"><div className="flex items-end gap-1"><span className="text-4xl font-black text-amber-100">{item.value}</span><span className="pb-1 text-xs text-emerald-50/60">{item.unit}</span></div><p className="mt-2 text-sm text-emerald-50/70">{item.label}</p></div>)}</div>
          </div>
          <div className="grid gap-4 rounded-[2.2rem] border border-white/80 bg-white/74 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
            <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-emerald-700">监管动态</p><h3 className="text-2xl font-black text-[#123d2f]">今日运行概览</h3></div><BarChart3 className="h-8 w-8 text-emerald-700" /></div>
            {notices.map((notice, index) => <div key={notice} className="flex gap-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-white p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#123d2f] text-sm font-black text-amber-100">0{index + 1}</span><div><p className="font-bold text-[#123d2f]">{notice}</p><p className="mt-1 text-xs text-slate-500">数据校核完成，已进入工作台待办队列</p></div></div>)}
          </div>
        </section>

        <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {systems.map((system) => {
            const Icon = system.icon;
            return (
              <button key={system.title} onClick={() => { if (system.title === "永久基本农田质量管理") { onOpenPermanent(); return; } if (system.title === "农田监管一张图") { onOpenSupervisionMap(); return; } openPlaceholder(system.title); }} className={`group relative overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/82 p-5 text-left shadow-[0_18px_60px_rgba(18,61,47,0.08)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_24px_90px_rgba(18,61,47,0.14)] ${system.wide ? "xl:col-span-1" : ""}`}>
                <div className={`absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${system.tone} opacity-20 transition group-hover:scale-125`} />
                <div className="relative flex items-center justify-between"><div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${system.tone} text-[#123d2f] shadow-md`}><Icon className="h-6 w-6" /></div><span className="rounded-full bg-emerald-900/8 px-3 py-1 text-xs font-bold text-emerald-800">{system.badge}</span></div>
                <h3 className="relative mt-5 min-h-14 text-xl font-black leading-snug text-[#123d2f]">{system.title}</h3>
                <p className="relative mt-3 min-h-16 text-sm leading-6 text-slate-600">{system.desc}</p>
                <div className="relative mt-5 flex items-end justify-between border-t border-emerald-900/10 pt-4"><div><span className="text-3xl font-black text-[#123d2f]">{system.count}</span><span className="ml-1 text-xs text-slate-500">{system.unit}</span></div><span className="flex items-center gap-1 text-sm font-black text-emerald-700">进入<ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></div>
              </button>
            );
          })}
        </section>
      </section>
      {toast && <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#123d2f] px-6 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-950/25">{toast}</div>}
    </main>
  );
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSystem, setActiveSystem] = useState<"portal" | "permanent" | "supervisionMap">("portal");

  if (!isLoggedIn) return <LoginView onLogin={() => setIsLoggedIn(true)} />;
  if (activeSystem === "permanent") return <PermanentFarmland onBack={() => setActiveSystem("portal")} />;
  if (activeSystem === "supervisionMap") return <SupervisionMap onBack={() => setActiveSystem("portal")} />;
  return <PortalHome onLogout={() => setIsLoggedIn(false)} onOpenPermanent={() => setActiveSystem("permanent")} onOpenSupervisionMap={() => setActiveSystem("supervisionMap")} />;
}
