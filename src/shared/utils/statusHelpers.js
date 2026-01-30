export const getStatusColor = (status) => {
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

export const getPriorityColor = (priority) => {
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

export const getRoleBadgeColor = (role) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-500';
    case 'doctor':
      return 'bg-blue-500';
    case 'staff':
      return 'bg-green-500';
    case 'lab':
      return 'bg-yellow-500';
    case 'pharmacy':
      return 'bg-orange-500';
    case 'receptionist':
      return 'bg-pink-500';
    case 'patient':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};