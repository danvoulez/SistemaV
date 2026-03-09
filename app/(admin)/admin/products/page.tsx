import { DataTable } from '@/components/data-table';
export default function ProductsPage(){return <DataTable headers={['Product','SKU','Price']} rows={[["Widget A","WID-A","120.00"],["Widget B","WID-B","80.00"]]} />}
