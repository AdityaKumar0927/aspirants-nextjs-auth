import { Card, CardContent } from "@/components/ui/card";

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "500+", label: "Enterprise Clients" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

export function Component() {
  return (
    <section id="stats">
      <div className="container px-4 md:px-6 py-12 md:py-24">
        <div className="text-center space-y-4 py-6 mx-auto">
          <h2 className="text-[14px] text-primary font-mono font-medium tracking-tight">
            Our Achievements
          </h2>
          <h4 className="text-[42px] font-medium mb-2 text-balance max-w-3xl mx-auto tracking-tighter">
            Powering innovation worldwide
          </h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-none shadow-none">
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-bold">{stat.value}</span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
