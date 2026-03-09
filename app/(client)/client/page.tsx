import { KpiCard } from '@/components/kpi-card';
export default function ClientDashboardPage(){return <section className="grid gap-4 sm:grid-cols-2"><KpiCard kpi={{label:'My Orders',value:'3'}} /><KpiCard kpi={{label:'Pending Deliveries',value:'1'}} /></section>}
