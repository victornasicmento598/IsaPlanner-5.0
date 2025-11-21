import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Task, TaskType } from '../types';

interface DashboardChartsProps {
  tasks: Task[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.isCompleted).length;
  const pending = total - completed;

  const pieData = total > 0 
    ? [
        { name: 'Concluídos', value: completed },
        { name: 'Pendentes', value: pending },
      ]
    : [
        { name: 'Pendentes', value: 1 } // Show a full "Pending" circle if no tasks
      ];

  const COLORS = ['#4ade80', '#d946ef']; // Green, Fuchsia

  const exams = tasks.filter(t => t.type === TaskType.EXAM).length;
  const works = tasks.filter(t => t.type !== TaskType.EXAM).length;

  return (
    <div className="w-full h-full bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col">
        <h3 className="text-sm font-bold text-pink-200/60 uppercase text-center">Seu Progresso</h3>
        
        <div className="flex-1 w-full relative my-2 min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={pieData.filter(d => d.value > 0)} // Only render slices with value
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    fill="#8884d8"
                    paddingAngle={total > 1 && completed > 0 && pending > 0 ? 5 : 0}
                    dataKey="value"
                    stroke="none"
                >
                    {pieData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Concluídos' ? COLORS[0] : COLORS[1]} />
                    ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#2e1065', border: '1px solid #d946ef55', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                />
                </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-white">{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
            </div>
        </div>

        <div className="flex justify-center items-center gap-4 text-xs mb-3 text-pink-200/80">
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[0] }}></div>
                <span>Concluídos</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[1] }}></div>
                <span>Pendentes</span>
            </div>
        </div>
        
        <div className="flex justify-between text-xs px-2 text-pink-200/60 border-t border-white/10 pt-3">
            <span className="flex items-center gap-1.5">🏆 {exams} Provas</span>
            <span className="flex items-center gap-1.5">📝 {works} Tarefas</span>
        </div>
    </div>
  );
};
