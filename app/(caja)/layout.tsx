import NavBar from "@/components/NavBar";

export default function CajaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
