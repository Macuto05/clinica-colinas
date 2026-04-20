/**
 * PageLoader — Reusable loading spinner component for Clínica Colinas
 *
 * Matches the spinner style from "Mis Visitas" page (circular lime ring + label).
 * Use this everywhere a loading state is needed in the system.
 *
 * Props:
 *  - message?   : string  — Label shown below the spinner (default: "Cargando...")
 *  - fullPage?  : boolean — If true, renders a fixed full-screen overlay
 *  - minHeight? : string  — Tailwind min-height class for the container (default: "min-h-[400px]")
 */

interface PageLoaderProps {
    /** Text shown below the spinner */
    message?: string;
    /** When true, renders a fixed full-screen overlay (e.g. during form submission) */
    fullPage?: boolean;
    /** Tailwind min-height class applied to the wrapper when fullPage is false */
    minHeight?: string;
}

export function PageLoader({
    message = "Cargando...",
    fullPage = false,
    minHeight = "min-h-[400px]",
}: PageLoaderProps) {
    if (fullPage) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in duration-200">
                <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] px-12 py-10 shadow-[0_8px_40px_0_rgba(0,0,0,0.10)] border border-white/60 flex flex-col items-center gap-5">
                    <Spinner />
                    <p className="font-black text-gray-500 text-[11px] uppercase tracking-[0.2em]">
                        {message}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex flex-col items-center justify-center gap-4 w-full bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/50 ${minHeight}`}
        >
            <Spinner />
            <p className="font-black text-gray-500 text-[11px] uppercase tracking-[0.2em]">
                {message}
            </p>
        </div>
    );
}

/** Internal spinner — 40px circular lime ring matching site palette */
function Spinner() {
    return (
        <div className="relative w-10 h-10">
            {/* Track ring */}
            <div className="absolute inset-0 rounded-full border-4 border-lime-200" />
            {/* Animated accent ring */}
            <div className="absolute inset-0 rounded-full border-4 border-t-lime-600 animate-spin" />
        </div>
    );
}
