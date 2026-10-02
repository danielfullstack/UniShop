export function formatPEN(amount) {
  const value = Number(amount);
  const safeValue = Number.isFinite(value) ? value : 0;
  const formattedValue = safeValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `S/ ${formattedValue}`;
}
