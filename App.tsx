import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskType, Subject, TYPE_ICONS, SUBJECT_COLORS, SUBJECT_ABBREVIATIONS } from './types';
import { TaskCard } from './components/TaskCard';
import { NewTaskModal } from './components/NewTaskModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { DashboardCharts } from './components/DashboardCharts';
import { generateStudyPlan, getMotivationalQuote } from './services/geminiService';
import { subscribeToTasks, saveTask, deleteTask, toggleTaskCompletion, updateAiPlan } from './services/api';
import { Plus, CalendarDays, BookOpen, Library, Sparkles, Rocket, Filter, Search, XCircle, Flame } from 'lucide-react';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  
  const [typeFilter, setTypeFilter] = useState<'ALL' | TaskType>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<'ALL' | Subject>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [quote, setQuote] = useState<string>('');
  
  const filterRef = React.useRef<HTMLDivElement>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Real-time listener for tasks (Abstraction handles Firebase vs LocalStorage)
  useEffect(() => {
    const unsubscribe = subscribeToTasks((data) => {
      setTasks(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    getMotivationalQuote().then(setQuote);
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'isCompleted'> | Task) => {
    await saveTask(taskData);
    handleCloseModal();
  };

  const handleEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };
  
  const handleAddNew = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTaskToEdit(null);
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
        await toggleTaskCompletion(id, task.isCompleted);
    }
  };

  const requestDeleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if(task) {
        setTaskToDelete(task);
        setIsConfirmModalOpen(true);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    await deleteTask(taskToDelete);
    setIsConfirmModalOpen(false);
    setTaskToDelete(null);
  };

  const handleGenerateAI = async (task: Task) => {
    if (!task.examContent) return;
    if (task.aiStudyPlan) return; // Don't regenerate if plan exists
    setGeneratingId(task.id);
    const plan = await generateStudyPlan(task.subject, task.examContent, task.date);
    await updateAiPlan(task.id, plan);
    setGeneratingId(null);
  };

  const areFiltersActive = typeFilter !== 'ALL' || subjectFilter !== 'ALL' || searchTerm.trim() !== '';

  const clearFilters = () => {
      setTypeFilter('ALL'); 
      setSubjectFilter('ALL');
      setSearchTerm('');
      setIsFilterPopoverOpen(false);
  }

  const getTaskStatus = (task: Task): { priority: number, date: Date } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.date + 'T12:00:00');
    taskDate.setHours(0, 0, 0, 0);

    if (task.isCompleted) return { priority: 3, date: taskDate };
    if (taskDate < today) return { priority: 0, date: taskDate }; // Overdue
    if (taskDate.getTime() === today.getTime()) return { priority: 1, date: taskDate }; // Due today
    return { priority: 2, date: taskDate }; // Upcoming
  };
  
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        const typeMatch = typeFilter === 'ALL' || task.type === typeFilter;
        const subjectMatch = subjectFilter === 'ALL' || task.subject === subjectFilter;
        const searchTermLower = searchTerm.toLowerCase();
        const searchMatch = searchTerm.trim() === '' ||
          task.title.toLowerCase().includes(searchTermLower) ||
          (task.description && task.description.toLowerCase().includes(searchTermLower)) ||
          (task.examContent && task.examContent.toLowerCase().includes(searchTermLower));
        return typeMatch && subjectMatch && searchMatch;
      })
      .sort((a, b) => {
        const statusA = getTaskStatus(a);
        const statusB = getTaskStatus(b);
        if (statusA.priority !== statusB.priority) {
          return statusA.priority - statusB.priority;
        }
        return statusA.date.getTime() - statusB.date.getTime();
      });
  }, [tasks, typeFilter, subjectFilter, searchTerm]);

  const overdueTasks = tasks.filter(t => !t.isCompleted && getTaskStatus(t).priority === 0);
  const upcomingTasks = tasks.filter(t => !t.isCompleted && new Date(t.date) >= new Date(new Date().setHours(0,0,0,0))).slice(0, 3);

  const filterDisplay: Record<string, { icon: string, label: string }> = {
    'ALL': { icon: '📋', label: 'Tudo' },
    [TaskType.HOMEWORK]: { icon: TYPE_ICONS[TaskType.HOMEWORK], label: TaskType.HOMEWORK },
    [TaskType.PROJECT]: { icon: TYPE_ICONS[TaskType.PROJECT], label: TaskType.PROJECT },
    [TaskType.EXAM]: { icon: TYPE_ICONS[TaskType.EXAM], label: TaskType.EXAM },
  };
  
  return (
    <div className="min-h-screen text-white overflow-x-hidden bg-gradient-to-br from-[#19052b] via-[#380c5e] to-[#19052b]">
      
      <header className="sticky top-0 z-40 bg-[#19052b]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Rocket size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400">
                IsaPlanner 5.0
              </h1>
              <p className="text-xs text-pink-200/60 font-medium">Organizando o futuro</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 text-sm text-pink-200/70 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span>📅 {new Date().toLocaleString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="md:col-span-2 bg-gradient-to-r from-pink-900/40 to-violet-900/40 rounded-3xl p-8 border border-pink-500/20 relative overflow-hidden group hover:border-pink-500/40 transition-colors">
             <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
             
             <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                Olá, Isabelle! <span className="text-2xl animate-wave origin-bottom-right">👋</span>
             </h2>
             <p className="text-pink-100/80 text-lg font-light max-w-xl">
                {quote ? `"${quote}"` : "Pronta para organizar seus estudos hoje?"}
             </p>
             
             <button 
                onClick={handleAddNew}
                className="mt-6 bg-white text-violet-900 hover:bg-pink-50 font-bold py-3 px-6 rounded-full shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
             >
                <Plus size={20} />
                Adicionar Nova Tarefa
             </button>
          </div>

          <div className="h-full">
             <DashboardCharts tasks={tasks} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <aside className="lg:col-span-1 space-y-8">
            {overdueTasks.length > 0 && (
                <div className="bg-red-900/20 rounded-2xl p-6 border border-red-500/30">
                    <h3 className="text-red-300 uppercase text-sm font-bold tracking-wider mb-4 flex items-center gap-2">
                        <Flame size={16} className="text-red-400"/>
                        Atenção, Isa!
                    </h3>
                    <div className="space-y-4">
                        {overdueTasks.map(task => (
                            <div key={task.id} className="flex items-start gap-3 group cursor-pointer">
                                <div className={`w-1 h-full min-h-[40px] rounded-full bg-gradient-to-b ${SUBJECT_COLORS[task.subject] ?? 'from-gray-500 to-gray-600'}`}></div>
                                <div>
                                    <p className="text-sm font-semibold text-red-100 group-hover:text-white transition-colors line-clamp-1">{task.title}</p>
                                    <p className="text-xs text-red-200/70">{new Date(task.date + 'T12:00:00').toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'})} - Atrasado!</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
               <h3 className="text-pink-200/50 uppercase text-sm font-bold tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-400"/>
                  Próximos Eventos
               </h3>
               {upcomingTasks.length > 0 ? (
                   <div className="space-y-4">
                       {upcomingTasks.map(task => (
                           <div key={task.id} className="flex items-start gap-3 group cursor-pointer" onClick={() => {}}>
                               <div className={`w-1 h-full min-h-[40px] rounded-full bg-gradient-to-b ${SUBJECT_COLORS[task.subject] ?? 'from-gray-500 to-gray-600'}`}></div>
                               <div>
                                   <p className="text-sm font-semibold text-pink-100 group-hover:text-pink-400 transition-colors line-clamp-1">{task.title}</p>
                                   <p className="text-xs text-pink-200/50">{new Date(task.date + 'T12:00:00').toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'})}</p>
                               </div>
                           </div>
                       ))}
                   </div>
               ) : (
                   <p className="text-base text-pink-100/90">Nada urgente para os próximos dias! 🎉</p>
               )}
            </div>
          </aside>

          <div className="lg:col-span-3">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <BookOpen size={24} className="text-fuchsia-400"/>
                    Suas Tarefas
                </h2>
                <span className="text-sm text-pink-200/60 font-mono bg-white/5 px-2 py-1 rounded-md border border-white/10">
                    {filteredTasks.length} items
                </span>
             </div>

            {/* NEW Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200/40 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar por palavra-chave..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-11 pr-4 text-white placeholder-pink-200/40 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                    />
                </div>

                <div className="relative" ref={filterRef}>
                     <button 
                        onClick={() => setIsFilterPopoverOpen(prev => !prev)}
                        className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold transition-all border ${
                            areFiltersActive 
                                ? 'bg-pink-500/20 text-pink-300 border-pink-500/50' 
                                : 'bg-white/5 text-pink-200/80 border-white/10 hover:bg-white/10'
                        }`}
                     >
                        <Filter size={16} />
                        Filtros
                        {areFiltersActive && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>}
                     </button>
                     
                     {isFilterPopoverOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-[#2e1065] border border-pink-500/30 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in-0 zoom-in-95 duration-200">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="text-pink-200/50 uppercase text-sm font-bold tracking-wider">
                                    Filtros
                                </h3>
                                {areFiltersActive && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold hover:underline transition-all"
                                    >
                                        <XCircle size={14} />
                                        Limpar
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <p className="text-pink-200/50 text-xs font-bold tracking-wider mb-1 px-2">TIPO</p>
                                {['ALL', TaskType.HOMEWORK, TaskType.PROJECT, TaskType.EXAM].map((type) => {
                                    const { icon, label } = filterDisplay[type];
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setTypeFilter(type as any)}
                                            className={`flex items-center gap-3 text-left px-4 py-2 rounded-xl text-base font-medium transition-all duration-200 ${typeFilter === type ? 'bg-violet-700 text-white shadow-lg border border-violet-500/50' : 'text-pink-200 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            <span className="text-xl w-6 text-center">{icon}</span>
                                            <span>{label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex flex-col gap-2 mt-6">
                                <p className="text-pink-200/50 text-xs font-bold tracking-wider mb-2 px-2">MATÉRIA</p>
                                <div className="grid grid-cols-5 gap-2">
                                    <button
                                        onClick={() => setSubjectFilter('ALL')}
                                        title="Todas as Matérias"
                                        className={`flex items-center justify-center aspect-square rounded-xl transition-all duration-200 ${subjectFilter === 'ALL' ? 'bg-violet-600 text-white shadow-lg ring-2 ring-white ring-offset-2 ring-offset-[#2e1065]' : 'bg-white/5 text-pink-200 hover:bg-white/10'}`}
                                    >
                                        <Library size={20} />
                                    </button>
                                    {Object.values(Subject).map((subject) => (
                                        <button
                                            key={subject}
                                            onClick={() => setSubjectFilter(subject)}
                                            title={subject}
                                            className={`relative w-full aspect-square rounded-xl transition-all duration-200 bg-gradient-to-br flex items-center justify-center ${SUBJECT_COLORS[subject]} ${subjectFilter === subject ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                                        >
                                            <span className="text-white font-bold text-xs tracking-tighter">{SUBJECT_ABBREVIATIONS[subject]}</span>
                                            {subjectFilter === subject && (
                                                <div className="absolute inset-0 rounded-xl ring-2 ring-white ring-offset-2 ring-offset-[#2e1065]"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                     )}
                </div>
            </div>


             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTasks.map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        onToggleComplete={toggleTask}
                        onDelete={requestDeleteTask}
                        onGenerateAI={handleGenerateAI}
                        isGenerating={generatingId === task.id}
                        onEdit={handleEdit}
                    />
                ))}
                
                {filteredTasks.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-pink-200/30 border-2 border-dashed border-white/10 rounded-2xl">
                        <CalendarDays size={48} className="mb-3 opacity-50"/>
                        <p>Nenhuma tarefa encontrada.</p>
                        {areFiltersActive && (
                             <button onClick={clearFilters} className="text-pink-400 text-sm mt-2 hover:underline">Limpar filtros e ver tudo</button>
                        )}
                    </div>
                )}
             </div>
          </div>
        </div>
      </main>

      <NewTaskModal 
        isOpen={isModalOpen || !!taskToEdit}
        onClose={handleCloseModal} 
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
      />
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDeleteTask}
        title="Confirmar Exclusão"
        message="Tem certeza que quer apagar este item? Esta ação não pode ser desfeita."
      />
    </div>
  );
};

export default App;