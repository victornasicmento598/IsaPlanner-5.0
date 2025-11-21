import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Task } from '../types';

const STORAGE_KEY = 'isaplanner_tasks';

// Helper to trigger updates in LocalStorage mode
const notifyLocalChange = () => {
  window.dispatchEvent(new Event('local-tasks-changed'));
};

// Helper to convert base64 to Blob for Supabase Storage
const base64ToBlob = async (base64: string) => {
  const res = await fetch(base64);
  return await res.blob();
};

export const subscribeToTasks = (callback: (tasks: Task[]) => void) => {
  if (isSupabaseConfigured && supabase) {
    // 1. Initial Fetch
    supabase
      .from('tasks')
      .select('*')
      .then(({ data, error }) => {
        if (error) console.error('Erro ao buscar tarefas:', error);
        else callback((data as Task[]) || []);
      });

    // 2. Realtime Subscription
    const subscription = supabase
      .channel('tasks_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
            // Simple strategy: Refetch all on change to ensure consistency
            // In a larger app, we would merge payload.new into state
            supabase
            .from('tasks')
            .select('*')
            .then(({ data }) => {
                if (data) callback(data as Task[]);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };

  } else {
    // LocalStorage Mode (Fallback)
    const loadTasks = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    };
    
    // Initial load
    callback(loadTasks());

    // Listen for local changes
    const handler = () => callback(loadTasks());
    window.addEventListener('local-tasks-changed', handler);
    
    // Cleanup
    return () => window.removeEventListener('local-tasks-changed', handler);
  }
};

export const saveTask = async (task: Omit<Task, 'id' | 'isCompleted'> | Task) => {
  let taskToSave = { ...task };

  if (isSupabaseConfigured && supabase) {
     // Supabase Mode
     const taskId = 'id' in taskToSave ? taskToSave.id : crypto.randomUUID();

     // Handle image upload
     if (taskToSave.attachment && taskToSave.attachment.startsWith('data:image')) {
        try {
            const blob = await base64ToBlob(taskToSave.attachment);
            const fileName = `${taskId}-${Date.now()}.jpg`;
            
            const { data, error } = await supabase.storage
                .from('attachments')
                .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(fileName);

            taskToSave.attachment = publicUrl;
        } catch (e) {
            console.error("Erro no upload:", e);
            // If upload fails, we might save without image or handle error
        }
     }

     if ('id' in taskToSave) {
        // Update
        const { error } = await supabase
            .from('tasks')
            .update(taskToSave)
            .eq('id', taskToSave.id);
        if (error) console.error("Erro ao atualizar:", error);
     } else {
        // Insert
        const { error } = await supabase
            .from('tasks')
            .insert([{ ...taskToSave, id: taskId, isCompleted: false }]);
        if (error) console.error("Erro ao criar:", error);
     }

  } else {
    // LocalStorage Mode
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if ('id' in taskToSave) {
       const index = tasks.findIndex((t: Task) => t.id === taskToSave.id);
       if (index !== -1) {
         tasks[index] = { ...tasks[index], ...taskToSave };
       }
    } else {
       const newTask = { 
         ...taskToSave, 
         id: crypto.randomUUID(), 
         isCompleted: false 
       };
       tasks.push(newTask);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    notifyLocalChange();
  }
};

export const toggleTaskCompletion = async (id: string, currentStatus: boolean) => {
    if (isSupabaseConfigured && supabase) {
        await supabase
            .from('tasks')
            .update({ isCompleted: !currentStatus })
            .eq('id', id);
    } else {
        const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const index = tasks.findIndex((t: Task) => t.id === id);
        if (index !== -1) {
            tasks[index].isCompleted = !currentStatus;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
            notifyLocalChange();
        }
    }
}

export const deleteTask = async (task: Task) => {
    if (isSupabaseConfigured && supabase) {
        // Delete image if exists
        if (task.attachment && task.attachment.includes('supabase')) {
            try {
                // Extract filename from URL
                const urlParts = task.attachment.split('/');
                const fileName = urlParts[urlParts.length - 1];
                await supabase.storage.from('attachments').remove([fileName]);
            } catch (e) { console.error("Erro ao deletar imagem:", e); }
        }
        
        await supabase
            .from('tasks')
            .delete()
            .eq('id', task.id);
    } else {
        const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const newTasks = tasks.filter((t: Task) => t.id !== task.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
        notifyLocalChange();
    }
}

export const updateAiPlan = async (id: string, plan: string) => {
    if (isSupabaseConfigured && supabase) {
        await supabase
            .from('tasks')
            .update({ aiStudyPlan: plan })
            .eq('id', id);
    } else {
        const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const index = tasks.findIndex((t: Task) => t.id === id);
        if (index !== -1) {
            tasks[index].aiStudyPlan = plan;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
            notifyLocalChange();
        }
    }
}
