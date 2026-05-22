import MedicoLayout from "./MedicoLayout";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <MedicoLayout>{children}</MedicoLayout>;
}
