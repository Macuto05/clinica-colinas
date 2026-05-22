import RecepcionLayout from "./RecepcionLayout";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <RecepcionLayout>{children}</RecepcionLayout>;
}
