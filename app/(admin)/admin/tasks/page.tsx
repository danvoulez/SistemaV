import { Plus, CalendarDays, User } from 'lucide-react';
import { getAuthUser } from '@/lib/auth';
import { getTasks } from '@/services/tasks';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Btn } from '@/components/btn';

const COLUMNS = [
  { key: 'todo', label: 'A Fazer' },
  { key: 'in_progress', label: 'Em Progresso' },
  { key: 'blocked', label: 'Bloqueado' },
  { key: 'done', label: 'Concluído' },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  low: 'border-l-slate-300',
  medium: 'border-l-yellow-400',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-600',
};

export default async function TasksPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const tasks = await getTasks(user.tenantId);

  const tasksByStatus = Object.fromEntries(
    COLUMNS.map((col) => [col.key, tasks.filter((t) => t.status === col.key)])
  ) as Record<string, typeof tasks>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarefas"
        description="Kanban de tarefas da equipe"
        action={
          <Btn href="/admin/tasks/new" icon={Plus}>
            Nova Tarefa
          </Btn>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus[col.key] ?? [];
          return (
            <div key={col.key} className="flex flex-col gap-3">
              {/* Column header */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">{col.label}</h2>
                <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                  {colTasks.length}
                </span>
              </div>

              {/* Task cards */}
              <div className="flex flex-col gap-2 min-h-[120px]">
                {colTasks.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                    Sem tarefas
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const assignee = (task as { assignee?: { full_name?: string } }).assignee;
                    const priorityBorder = PRIORITY_COLORS[task.priority ?? 'medium'] ?? 'border-l-slate-300';
                    return (
                      <div
                        key={task.id}
                        className={`rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 ${priorityBorder} space-y-2`}
                      >
                        <p className="text-sm font-medium text-slate-900 leading-snug">{task.title}</p>
                        <div className="flex items-center justify-between gap-2">
                          <StatusBadge status={task.priority ?? 'medium'} />
                        </div>
                        <div className="flex flex-col gap-1">
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <CalendarDays size={11} />
                              <span>{new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                          {assignee?.full_name && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <User size={11} />
                              <span>{assignee.full_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
