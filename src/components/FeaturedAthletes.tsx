import { AthleteCard } from "./AthleteCard";
import { mockAthletes } from "@/data/mockAthletes";

export const FeaturedAthletes = () => {
  const featured = mockAthletes.slice(0, 3);

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Atletas em Destaque</h2>
          <p className="text-xl text-muted-foreground">
            Os tokens mais negociados do momento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((athlete) => (
            <AthleteCard key={athlete.id} athlete={athlete} />
          ))}
        </div>
      </div>
    </section>
  );
};
