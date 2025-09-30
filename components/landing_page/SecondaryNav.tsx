import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/logging", label: "Meeting Log" },
  { href: "/analytics", label: "Analytics" },
];

export default function SecondaryNav({ isLoggedIn = false }) {
  if (!isLoggedIn) return null;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-[#3C14A6]">
            MentorMatch
          </Link>
          <div className="flex items-center gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-4 py-2 rounded-lg hover:bg-[#3C14A6]/5 text-sm font-medium text-gray-700 hover:text-[#3C14A6] transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="p-2 rounded-lg hover:bg-[#3C14A6]/5 text-gray-700">
            Profile
          </Link>
        </div>
      </div>
    </nav>
  );
}
