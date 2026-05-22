import CajaLayout from "./CajaLayout";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <CajaLayout>{children}</CajaLayout>;
}
