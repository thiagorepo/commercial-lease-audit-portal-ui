import { Link, useParams } from 'react-router-dom';
import { Building2, MapPin, FileText, Maximize } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { portfolios, properties } from '@/data/mock';

export function PortfoliosPage() {
  return (
    <div>
      <PageHeader title="Portfolios" breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Portfolios' }]} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {portfolios.map(p => (
          <Link key={p.id} to={`/portfolios/${p.id}`}
            className="bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all p-6 group">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground/70">{new Date(p.createdAt).getFullYear()}</span>
            </div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-1">{p.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{p.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{p.propertyCount}</p>
                <p className="text-xs text-muted-foreground">Properties</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{p.leaseCount}</p>
                <p className="text-xs text-muted-foreground">Leases</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{(p.totalSqFt / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Sq Ft</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PortfolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const portfolio = portfolios.find(p => p.id === id) ?? null;

  if (!portfolio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-muted-foreground text-lg font-medium">Portfolio not found</p>
        <a href="/dashboard/portfolios" className="text-primary hover:underline text-sm">Back to Portfolios</a>
      </div>
    );
  }

  const portfolioProperties = properties.filter(p => p.portfolioId === portfolio.id);

  return (
    <div>
      <PageHeader
        title={portfolio.name}
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Portfolios', href: '/portfolios' }, { label: portfolio.name }]}
      />
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Properties', value: portfolio.propertyCount, icon: Building2 },
            { label: 'Leases', value: portfolio.leaseCount, icon: FileText },
            { label: 'Total Sq Ft', value: portfolio.totalSqFt.toLocaleString(), icon: Maximize },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border shadow-card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Properties</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {portfolioProperties.map(p => (
              <Link key={p.id} to={`/properties/${p.id}`} className="bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-shadow p-4 group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-muted-foreground/70 group-hover:text-primary/70 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}, {p.state}</p>
                  </div>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>{p.leaseCount} leases</span>
                  <span>·</span>
                  <span>{p.totalSqFt.toLocaleString()} sq ft</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
