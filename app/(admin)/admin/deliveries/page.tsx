import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
export default function DeliveriesPage(){return <DataTable headers={['Delivery','Order','Status']} rows={[["DEL-001","SO-001",<StatusBadge key='d' status='in_transit'/>]]} />}
