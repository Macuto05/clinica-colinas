import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Specialties from "@/components/Specialties";
import About from "@/components/About";
import HealthArticles from "@/components/HealthArticles";
import CorporateValues from "@/components/CorporateValues";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <Hero />
      <Services />
      <Specialties />
      <About />
      <HealthArticles />
      <CorporateValues />
      <Contact />
      <Footer />
    </main>
  );
}
