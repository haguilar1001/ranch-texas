import NavBar from "@/components/NavBar";

export default function ControlLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
