import { DataTable } from '@/components/data-table';

export default function PeoplePage() {
  return <DataTable headers={['Name', 'Type', 'Email']} rows={[["Ana Client", "individual", "ana@acme.com"],["Beta Corp", "company", "ops@beta.com"]]} />;
}
