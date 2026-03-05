export function formatCurrency(amount: number, currency = 'THB'): string {
  const symbol = currency === 'THB' ? '฿' : currency;
  return `${symbol}${amount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function parseCurrencyInput(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}
