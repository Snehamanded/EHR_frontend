import { Badge } from '@/app/components/ui/badge';

export function StatusBadge({ status, type = 'default' }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'paid':
      case 'delivered':
        return 'bg-green-500';
      case 'pending':
      case 'processing':
      case 'in_progress':
        return 'bg-yellow-500';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-500';
      case 'sample_collected':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const colorClass = type === 'priority' ? getPriorityColor(status) : getStatusColor(status);

  return (
    <Badge className={colorClass}>
      {status}
    </Badge>
  );
}