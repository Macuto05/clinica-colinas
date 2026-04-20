import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * SEC-10: Safe BigInt serializer — replaces BigInt.prototype.toJSON mutation.
 * Use this instead of modifying the BigInt prototype globally.
 */
export function serializeBigInt<T>(data: T): T {
    return JSON.parse(
        JSON.stringify(data, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
}

/**
 * CODE-03: Shared age calculation utility.
 * Previously duplicated in doctor/appointments/route.ts and doctor/appointments/[id]/route.ts
 */
export function calculateAge(birthday: Date): number {
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/**
 * CODE-05: Shared time formatting utility.
 * Formats a Date's time portion as "HH:MM AM/PM" using UTC hours.
 */
export function formatTimeAMPM(date: Date): string {
    const d = new Date(date);
    const hours = d.getUTCHours();
    const minutes = d.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHour = hours % 12 || 12;
    return `${formattedHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}
