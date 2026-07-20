import { Shield } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-neon to-neon-deep shadow-glow">
            <Shield size={26} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-ink">Warfire Leidorasga</h1>
          <p className="text-xs uppercase tracking-widest text-ink-faint">Guild Control Center</p>
        </div>
        <div className="glass-panel p-6">{children}</div>
      </div>
    </div>
  );
}
