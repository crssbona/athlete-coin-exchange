import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeaturedAthletes } from "@/components/FeaturedAthletes";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <FeaturedAthletes />
    </div>
  );
};

export default Index;
