import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="bg-[#2e1065] border border-red-500/30 w-full max-w-sm rounded-3xl shadow-2xl shadow-purple-900/50 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-red-400" size={20}/>
            {title}
          </h2>
          <button onClick={onClose} className="text-pink-200/50 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-pink-100/80 text-center mb-6">{message}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Sim, Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
