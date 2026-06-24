// Minimal mock data for dashboard - will be replaced with Prisma queries in Sprint 1
export const dashboardStats = [
  {
    id: 'available-books',
    title: 'Livros Disponíveis',
    value: 0,
    icon: 'BookOpen',
    color: 'from-blue-500 to-blue-600',
    lightColor: 'bg-blue-50 dark:bg-blue-950',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'loaned-books',
    title: 'Livros Emprestados',
    value: 0,
    icon: 'BookMarked',
    color: 'from-purple-500 to-purple-600',
    lightColor: 'bg-purple-50 dark:bg-purple-950',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'overdue-books',
    title: 'Em Atraso',
    value: 0,
    icon: 'AlertCircle',
    color: 'from-orange-500 to-orange-600',
    lightColor: 'bg-orange-50 dark:bg-orange-950',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'members',
    title: 'Membros',
    value: 0,
    icon: 'Users',
    color: 'from-green-500 to-green-600',
    lightColor: 'bg-green-50 dark:bg-green-950',
    textColor: 'text-green-600 dark:text-green-400',
  },
]
