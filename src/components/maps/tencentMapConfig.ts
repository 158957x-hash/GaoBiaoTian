const tencentMapKey = import.meta.env.VITE_TENCENT_MAP_KEY?.trim();

export function getTencentMapKey() {
  return tencentMapKey;
}

export function hasTencentMapKey() {
  return Boolean(tencentMapKey);
}
