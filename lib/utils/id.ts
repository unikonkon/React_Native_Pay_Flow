export function generateId(): string {
  const hex = '0123456789abcdef';
  const s = (n: number) => {
    let str = '';
    for (let i = 0; i < n; i++) str += hex[Math.floor(Math.random() * 16)];
    return str;
  };
  return `${s(8)}-${s(4)}-4${s(3)}-${hex[8 + Math.floor(Math.random() * 4)]}${s(3)}-${s(12)}`;
}
