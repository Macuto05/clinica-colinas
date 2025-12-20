import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminRedirect } from "@/components/AdminRedirect";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AdminRedirect />
            <DashboardLayout>{children}</DashboardLayout>
        </>
    );
}
