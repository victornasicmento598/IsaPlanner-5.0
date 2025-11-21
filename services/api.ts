import { getSupabase } from './supabaseClient';
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
  const supabase = getSupabase();

  if (supabase) {
    // ONLINE MODE: Supabase
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
        () => { // Refetch all on any change for simplicity
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
    // OFFLINE MODE: LocalStorage
    const loadTasks = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    };
    
    callback(loadTasks());
    const handler = () => callback(loadTasks());
    window.addEventListener('local-tasks-changed', handler);
    return () => window.removeEventListener('local-tasks-changed', handler);
  }
};

export const saveTask = async (task: Omit<Task, 'id' | 'isCompleted'> | Task) => {
  const supabase = getSupabase();
  let taskToSave = { ...task };

  if (supabase) {
     const taskId = 'id' in taskToSave ? taskToSave.id : crypto.randomUUID();

     if (taskToSave.attachment && taskToSave.attachment.startsWith('data:image')) {
        try {
            const blob = await base64ToBlob(taskToSave.attachment);
            const fileName = `${taskId}-${Date.now()}.jpg`;
            await supabase.storage.from('attachments').upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
            const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(fileName);
            taskToSave.attachment = publicUrl;
        } catch (e) { console.error("Erro no upload:", e); }
     }

     if ('id' in taskToSave) {
        await supabase.from('tasks').update(taskToSave).eq('id', taskToSave.id);
     } else {
        await supabase.from('tasks').insert([{ ...taskToSave, id: taskId, isCompleted: false }]);
     }

  } else {
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if ('id' in taskToSave) {
       const index = tasks.findIndex((t: Task) => t.id === taskToSave.id);
       if (index !== -1) tasks[index] = { ...tasks[index], ...taskToSave };
    } else {
       tasks.push({ ...taskToSave, id: crypto.randomUUID(), isCompleted: false });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    notifyLocalChange();
  }
};

export const toggleTaskCompletion = async (id: string, currentStatus: boolean) => {
    const supabase = getSupabase();
    if (supabase) {
        await supabase.from('tasks').update({ isCompleted: !currentStatus }).eq('id', id);
    } else {
        const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const task = tasks.find((t: Task) => t.id === id);
        if (task) task.isCompleted = !currentStatus;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        notifyLocalChange();
    }
}

export const deleteTask = async (task: Task) => {
    const supabase = getSupabase();
    if (supabase) {
        if (task.attachment && task.attachment.includes('supabase')) {
            try {
                const urlParts = task.attachment.split('/');
                const fileName = urlParts[urlParts.length - 1];
                await supabase.storage.from('attachments').remove([fileName]);
            } catch (e) { console.error("Erro ao deletar imagem:", e); }
        }
        await supabase.from('tasks').delete().eq('id', task.id);
    } else {
        const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const newTasks = tasks.filter((t: Task) => t.id !== task.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
        notifyLocalChange();
    }
}

export const updateAiPlan = async (id: string, plan: string) => {
    const supabase = getSupabase();
    if (supabase) {
        await supabase.from('tasks').update({ aiStudyPlan: plan }).eq('id', id);
    } else {
        const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const task = tasks.find((t: Task) => t.id === id);
        if (task) task.aiStudyPlan = plan;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        notifyLocalChange();
    }
}
