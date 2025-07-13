
// Fallback utility for children data when the children table is not accessible
export const getChildrenFallbackData = () => [
  { id: '1', name: 'Anak Pertama', class_name: 'Kelas 1A' },
  { id: '2', name: 'Anak Kedua', class_name: 'Kelas 2B' }
];

export const getSelectedChildName = (childId: string) => {
  const children = getChildrenFallbackData();
  const child = children.find(c => c.id === childId);
  return child ? `${child.name} - ${child.class_name}` : 'Unknown Child';
};
