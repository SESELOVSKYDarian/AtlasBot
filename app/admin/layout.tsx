import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div>
            <div className="font-semibold">Atlas • Dashboard</div>
            <div className="text-xs text-zinc-500">
              Horarios • Bloqueos • Turnos
            </div>
          </div>
          <nav className="flex gap-2 text-sm">
            <NavLink href="/admin">Inicio</NavLink>
            <NavLink href="/admin#horarios">Horarios</NavLink>
            <NavLink href="/admin#bloqueos">Bloqueos</NavLink>
            <NavLink href="/admin#turnos">Turnos</NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl px-3 py-1.5 hover:bg-zinc-100 text-zinc-700"
    >
      {children}
    </Link>
  );
}
