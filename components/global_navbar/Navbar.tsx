"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "/logging", label: "Meeting Log" },
  { href: "/scheduler", label: "Scheduler" },
  { href: "/analytics", label: "Analytics" },
  { href: "/match", label: "Match" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoggedInPage =
    pathname === "/logging" ||
    pathname === "/dashboard" ||
    pathname === "/profile";

  useEffect(() => {
    // Check if user is logged in and get their role
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Fetch user role from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setUserRole(profile?.role || null);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error getting user:", error);
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user role when auth state changes
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          setUserRole(profile?.role || null);
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="w-full border-b bg-white backdrop-blur relative z-50 h-16 flex items-center">
      <div className="max-w-6xl mx-auto w-full px-4 flex items-center justify-between">
        {/* NGO logo + name */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-purple-500 rounded flex items-center justify-center text-white font-bold text-sm">
            W
          </div>
          <span className="font-semibold tracking-tight">
            Mentorship Platform
          </span>
        </Link>

        {/* CENTER: Navigation Links - only show when logged in */}
        {user && (
          <nav className="hidden md:flex items-center space-x-8">
            {navigationLinks
              .filter((link) => {
                // Hide Analytics and Match links for non-admin users
                if ((link.href === '/analytics' || link.href === '/match') && userRole !== 'admin') {
                  return false;
                }
                return true;
              })
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "text-[#3C14A6]"
                      : "text-gray-600 hover:text-[#3C14A6]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
          </nav>
        )}

        {/* RIGHT: auth actions - show based on authentication state */}
        <nav className="flex items-center gap-3 text-sm">
          {loading ? (
            // Show loading state
            <div className="w-6 h-6 border-2 border-[#3C14A6] border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            // User is logged in - show logout and profile
            <>
              <Link
                href="/profile"
                className="text-gray-600 hover:text-[#3C14A6] transition-colors"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-[#3C14A6] text-[#3C14A6] hover:bg-[#3C14A6]/5 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            // User is not logged in - show sign in/sign up
            <>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg border border-[#3C14A6] text-[#3C14A6] hover:bg-[#3C14A6]/5 transition-colors"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-[#3C14A6] text-white hover:bg-[#3C14A6]/90 transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}