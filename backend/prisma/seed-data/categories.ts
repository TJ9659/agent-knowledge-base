export const categories = [
  'Billing & Payments',
  'Account & Security',
  'Technical Support',
  'Plans & Orders',
  'Customer Handling',
  'Policies',
] as const;

export type CategoryName = (typeof categories)[number];
