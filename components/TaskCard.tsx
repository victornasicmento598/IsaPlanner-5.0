import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskType, SUBJECT_COLORS, TYPE_ICONS } from '../types';
import { CheckCircle2, Circle, Bot, ChevronDown, ChevronUp, Trash2, Calendar, Pencil, Flame, AlertTriangle, Hourglass, Paperclip, Expand, X, ZoomIn, ZoomOut, RefreshCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onGenerateAI: (task: Task) => void;
  isGenerating: boolean;
  onEdit: (task: Task) => void;
}

const ImageViewer: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  const initialPinchDistanceRef = useRef(0);

  const updateTransform = (newScale: number, newPosition: { x: number; y: number; }) => {
    const clampedScale = Math.max(0.5, Math.min(newScale, 5));
    
    // Simple boundary clamping to keep image somewhat in view
    const boundaryX = (imageRef.current?.width || 0) * clampedScale / 4;
    const boundaryY = (imageRef.current?.height || 0) * clampedScale / 4;
    const clampedX = Math.max(-boundaryX, Math.min(newPosition.x, boundaryX));
    const clampedY = Math.max(-boundaryY, Math.min(newPosition.y, boundaryY));

    setScale(clampedScale);
    setPosition({ x: clampedX, y: clampedY });
  };
  
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const newScale = e.deltaY > 0 ? scale / zoomFactor : scale * zoomFactor;
    updateTransform(newScale, position);
  };

  const startDrag = (x: number, y: number) => {
    isDraggingRef.current = true;
    lastMousePositionRef.current = { x, y };
  };

  const onDrag = (x: number, y: number) => {
    if (!isDraggingRef.current) return;
    const dx = x - lastMousePositionRef.current.x;
    const dy = y - lastMousePositionRef.current.y;
    lastMousePositionRef.current = { x, y };
    updateTransform(scale, { x: position.x + dx, y: position.y + dy });
  };

  const endDrag = () => {
    isDraggingRef.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => startDrag(e.clientX, e.clientY);
  const handleMouseMove = (e: React.MouseEvent) => onDrag(e.clientX, e.clientY);
  const handleMouseUp = () => endDrag();
  const handleMouseLeave = () => endDrag();

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      initialPinchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
     if (e.touches.length === 1) {
        onDrag(e.touches[0].clientX, e.touches[0].clientY);
     } else if (e.touches.length === 2 && initialPinchDistanceRef.current > 0) {
        const newDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const newScale = scale * (newDist / initialPinchDistanceRef.current);
        updateTransform(newScale, position);
        initialPinchDistanceRef.current = newDist;
     }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    endDrag();
    if (e.touches.length < 2) {
      initialPinchDistanceRef.current = 0;
    }
  };
  
  const handleReset = () => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [scale, position]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in fade-in-0 duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Visualização de imagem ampliada"
    >
      <button
        className="fixed top-4 right-4 text-white/70 hover:text-white transition-colors z-[101] bg-black/50 p-2 rounded-full"
        onClick={onClose}
        aria-label="Fechar imagem"
      >
        <X size={28} />
      </button>

      <img
        ref={imageRef}
        src={src}
        alt="Anexo da tarefa em tela cheia"
        className="max-w-[95vw] max-h-[95vh] rounded-lg shadow-2xl object-contain cursor-grab active:cursor-grabbing transition-transform duration-100"
        style={{ transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)` }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[101] flex items-center gap-2 bg-black/50 p-2 rounded-full border border-white/10 shadow-lg">
          <button onClick={(e) => { e.stopPropagation(); updateTransform(scale * 1.2, position); }} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"><ZoomIn size={22}/></button>
          <button onClick={(e) => { e.stopPropagation(); updateTransform(scale / 1.2, position); }} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"><ZoomOut size={22}/></button>
          <div className="w-px h-6 bg-white/20"></div>
          <button onClick={(e) => { e.stopPropagation(); handleReset(); }} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"><RefreshCcw size={20}/></button>
      </div>
    </div>
  );
};


export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleComplete, onDelete, onGenerateAI, isGenerating, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const gradient = SUBJECT_COLORS[task.subject] || 'from-gray-500 to-gray-600';

  const isExam = task.type === TaskType.EXAM;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(task.date + 'T12:00:00');
  taskDate.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isOverdue = taskDate < today && !task.isCompleted;
  const isDueToday = taskDate.getTime() === today.getTime() && !task.isCompleted;
  const isDueTomorrow = taskDate.getTime() === tomorrow.getTime() && !task.isCompleted;
  
  const diffTime = taskDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const statusClasses = isOverdue
    ? 'border-red-500/80 shadow-lg shadow-red-500/20'
    : isDueToday
    ? 'border-amber-500/80 shadow-lg shadow-amber-500/20 animate-pulse'
    : isDueTomorrow
    ? 'border-cyan-500/80 shadow-lg shadow-cyan-500/20'
    : 'border-white/10 hover:border-pink-500/30';


  return (
    <>
      <div className={`relative group rounded-2xl bg-white/5 backdrop-blur-md border ${statusClasses} transition-all duration-300 shadow-lg overflow-hidden ${task.isCompleted ? 'opacity-60 grayscale' : ''}`}>
        
        {/* Color Bar Indicator */}
        <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${gradient}`} />

        <div className="p-5 pl-7">
          <div className="flex justify-between items-start mb-2">
            <div className="flex gap-2 items-center">
              <span className="text-2xl" role="img" aria-label={task.type}>{TYPE_ICONS[task.type]}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-200/70 bg-pink-500/10 px-2 py-1 rounded-full border border-pink-500/20">
                {task.subject}
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => onEdit(task)}
                className="text-pink-200/40 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Editar"
              >
                <Pencil size={18} />
              </button>
              <button 
                onClick={() => onDelete(task.id)}
                className="text-pink-200/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={() => onToggleComplete(task.id)}
                className={`transition-colors ${task.isCompleted ? 'text-green-400' : 'text-pink-200/40 hover:text-pink-400'}`}
              >
                {task.isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
            </div>
          </div>

          <h3 className={`text-xl font-semibold text-white mb-1 ${task.isCompleted ? 'line-through text-white/40' : ''}`}>
            {task.title}
          </h3>

          <div className="flex items-center gap-3 text-sm text-pink-200/60 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{new Date(task.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
              {isOverdue && (
                  <div className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                      <Flame size={12} />
                      ATRASADO!
                  </div>
              )}
              {isDueToday && (
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <AlertTriangle size={12} />
                      ENTREGA HOJE!
                  </div>
              )}
              {isDueTomorrow && (
                  <div className="flex items-center gap-1 text-xs font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                      <Hourglass size={12} />
                      ENTREGA AMANHÃ!
                  </div>
              )}
              {!task.isCompleted && daysRemaining > 1 && (
                  <div className="flex items-center gap-1 text-xs font-bold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full">
                      {`Faltam ${daysRemaining} dias`}
                  </div>
              )}
          </div>

          {(task.description || task.examContent) && (
            <div className="text-sm text-pink-100/70 mb-3 line-clamp-2">
              {isExam ? (
                  <span className="text-fuchsia-300 font-medium">Conteúdo: {task.examContent}</span>
              ) : (
                  task.description
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <div className="flex-1 flex items-center gap-4">
                {isExam && task.examContent && !task.isCompleted && (
                    <button 
                    onClick={() => onGenerateAI(task)}
                    disabled={isGenerating}
                    className="flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors disabled:opacity-50"
                    >
                      <Bot size={16} />
                      {task.aiStudyPlan ? "Ver Dicas do Robô" : "Ajuda do Robô"}
                    </button>
                )}
                {task.attachment && (
                  <div className="flex items-center gap-1.5 text-xs text-pink-200/60 font-medium">
                    <Paperclip size={14} />
                    <span>Anexo</span>
                  </div>
                )}
            </div>
            
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-pink-200/50 hover:text-white transition-colors"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="px-7 pb-5 pt-0 bg-black/20 animate-in slide-in-from-top-2 duration-200">
              {task.description && !isExam && (
                  <div className="mb-3">
                      <p className="text-xs text-pink-200/50 uppercase font-bold mb-1">Detalhes</p>
                      <p className="text-sm text-pink-100 whitespace-pre-wrap">{task.description}</p>
                  </div>
              )}
              
              {isExam && task.examContent && (
                  <div className="mb-3">
                      <p className="text-xs text-pink-200/50 uppercase font-bold mb-1">O que vai cair na prova?</p>
                      <div className="bg-purple-900/40 p-3 rounded-lg text-sm text-purple-100 border border-purple-500/30">
                          {task.examContent}
                      </div>
                  </div>
              )}
              
              {task.attachment && (
                <div className="mt-3">
                  <p className="text-xs text-pink-200/50 uppercase font-bold mb-1">Anexo</p>
                  <button 
                    onClick={() => setIsImageExpanded(true)} 
                    className="relative group block w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#2e1065] rounded-lg overflow-hidden border border-white/10"
                    aria-label="Ampliar anexo"
                  >
                    <img src={task.attachment} alt="Anexo da tarefa" className="w-full h-auto max-h-80 object-contain bg-black/20" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <Expand size={32} className="text-white" />
                      <span className="ml-2 text-white font-bold">Ampliar</span>
                    </div>
                  </button>
                </div>
              )}

              {task.aiStudyPlan && (
                  <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                          <Bot size={16} className="text-cyan-400"/>
                          <span className="text-xs text-cyan-400 font-bold uppercase">Dicas de Estudo da IA</span>
                      </div>
                      <div className="bg-cyan-950/40 p-4 rounded-xl border border-cyan-500/20 text-sm text-cyan-100 prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{task.aiStudyPlan}</ReactMarkdown>
                      </div>
                  </div>
              )}
          </div>
        )}
      </div>

      {isImageExpanded && task.attachment && (
        <ImageViewer src={task.attachment} onClose={() => setIsImageExpanded(false)} />
      )}
    </>
  );
};
