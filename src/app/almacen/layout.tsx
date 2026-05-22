import AlmacenLayout from "./AlmacenLayout";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <AlmacenLayout>{children}</AlmacenLayout>;
}
