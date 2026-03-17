import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, MapPin, Building2, List, Grid2x2 as Grid } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { properties, leases } from '@/data/mock';
import { formatPercent, formatCurrency } from '@/lib/utils';

export function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filtered = properties.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Properties" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/overview' }, { label: 'Properties' }]} />

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search properties..."
            className="w-full border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
        </div>
        <div className="flex gap-1 border border-border rounded-lg p-1">
          <button onClick={() => setView('grid')} className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-accent-foreground'}`}>
            <Grid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-accent-foreground'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <Link key={p.id} to={`/properties/${p.id}`} className="bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-shadow overflow-hidden group">
              <div className="h-36 bg-gradient-to-br from-muted to-muted flex items-center justify-center">
                <Building2 className="w-12 h-12 text-muted-foreground/70 group-hover:text-primary/70 transition-colors" />
              </div>
              <div className="p-4">
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{p.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" />{p.address}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{p.city}, {p.state} {p.zipCode}</p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{p.leaseCount} Leases</span>
                  <span className="text-xs text-muted-foreground">{p.totalSqFt.toLocaleString()} sq ft</span>
                  <span className="text-xs text-muted-foreground">{formatPercent(p.occupancyRate)} occupied</span>
                </div>
                <p className="text-xs text-muted-foreground/70 mt-1">{p.portfolioName}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead className="bg-muted border-b border-border">
              <tr>
                {['Property', 'Location', 'Portfolio', 'Leases', 'Sq Ft', 'Occupancy'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/properties/${p.id}`} className="text-sm font-semibold text-primary hover:text-primary">{p.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{p.city}, {p.state}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{p.portfolioName}</td>
                  <td className="px-5 py-3 text-sm text-foreground/80">{p.leaseCount}</td>
                  <td className="px-5 py-3 text-sm text-foreground/80">{p.totalSqFt.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-foreground/80">{formatPercent(p.occupancyRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const property = properties.find(p => p.id === id);

  if (!property) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Property not found.</p>
        <Link to="/dashboard/properties" className="text-primary hover:text-primary text-sm font-medium mt-2 inline-block">Back to Properties</Link>
      </div>
    );
  }

  const propLeases = leases.filter(l => l.propertyId === property.id);

  return (
    <div>
      <PageHeader
        title={property.name}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/overview' }, { label: 'Properties', href: '/dashboard/properties' }, { label: property.name }]}
      />
      <div className="space-y-6">
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Building2 className="w-8 h-8 text-muted-foreground/70" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{property.name}</h2>
              <p className="text-sm text-muted-foreground">{property.address}, {property.city}, {property.state} {property.zipCode}</p>
              <Link to={`/portfolios/${property.portfolioId}`} className="text-sm text-primary hover:text-primary font-medium mt-1 inline-block">{property.portfolioName}</Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-border/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{property.leaseCount}</p>
              <p className="text-xs text-muted-foreground">Total Leases</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{property.totalSqFt.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Sq Ft</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{formatPercent(property.occupancyRate)}</p>
              <p className="text-xs text-muted-foreground">Occupancy Rate</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground">Associated Leases</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
            <thead className="bg-muted border-b border-border/50">
              <tr>
                {['Lease #', 'Tenant', 'Base Rent', 'CAM Type', 'Term End', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {propLeases.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-sm text-muted-foreground/70 text-center">No leases associated with this property.</td></tr>
              ) : propLeases.map(l => (
                <tr key={l.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/leases/${l.id}`} className="text-sm font-semibold text-primary hover:text-primary">{l.leaseNumber}</Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-foreground/80">{l.tenantName}</td>
                  <td className="px-5 py-3 text-sm text-foreground/80">{formatCurrency(l.baseRent)}/yr</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground capitalize">{l.camType.replace(/-/g, ' ')}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{new Date(l.termEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-5 py-3"><StatusBadge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}
