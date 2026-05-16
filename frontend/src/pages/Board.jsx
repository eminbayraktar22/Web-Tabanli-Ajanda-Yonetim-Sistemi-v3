import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Clock, CheckSquare, ListTodo, AlertCircle, Calendar } from 'lucide-react';

const columns = {
  'todo': { name: 'Yapılacaklar', icon: ListTodo, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
  'in-progress': { name: 'Devam Edenler', icon: Clock, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  'done': { name: 'Tamamlananlar', icon: CheckSquare, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' }
};

const Board = () => {
  const [tasks, setTasks] = useState({
    'todo': [],
    'in-progress': [],
    'done': []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/tasks');
      const fetched = res.data?.data || [];
      const grouped = { 'todo': [], 'in-progress': [], 'done': [] };
      
      // Sıralama için order alanına göre diz
      fetched.sort((a, b) => (a.order || 0) - (b.order || 0));

      fetched.forEach(t => {
        if (grouped[t.status]) grouped[t.status].push(t);
        else grouped['todo'].push(t);
      });
      setTasks(grouped);
    } catch (error) {
      toast.error('Görevler yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = [...tasks[source.droppableId]];
    const destCol = source.droppableId === destination.droppableId ? sourceCol : [...tasks[destination.droppableId]];
    
    const [removed] = sourceCol.splice(source.index, 1);
    removed.status = destination.droppableId;
    destCol.splice(destination.index, 0, removed);

    setTasks(prev => ({
      ...prev,
      [source.droppableId]: sourceCol,
      [destination.droppableId]: destCol
    }));

    try {
      // Backend'e sadece status güncellemesi atıyoruz
      // Eğer order sistemini tamamen tutmak istersek tüm listeyi yollamalıyız, şimdilik sadece status
      await api.put(`/tasks/${removed.id}`, { status: destination.droppableId });
      toast.success('Görev taşındı');
    } catch (error) {
      toast.error('Taşıma kaydedilemedi');
      fetchTasks(); // Hata olursa geri al
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Pano</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Görevlerinizi sürükleyerek yönetin.</p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-x-hidden md:overflow-x-auto overflow-y-auto pb-4 snap-y md:snap-x snap-mandatory">
            {Object.entries(columns).map(([columnId, column]) => (
              <div key={columnId} className="flex-shrink-0 w-full md:w-80 flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 snap-start">
                <div className={`px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between rounded-t-2xl ${column.color}`}>
                  <div className="flex items-center gap-2">
                    <column.icon className="w-5 h-5" />
                    <h2 className="font-semibold">{column.name}</h2>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20">
                    {tasks[columnId].length}
                  </span>
                </div>

                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-slate-100 dark:bg-slate-800/50' : ''}`}
                    >
                      {tasks[columnId].map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white dark:bg-slate-800 p-4 rounded-xl border transition-all ${
                                snapshot.isDragging 
                                  ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 rotate-2 scale-105 z-50' 
                                  : 'border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md'
                              }`}
                            >
                              {task.priority && (
                                <div className="mb-2 flex items-center">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                    task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                                    task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                    'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                                  }`}>
                                    {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                                  </span>
                                </div>
                              )}
                              <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1 line-clamp-2">
                                {task.title}
                              </h3>
                              {task.due_date && (
                                <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(task.due_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
};

export default Board;
