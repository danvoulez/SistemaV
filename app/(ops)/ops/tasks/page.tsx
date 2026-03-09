import { requireMemberOrAdmin } from '@/lib/auth';
import { getTasks } from '@/services/tasks';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { CheckSquare, Calendar, User } from 'lucide-react';
import { TaskStatusButton } from './task-status-button';

interface TaskColumn {
  key: string;
  label: string;
  headerColor: string;
}

const COLUMNS: TaskColumn[] = [
  { key: 'todo', label: 'A Fazer', headerColor: 'bg-slate-100 text-slate-700' },
  { key: 'in_progress', label: 'Em Progresso', headerColor: 'bg-blue-100 text-blue-700' },
  { key: 'blocked', label: 'Bloqueado', headerColor: 'bg-red-100 text-red-700' },
  { key: 'done', label: 'Concluído', headerColor: 'bg-emerald-100 text-emerald-700' },
];

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export default async function OpsTasksPage() {
  const user = await requireMemberOrAdmin();

  const tasks = await getTasks(user.tenantId);

  const grouped = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks
      .filter((t) => t.status === col.key)
      .sort((a, b) => (PRIORITY_ORDER[a.priority ?? 'medium'] ?? 2) - (PRIORITY_ORDER[b.priority ?? 'medium'] ?? 2)),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarefas"
        description={`${tasks.length} tarefa(s) no total.`}
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa"
          description="Não há tarefas cadastradas para este tenant."
          icon={CheckSquare}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {grouped.map((col) => (
            <div key={col.key} className="space-y-3">
              <div className={`rounded-lg px-3 py-2 flex items-center justify-between ${col.headerColor}`}>
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="text-xs font-medium opacity-75">{col.tasks.length}</span>
              </div>

              {col.tasks.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                  Sem tarefas
                </div>
              ) : (
                col.tasks.map((task) => {
                  const assignee = (task as any).assignee;
                  const isOverdue =
                    task.due_date &&
                    task.status !== 'done' &&
                    new Date(task.due_date) < new Date();

                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-slate-900 leading-snug">{task.title}</p>
                        <StatusBadge status={task.priority ?? 'medium'} />
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {assignee && (
                          <span className="flex items-center gap-1">
                            <User size={11} />
                            {assignee.full_name}
                          </span>
                        )}
                        {task.due_date && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                            <Calendar size={11} />
                            {new Date(task.due_date).toLocaleDateString('pt-BR')}
                            {isOverdue && ' (atrasado)'}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <TaskStatusButton taskId={task.id} currentStatus={task.status} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
