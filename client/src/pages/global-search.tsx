
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "wouter";

export default function GlobalSearchResults() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const q = params.get("q") || "";

  const query = useQuery({
    queryKey: ["/api/search", q],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      return res.json();
    },
    enabled: !!q,
  });

  if (!q) return <div className="text-center text-muted-foreground py-12">Enter a search term</div>;
  if (query.isLoading) return <Skeleton className="h-64" />;

  const { visa = [], flights = [], cabs = [] } = query.data || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold" data-testid="text-page-title">Search Results for "{q}"</h1>

      {flights.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2"><CardTitle className="text-lg">Flights</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Phone</TableHead><TableHead>Sector</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>{flights.map((f: any) => (
                <TableRow key={f.id}><TableCell>{f.clientName}</TableCell><TableCell>{f.clientPhone}</TableCell><TableCell>{f.sector}</TableCell><TableCell>{f.travelDate}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {cabs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2"><CardTitle className="text-lg">Cab Bookings</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Phone</TableHead><TableHead>Pickup</TableHead><TableHead>Drop</TableHead></TableRow></TableHeader>
              <TableBody>{cabs.map((c: any) => (
                <TableRow key={c.id}><TableCell>{c.clientName}</TableCell><TableCell>{c.clientPhone}</TableCell><TableCell>{c.pickupLocation}</TableCell><TableCell>{c.dropLocation}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {visa.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2"><CardTitle className="text-lg">Visa Applications</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Passport</TableHead><TableHead>Phone</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
              <TableBody>{visa.map((v: any) => (
                <TableRow key={v.id}><TableCell>{v.clientName}</TableCell><TableCell>{v.passportNumber}</TableCell><TableCell>{v.phone}</TableCell><TableCell>{v.visaType}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {flights.length === 0 && cabs.length === 0 && visa.length === 0 && (
        <div className="text-center text-muted-foreground py-12" data-testid="text-no-results">No results found for "{q}"</div>
      )}
    </div>
  );
}
