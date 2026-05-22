import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RoleRedirect } from "@/components/RoleRedirect";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <RoleRedirect />
            <DashboardLayout>{children}</DashboardLayout>
        </>
    );
}
