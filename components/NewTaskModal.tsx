import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskType, Subject } from '../types';
import { X, Save, Sparkles, Pencil, Paperclip, Camera, Trash2 } from 'lucide-react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'isCompleted'> | Task) => void;
  taskToEdit?: Task | null;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, onSave, taskToEdit }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>(TaskType.HOMEWORK);
  const [subject, setSubject] = useState<Subject>(Subject.MATH);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [examContent, setExamContent] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isEditing = !!taskToEdit;

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setType(taskToEdit.type);
        setSubject(taskToEdit.subject);
        setDate(taskToEdit.date);
        setDescription(taskToEdit.description || '');
        setExamContent(taskToEdit.examContent || '');
        setAttachment(taskToEdit.attachment || null);
      } else {
        // Reset for new task
        setTitle('');
        setType(TaskType.HOMEWORK);
        setSubject(Subject.MATH);
        setDate('');
        setDescription('');
        setExamContent('');
        setAttachment(null);
      }
    } else {
      // Cleanup when modal closes
      stopCamera();
    }
  }, [isOpen, taskToEdit]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    const startCamera = async () => {
      if (isCameraActive) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Erro ao acessar a câmera:", err);
          setIsCameraActive(false);
        }
      }
    };
    startCamera();
    return () => stopCamera();
  }, [isCameraActive]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setAttachment(dataUrl);
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachment(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData = {
      title,
      type,
      subject,
      date,
      description: type !== TaskType.EXAM ? description : undefined,
      examContent: type === TaskType.EXAM ? examContent : undefined,
      attachment: attachment || undefined,
    };
    
    if (isEditing) {
      onSave({ ...taskToEdit, ...taskData });
    } else {
      onSave(taskData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-[#2e1065] border border-pink-500/30 w-full max-w-md rounded-3xl shadow-2xl shadow-purple-900/50 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isEditing ? <Pencil className="text-cyan-400" size={20}/> : <Sparkles className="text-pink-400" size={20}/>}
            {isEditing ? 'Editar Evento' : 'Adicionar Novo Evento'}
          </h2>
          <button onClick={onClose} className="text-pink-200/50 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {isCameraActive ? (
          <div className="p-6">
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl mb-4 border border-purple-500/30" />
            <div className="flex gap-4">
              <button onClick={() => setIsCameraActive(false)} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-all">Cancelar</button>
              <button onClick={handleCapture} className="w-full bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold py-3 px-4 rounded-xl">Capturar Foto</button>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            
            <div>
              <label className="block text-xs font-bold text-pink-300 uppercase mb-1">O que você tem para fazer?</label>
              <input 
                type="text" 
                required
                placeholder="Ex: Exercícios página 42, Maquete do Vulcão..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/30 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-pink-300 uppercase mb-1">Tipo</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value as TaskType)}
                  className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-xl px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none"
                >
                  {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-pink-300 uppercase mb-1">Matéria</label>
                <select 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-xl px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none"
                >
                  {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-pink-300 uppercase mb-1">Para quando é?</label>
               <input 
                  type="date" 
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 [color-scheme:dark]"
               />
            </div>

            {type === TaskType.EXAM ? (
              <div>
                <label className="block text-xs font-bold text-fuchsia-400 uppercase mb-1">Conteúdo da Prova</label>
                <textarea 
                  placeholder="Ex: Sistema Solar, Frações, Verbos..."
                  value={examContent}
                  onChange={(e) => setExamContent(e.target.value)}
                  rows={3}
                  className="w-full bg-fuchsia-900/20 border border-fuchsia-500/30 rounded-xl px-4 py-3 text-white placeholder-fuchsia-300/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-pink-300 uppercase mb-1">Observações</label>
                <textarea 
                  placeholder="Alguma anotação extra?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/30 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-pink-300 uppercase mb-1">Anexo</label>
              {attachment ? (
                <div className="relative group">
                  <img src={attachment} alt="Anexo" className="rounded-xl border-2 border-purple-500/30 w-full max-h-48 object-cover"/>
                  <button type="button" onClick={() => setAttachment(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-pink-200 hover:bg-white/10 transition-all">
                        <Paperclip size={16} /> Anexar Arquivo
                    </button>
                    <button type="button" onClick={() => setIsCameraActive(true)} className="w-full flex items-center justify-center gap-2 bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-pink-200 hover:bg-white/10 transition-all">
                        <Camera size={16} /> Tirar Foto
                    </button>
                </div>
              )}
            </div>

            <button 
              type="submit"
              className="w-full !mt-6 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-pink-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {isEditing ? 'Salvar Alterações' : 'Salvar no Planejador'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};