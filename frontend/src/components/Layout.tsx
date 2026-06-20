import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-full bg-[#0A0A0F] text-white flex">
      {children}
    </div>
  );
}