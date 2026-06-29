export interface DashboardMetrics {
  livrosDisponiveis: number
  livrosEmprestados: number
  emAtraso: number
  membrosCadastrados: number
}

export interface DashboardLoanChartPoint {
  data: string  // 'YYYY-MM-DD'
  total: number
}

export interface DashboardOverdueLoan {
  titulo: string
  nomeCompleto: string
  diasAtraso: number
}

export interface DashboardCategory {
  nome: string
  total: number
  percentual: number
}

export type DashboardActivityType = 'loan' | 'return' | 'member' | 'book'

export interface DashboardActivity {
  type: DashboardActivityType
  title: string
  description: string
  timestamp: string  // ISO string
}

export interface DashboardTodayPending {
  emAtraso: number
  reservasAguardando: number | null  // null = módulo de reservas não implementado
  emprestimosHoje: number
}

export interface DashboardData {
  metrics: DashboardMetrics
  loanChart: DashboardLoanChartPoint[]  // 90 dias; filtro por período feito no cliente
  overdueLoans: DashboardOverdueLoan[]  // top 5 por dias de atraso
  categories: DashboardCategory[]
  activities: DashboardActivity[]       // 10 mais recentes
  todayPending: DashboardTodayPending
}
