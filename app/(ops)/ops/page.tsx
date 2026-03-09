import { KpiCard } from '@/components/kpi-card';
import { dashboardKpis } from '@/lib/mock-data';
export default function OpsDashboardPage(){return <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{dashboardKpis.slice(0,6).map((k)=> <KpiCard key={k.label} kpi={k} />)}</section>}
