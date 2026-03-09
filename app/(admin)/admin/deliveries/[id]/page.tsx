import { DeliveryTimeline } from '@/components/delivery-timeline';
import { deliveryTimeline } from '@/lib/mock-data';
export default function DeliveryDetailPage(){return <DeliveryTimeline events={deliveryTimeline} />}
