import FarmaciaLayout from "./FarmaciaLayout";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <FarmaciaLayout>{children}</FarmaciaLayout>;
}
