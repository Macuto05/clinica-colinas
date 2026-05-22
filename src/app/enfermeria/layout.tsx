import EnfermeriaLayout from "./EnfermeriaLayout";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <EnfermeriaLayout>{children}</EnfermeriaLayout>;
}
