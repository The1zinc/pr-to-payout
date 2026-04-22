import { formatUnits } from "viem";

export function formatAddress(address: string) {
  if (!address) {
    return "Unconnected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatGen(amount: string | bigint) {
  let value: bigint;
  try {
    value = typeof amount === "bigint" ? amount : BigInt(amount || 0);
  } catch {
    return "— GEN";
  }
  const raw = formatUnits(value, 18);
  const [whole, fraction = ""] = raw.split(".");
  const compactFraction = fraction.slice(0, 2).replace(/0+$/, "");
  const wholeNumber = Number(whole || "0");
  const wholeLabel = Number.isFinite(wholeNumber)
    ? new Intl.NumberFormat("en-US").format(wholeNumber)
    : whole;

  return `${wholeLabel}${compactFraction ? `.${compactFraction}` : ""} GEN`;
}

export function formatTimestamp(timestamp: string | null) {
  if (!timestamp || timestamp === "0") {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(Number(timestamp) * 1000));
}

export function toDateTimeLocalInput(timestamp: string | null) {
  if (!timestamp || timestamp === "0") {
    return "";
  }

  const date = new Date(Number(timestamp) * 1000);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}
