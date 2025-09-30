"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function Hero() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const handleAuthRequiredAction = async (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (isAuthenticated) {
      router.push(path);
    } else {
      router.push("/login");
    }
  };
  return (
    <section className="relative overflow-hidden pt-16">
      {/* BACKGROUND with brand colors */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3C14A6] via-[#3C14A6]/90 to-[#FFA700]/80" />
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="relative z-0 max-w-6xl mx-auto px-4 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
        {/* LEFT: content */}
        <div className="text-white">
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
            Connect, Learn, Grow Together
          </h1>
          <p className="mt-6 text-xl text-white/90">
            Join our mentorship platform where experienced professionals guide the next generation. 
            Track progress, schedule meetings, and leverage AI tools to maximize your mentorship journey.
          </p>
          <div className="mt-8 flex gap-4">
            <button 
              onClick={(e) => handleAuthRequiredAction(e, "/signin")}
              className="px-6 py-3 rounded-lg bg-[#FFA700] text-white font-medium hover:bg-[#FFA700]/90 transition-colors"
            >
              Start Mentoring
            </button>
            <button 
              onClick={(e) => handleAuthRequiredAction(e, "/signin")}
              className="px-6 py-3 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
            >
              Try AI Writer
            </button>
          </div>
        </div>

        {/* RIGHT: Illustration */}
        <div className="flex items-center justify-center">
          <div className="bg-white/95 rounded-2xl p-8 shadow-xl">
            <Image
              src="/logo.svg"
              alt="MentorMatch"
              width={400}
              height={400}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
