import Navbar from "@/components/global_navbar/Navbar";
import Hero from "@/components/landing_page/Hero";
import Features from "@/components/landing_page/Feature_1";
import Footer from "@/components/landing_page/Footer";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      
      {/* Always show landing page content */}
      <Hero />
      <section id="features">
        <Features />
      </section>
      <Footer />
    </main>
  );
}
