export type RegionLevel = "province" | "city" | "county";
export type ProjectStatus = "建设中" | "已完工" | "待验收" | "整改中";
export type FacilityType = "泵站" | "机耕桥" | "田间道路" | "渠系工程";
export type DeviceType = "摄像头" | "墒情设备" | "虫情设备";

export type SupervisionRegion = {
  id: string;
  name: string;
  level: RegionLevel;
  parentId?: string;
};

export type HighStandardProject = {
  id: string;
  code: string;
  name: string;
  regionId: string;
  city: string;
  county: string;
  town: string;
  area: number;
  investment: number;
  year: string;
  status: ProjectStatus;
  progress: number;
  constructionUnit: string;
  supervisionUnit: string;
  issueCount: number;
  rectifiedCount: number;
  fundsPaid: number;
  points: string;
  center: { x: number; y: number };
  latLng: [number, number];
  path: Array<[number, number]>;
  parcelPaths: Array<Array<[number, number]>>;
};

export type FacilityPoint = {
  id: string;
  projectId: string;
  type: FacilityType;
  name: string;
  status: "正常" | "施工中" | "待整改";
  x: number;
  y: number;
  latLng: [number, number];
};

export type DevicePoint = {
  id: string;
  projectId: string;
  type: DeviceType;
  name: string;
  status: "在线" | "离线" | "预警";
  x: number;
  y: number;
  latLng: [number, number];
  value: string;
  time: string;
};

export type SupervisionLayers = {
  projects: boolean;
  facilities: boolean;
  cameras: boolean;
  moisture: boolean;
  insects: boolean;
  boundary: boolean;
};

export const supervisionRegions: SupervisionRegion[] = [
  { id: "anhui", name: "安徽省", level: "province" },
  { id: "hefei", name: "合肥市", level: "city", parentId: "anhui" },
  { id: "suzhou", name: "宿州市", level: "city", parentId: "anhui" },
  { id: "fuyang", name: "阜阳市", level: "city", parentId: "anhui" },
  { id: "changfeng", name: "长丰县", level: "county", parentId: "hefei" },
  { id: "feidong", name: "肥东县", level: "county", parentId: "hefei" },
  { id: "feixi", name: "肥西县", level: "county", parentId: "hefei" },
  { id: "yongqiao", name: "埇桥区", level: "county", parentId: "suzhou" },
  { id: "lingbi", name: "灵璧县", level: "county", parentId: "suzhou" },
  { id: "yingzhou", name: "颍州区", level: "county", parentId: "fuyang" },
  { id: "taihe", name: "太和县", level: "county", parentId: "fuyang" },
];

const projectMeta: Array<[string, string, string, string, string, ProjectStatus, number, string, [number, number]]> = [
  ["changfeng", "合肥市", "长丰县", "双墩镇", "长丰县双墩镇高标准农田建设项目", "建设中", 72, "HSNT-2026-CF-001", [32.173, 117.23]],
  ["feidong", "合肥市", "肥东县", "店埠镇", "肥东县店埠镇农田基础设施提升项目", "已完工", 100, "HSNT-2026-FD-018", [31.89, 117.47]],
  ["feixi", "合肥市", "肥西县", "花岗镇", "肥西县花岗镇高效节水灌溉项目", "待验收", 96, "HSNT-2026-FX-011", [31.69, 117.08]],
  ["yongqiao", "宿州市", "埇桥区", "夹沟镇", "埇桥区夹沟镇粮食产能提升项目", "整改中", 84, "HSNT-2026-YQ-026", [33.72, 117.05]],
  ["lingbi", "宿州市", "灵璧县", "禅堂镇", "灵璧县禅堂镇土地平整及渠系项目", "建设中", 61, "HSNT-2026-LB-009", [33.59, 117.58]],
  ["yingzhou", "阜阳市", "颍州区", "三十里铺镇", "颍州区三十里铺镇高标田建设项目", "已完工", 100, "HSNT-2026-YZ-032", [32.83, 115.87]],
  ["taihe", "阜阳市", "太和县", "赵集乡", "太和县赵集乡农田道路提升项目", "建设中", 68, "HSNT-2026-TH-015", [33.14, 115.66]],
  ["changfeng", "合肥市", "长丰县", "岗集镇", "长丰县岗集镇绿色农田示范项目", "待验收", 93, "HSNT-2026-CF-027", [32.02, 117.13]],
];

export const highStandardProjects: HighStandardProject[] = projectMeta.map((item, index) => {
  const col = index % 4;
  const row = Math.floor(index / 4);
  const x = 105 + col * 190 + (row % 2) * 34;
  const y = 128 + row * 205 + (col % 2) * 32;
  const width = 118 + (index % 3) * 16;
  const height = 74 + (index % 4) * 12;
  const area = Number((4200 + index * 580 + (index % 2) * 360).toFixed(0));
  const investment = Number((1850 + index * 320 + (index % 3) * 140).toFixed(0));
  const latLng = item[8];
  const dLat = 0.026 + (index % 3) * 0.006;
  const dLng = 0.034 + (index % 2) * 0.007;
  const parcelPaths = Array.from({ length: 9 }, (_, parcelIndex) => {
    const parcelRow = Math.floor(parcelIndex / 3);
    const parcelCol = parcelIndex % 3;
    const cLat = latLng[0] + (parcelRow - 1) * dLat * 0.72 + ((parcelCol % 2) - 0.5) * dLat * 0.12;
    const cLng = latLng[1] + (parcelCol - 1) * dLng * 0.72 + ((parcelRow % 2) - 0.5) * dLng * 0.1;
    const sLat = dLat * (0.28 + (parcelIndex % 3) * 0.025);
    const sLng = dLng * (0.25 + (parcelIndex % 4) * 0.018);
    return [
      [Number((cLat + sLat * 0.96).toFixed(5)), Number((cLng - sLng * 0.82).toFixed(5))],
      [Number((cLat + sLat * 0.7).toFixed(5)), Number((cLng + sLng * 0.9).toFixed(5))],
      [Number((cLat - sLat * 0.18).toFixed(5)), Number((cLng + sLng * 1.06).toFixed(5))],
      [Number((cLat - sLat).toFixed(5)), Number((cLng + sLng * 0.2).toFixed(5))],
      [Number((cLat - sLat * 0.62).toFixed(5)), Number((cLng - sLng * 0.92).toFixed(5))],
      [Number((cLat + sLat * 0.22).toFixed(5)), Number((cLng - sLng * 1.04).toFixed(5))],
    ] as Array<[number, number]>;
  });

  return {
    id: `project-${index + 1}`,
    code: item[7],
    name: item[4],
    regionId: item[0],
    city: item[1],
    county: item[2],
    town: item[3],
    area,
    investment,
    year: "2026",
    status: item[5],
    progress: item[6],
    constructionUnit: `${item[2]}农田建设发展有限公司`,
    supervisionUnit: `${item[1]}农田工程监理中心`,
    issueCount: 3 + (index % 5),
    rectifiedCount: 2 + (index % 4),
    fundsPaid: Number((investment * (item[6] / 100) * 0.92).toFixed(0)),
    points: `${x},${y} ${x + width},${y - 12} ${x + width + 24},${y + height} ${x + 72},${y + height + 28} ${x - 18},${y + height - 8}`,
    center: { x: x + width / 2, y: y + height / 2 },
    latLng,
    path: [
      [latLng[0] + dLat, latLng[1] - dLng],
      [latLng[0] + dLat * 0.72, latLng[1] + dLng * 0.72],
      [latLng[0] - dLat * 0.55, latLng[1] + dLng],
      [latLng[0] - dLat, latLng[1] - dLng * 0.35],
      [latLng[0] + dLat * 0.15, latLng[1] - dLng],
    ],
    parcelPaths,
  };
});

export const facilityPoints: FacilityPoint[] = highStandardProjects.flatMap((project, index) => [
  { id: `facility-${index}-1`, projectId: project.id, type: "泵站", name: `${project.town}一号灌溉泵站`, status: project.status === "整改中" ? "待整改" : "正常", x: project.center.x - 26, y: project.center.y - 20, latLng: [project.latLng[0] - 0.012, project.latLng[1] - 0.014] },
  { id: `facility-${index}-2`, projectId: project.id, type: "机耕桥", name: `${project.town}生产桥`, status: project.status === "建设中" ? "施工中" : "正常", x: project.center.x + 38, y: project.center.y + 16, latLng: [project.latLng[0] + 0.008, project.latLng[1] + 0.018] },
  { id: `facility-${index}-3`, projectId: project.id, type: index % 2 ? "田间道路" : "渠系工程", name: `${project.town}${index % 2 ? "田间主路" : "斗渠工程"}`, status: "正常", x: project.center.x + 6, y: project.center.y + 44, latLng: [project.latLng[0] - 0.018, project.latLng[1] + 0.006] },
]);

export const devicePoints: DevicePoint[] = highStandardProjects.flatMap((project, index) => [
  { id: `device-${index}-1`, projectId: project.id, type: "摄像头", name: `${project.town}现场视频点`, status: index % 5 === 0 ? "离线" : "在线", x: project.center.x - 48, y: project.center.y + 34, latLng: [project.latLng[0] + 0.016, project.latLng[1] - 0.02], value: "施工现场画面正常", time: "2026-06-05 09:32" },
  { id: `device-${index}-2`, projectId: project.id, type: "墒情设备", name: `${project.town}墒情监测站`, status: index % 4 === 0 ? "预警" : "在线", x: project.center.x + 52, y: project.center.y - 34, latLng: [project.latLng[0] + 0.019, project.latLng[1] + 0.024], value: `土壤含水率 ${18 + index * 2}% / 温度 ${22 + index}℃`, time: "2026-06-05 09:30" },
  { id: `device-${index}-3`, projectId: project.id, type: "虫情设备", name: `${project.town}虫情测报灯`, status: index % 3 === 0 ? "预警" : "在线", x: project.center.x + 18, y: project.center.y - 58, latLng: [project.latLng[0] - 0.014, project.latLng[1] + 0.026], value: `诱捕数量 ${36 + index * 11} 头 / 风险${index % 3 === 0 ? "偏高" : "正常"}`, time: "2026-06-05 08:50" },
]);

export function getSupervisionRegionName(regionId: string) {
  return supervisionRegions.find((item) => item.id === regionId)?.name ?? "安徽省";
}

export function getSupervisionChildRegions(regionId: string) {
  return supervisionRegions.filter((item) => item.parentId === regionId);
}

export function getSupervisionParentRegion(regionId: string) {
  const region = supervisionRegions.find((item) => item.id === regionId);
  return region?.parentId ?? "anhui";
}

export function filterSupervisionProjects(regionId: string, keyword = "") {
  const region = supervisionRegions.find((item) => item.id === regionId);
  const cityChildren = getSupervisionChildRegions(regionId).map((item) => item.id);
  const matchRegion = (project: HighStandardProject) => {
    if (regionId === "anhui") return true;
    if (project.regionId === regionId) return true;
    if (region?.level === "city") return cityChildren.includes(project.regionId);
    return false;
  };
  const normalized = keyword.trim();
  return highStandardProjects.filter((project) => matchRegion(project) && (!normalized || project.name.includes(normalized) || project.code.includes(normalized) || project.county.includes(normalized)));
}

export function buildSupervisionStats(items: HighStandardProject[]) {
  const area = items.reduce((sum, item) => sum + item.area, 0);
  const investment = items.reduce((sum, item) => sum + item.investment, 0);
  const paid = items.reduce((sum, item) => sum + item.fundsPaid, 0);
  const issues = items.reduce((sum, item) => sum + item.issueCount, 0);
  const rectified = items.reduce((sum, item) => sum + item.rectifiedCount, 0);
  const progress = items.length ? items.reduce((sum, item) => sum + item.progress, 0) / items.length : 0;

  return {
    count: items.length,
    area,
    investment,
    paid,
    issues,
    rectified,
    progress: Number(progress.toFixed(1)),
    rectificationRate: issues ? Number(((rectified / issues) * 100).toFixed(1)) : 0,
  };
}

export function projectStatusColor(status: ProjectStatus) {
  if (status === "已完工") return "#10b981";
  if (status === "待验收") return "#f59e0b";
  if (status === "整改中") return "#ef4444";
  return "#3b82f6";
}

export function facilityColor(type: FacilityType) {
  if (type === "泵站") return "#0ea5e9";
  if (type === "机耕桥") return "#8b5cf6";
  if (type === "田间道路") return "#f97316";
  return "#14b8a6";
}

export const defaultSupervisionLayers: SupervisionLayers = {
  projects: true,
  facilities: true,
  cameras: true,
  moisture: true,
  insects: true,
  boundary: true,
};
