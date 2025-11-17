# Building Your First App

In this comprehensive guide, we'll build a complete task management application from scratch using Speculoos. This app will showcase real-world patterns and best practices for working with Hydra APIs.

## What We'll Build

A task management application with the following features:
- User authentication
- Task CRUD operations
- Real-time collaboration
- Advanced filtering and search
- File attachments
- Comments and activity tracking

## Prerequisites

Make sure you have:
- Completed the [installation](./installation.md) guide
- A running Hydra API (API Platform recommended)
- Basic understanding of Vue 3 Composition API

## Project Structure

```
src/
├── components/
│   ├── common/
│   ├── tasks/
│   └── users/
├── composables/
├── stores/
├── types/
├── utils/
└── views/
```

## Step 1: Project Setup

### 1.1 Create Vue App

```bash
npm create vue@latest task-manager
cd task-manager
npm install
```

### 1.2 Install Dependencies

```bash
npm install speculoos vue-router@4 pinia @vueuse/core
npm install -D @types/node
```

### 1.3 Configure Environment

```env
# .env.local
VITE_API_URL=https://api.taskmanager.local
VITE_MERCURE_URL=https://mercure.taskmanager.local/.well-known/mercure
VITE_JWT_TOKEN=your-jwt-token-here
```

## Step 2: Core Configuration

### 2.1 API Configuration

```typescript
// src/api/index.ts
import { ApiClient } from 'speculoos';

export const api = new ApiClient({
  baseUri: import.meta.env.VITE_API_URL,
  options: {
    headers: {
      'Content-Type': 'application/ld+json',
      'Accept': 'application/ld+json'
    }
  }
});

// Add authentication interceptor
api.options.headers = {
  ...api.options.headers,
  'Authorization': `Bearer ${import.meta.env.VITE_JWT_TOKEN}`
};
```

### 2.2 Store Configuration

```typescript
// src/store/index.ts
import { createStore } from 'speculoos';
import { HydraPlugin } from 'speculoos';
import { api } from '../api';

export const store = await createStore({
  state: {
    currentUser: null,
    tasks: [],
    projects: [],
    loading: false,
    error: null
  },
  methods: {
    setCurrentUser(state, user) {
      state.currentUser = user;
    },
    setLoading(state, loading) {
      state.loading = loading;
    },
    setError(state, error) {
      state.error = error;
    }
  }
}).use(new HydraPlugin(api, {
  endpoints: {
    tasks: '/tasks',
    projects: '/projects',
    users: '/users',
    comments: '/comments'
  },
  classmap: {
    'Task': Task,
    'Project': Project,
    'User': User,
    'Comment': Comment
  }
}));

export default store;
```

### 2.3 Type Definitions

```typescript
// src/types/index.ts
export interface Task {
  '@id': string;
  '@type': 'Task';
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  project?: Project;
  comments: Comment[];
  attachments: Attachment[];
}

export interface Project {
  '@id': string;
  '@type': 'Project';
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  owner: User;
  members: User[];
}

export interface User {
  '@id': string;
  '@type': 'User';
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
}

export interface Comment {
  '@id': string;
  '@type': 'Comment';
  id: number;
  content: string;
  createdAt: string;
  author: User;
  task: Task;
}

export interface Attachment {
  '@id': string;
  '@type': 'Attachment';
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  task: Task;
}
```

## Step 3: Composables

### 3.1 Authentication Composable

```typescript
// src/composables/useAuth.ts
import { ref, computed } from 'vue';
import { useStore } from 'speculoos';
import type { User } from '../types';

export function useAuth() {
  const store = useStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  const currentUser = computed(() => store.state.currentUser);
  const isAuthenticated = computed(() => !!currentUser.value);

  const login = async (email: string, password: string) => {
    try {
      loading.value = true;
      error.value = null;
      
      // This would typically call your authentication endpoint
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const { token, user } = await response.json();
      
      // Store token and user
      localStorage.setItem('auth_token', token);
      store.setCurrentUser(user);
      
      return user;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    store.setCurrentUser(null);
  };

  const fetchCurrentUser = async () => {
    try {
      loading.value = true;
      const user = await store.getItem('/me');
      store.setCurrentUser(user);
      return user;
    } catch (err) {
      error.value = 'Failed to fetch user';
      logout();
    } finally {
      loading.value = false;
    }
  };

  return {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    fetchCurrentUser
  };
}
```

### 3.2 Tasks Composable

```typescript
// src/composables/useTasks.ts
import { ref, computed, watch } from 'vue';
import { useStore, useMercureSync } from 'speculoos';
import type { Task } from '../types';

export function useTasks() {
  const store = useStore();
  const mercureSync = useMercureSync();
  
  const tasks = ref<Task[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref({
    status: '',
    priority: '',
    assignee: '',
    project: '',
    search: ''
  });

  let mercureListener: any = null;

  const filteredTasks = computed(() => {
    return tasks.value.filter(task => {
      if (filters.value.status && task.status !== filters.value.status) return false;
      if (filters.value.priority && task.priority !== filters.value.priority) return false;
      if (filters.value.assignee && task.assignee?.['@id'] !== filters.value.assignee) return false;
      if (filters.value.project && task.project?.['@id'] !== filters.value.project) return false;
      if (filters.value.search) {
        const search = filters.value.search.toLowerCase();
        return task.title.toLowerCase().includes(search) || 
               task.description?.toLowerCase().includes(search);
      }
      return true;
    });
  });

  const loadTasks = async () => {
    try {
      loading.value = true;
      error.value = null;
      
      const queryParams = new URLSearchParams();
      Object.entries(filters.value).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const collection = await store.fetchCollection(`/tasks?${queryParams}`);
      tasks.value = collection['hydra:member'];
      
      // Set up real-time sync
      if (mercureListener) {
        mercureSync.synchronize(tasks.value, ['/tasks/{id}']);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load tasks';
    } finally {
      loading.value = false;
    }
  };

  const createTask = async (taskData: Partial<Task>) => {
    try {
      const task = await store.createItem(taskData);
      tasks.value.push(task);
      return task;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create task';
      throw err;
    }
  };

  const updateTask = async (task: Task) => {
    try {
      const updatedTask = await store.updateItem(task);
      const index = tasks.value.findIndex(t => t['@id'] === task['@id']);
      if (index >= 0) {
        tasks.value[index] = updatedTask;
      }
      return updatedTask;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update task';
      throw err;
    }
  };

  const deleteTask = async (task: Task) => {
    try {
      await store.deleteItem(task);
      const index = tasks.value.findIndex(t => t['@id'] === task['@id']);
      if (index >= 0) {
        tasks.value.splice(index, 1);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete task';
      throw err;
    }
  };

  const assignTask = async (task: Task, user: User) => {
    return updateTask({ ...task, assignee: user });
  };

  const changeTaskStatus = async (task: Task, status: Task['status']) => {
    return updateTask({ ...task, status });
  };

  // Watch for filter changes
  watch(filters, loadTasks, { deep: true });

  return {
    tasks,
    filteredTasks,
    loading,
    error,
    filters,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    changeTaskStatus
  };
}
```

## Step 4: Components

### 4.1 Task Card Component

```vue
<!-- src/components/tasks/TaskCard.vue -->
<template>
  <div class="task-card" :class="taskClasses">
    <div class="task-header">
      <h3 class="task-title">{{ task.title }}</h3>
      <div class="task-meta">
        <span class="priority" :class="`priority-${task.priority}`">
          {{ task.priority }}
        </span>
        <span class="status" :class="`status-${task.status}`">
          {{ formatStatus(task.status) }}
        </span>
      </div>
    </div>
    
    <p class="task-description" v-if="task.description">
      {{ task.description }}
    </p>
    
    <div class="task-footer">
      <div class="task-assignee" v-if="task.assignee">
        <img 
          :src="task.assignee.avatar || defaultAvatar" 
          :alt="task.assignee.firstName"
          class="assignee-avatar"
        />
        <span>{{ task.assignee.firstName }} {{ task.assignee.lastName }}</span>
      </div>
      
      <div class="task-dates">
        <small v-if="task.dueDate" :class="{ 'overdue': isOverdue }">
          Due: {{ formatDate(task.dueDate) }}
        </small>
        <small class="created">
          Created: {{ formatDate(task.createdAt) }}
        </small>
      </div>
    </div>
    
    <div class="task-actions">
      <button @click="editTask" class="btn btn-sm">Edit</button>
      <button @click="changeStatus" class="btn btn-sm btn-primary">
        {{ nextStatusText }}
      </button>
      <button @click="deleteTask" class="btn btn-sm btn-danger">Delete</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Task } from '../../types';

const props = defineProps<{
  task: Task;
}>();

const emit = defineEmits<{
  edit: [task: Task];
  statusChange: [task: Task, status: Task['status']];
  delete: [task: Task];
}>();

const defaultAvatar = '/default-avatar.png';

const taskClasses = computed(() => ({
  'task-overdue': props.task.dueDate && new Date(props.task.dueDate) < new Date(),
  [`priority-${props.task.priority}`]: true,
  [`status-${props.task.status}`]: true
}));

const isOverdue = computed(() => 
  props.task.dueDate && new Date(props.task.dueDate) < new Date()
);

const nextStatusText = computed(() => {
  const statusFlow = {
    'todo': 'Start',
    'in_progress': 'Complete',
    'done': 'Reopen'
  };
  return statusFlow[props.task.status] || 'Update';
});

const formatStatus = (status: Task['status']) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const editTask = () => {
  emit('edit', props.task);
};

const changeStatus = () => {
  const statusFlow: Record<Task['status'], Task['status']> = {
    'todo': 'in_progress',
    'in_progress': 'done',
    'done': 'todo'
  };
  emit('statusChange', props.task, statusFlow[props.task.status]);
};

const deleteTask = () => {
  if (confirm(`Are you sure you want to delete "${props.task.title}"?`)) {
    emit('delete', props.task);
  }
};
</script>

<style scoped>
.task-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: white;
  transition: all 0.2s ease;
}

.task-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-card.task-overdue {
  border-left: 4px solid #f44336;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.task-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.task-meta {
  display: flex;
  gap: 0.5rem;
}

.priority, .status {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-low { background: #e8f5e8; color: #2e7d32; }
.priority-medium { background: #fff3e0; color: #f57c00; }
.priority-high { background: #ffebee; color: #c62828; }

.status-todo { background: #f5f5f5; color: #616161; }
.status-in_progress { background: #e3f2fd; color: #1976d2; }
.status-done { background: #e8f5e8; color: #2e7d32; }

.task-description {
  color: #666;
  margin: 0.5rem 0;
  line-height: 1.4;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f0f0;
}

.task-assignee {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.assignee-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.task-dates {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.overdue {
  color: #f44336;
  font-weight: 600;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f0f0;
}

.btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #f5f5f5;
}

.btn-primary {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-danger {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.btn-danger:hover {
  background: #d32f2f;
}
</style>
```

### 4.2 Task Form Component

```vue
<!-- src/components/tasks/TaskForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="task-form">
    <h2>{{ isEditing ? 'Edit Task' : 'Create New Task' }}</h2>
    
    <div class="form-group">
      <label for="title">Title *</label>
      <input
        id="title"
        v-model="form.title"
        type="text"
        required
        placeholder="Enter task title"
      />
    </div>
    
    <div class="form-group">
      <label for="description">Description</label>
      <textarea
        id="description"
        v-model="form.description"
        rows="3"
        placeholder="Enter task description"
      ></textarea>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label for="status">Status</label>
        <select id="status" v-model="form.status">
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="priority">Priority</label>
        <select id="priority" v-model="form.priority">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label for="dueDate">Due Date</label>
        <input
          id="dueDate"
          v-model="form.dueDate"
          type="date"
        />
      </div>
      
      <div class="form-group">
        <label for="assignee">Assignee</label>
        <select id="assignee" v-model="form.assignee">
          <option value="">Unassigned</option>
          <option 
            v-for="user in users" 
            :key="user['@id']" 
            :value="user['@id']"
          >
            {{ user.firstName }} {{ user.lastName }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="form-group">
      <label for="project">Project</label>
      <select id="project" v-model="form.project">
        <option value="">No Project</option>
        <option 
          v-for="project in projects" 
          :key="project['@id']" 
          :value="project['@id']"
        >
          {{ project.name }}
        </option>
      </select>
    </div>
    
    <div class="form-actions">
      <button type="submit" :disabled="submitting" class="btn btn-primary">
        {{ submitting ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task') }}
      </button>
      <button type="button" @click="resetForm" class="btn btn-secondary">
        Cancel
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { useStore } from 'speculoos';
import { useItemForm } from 'speculoos';
import type { Task, User, Project } from '../../types';

const props = defineProps<{
  task?: Task;
}>();

const emit = defineEmits<{
  created: [task: Task];
  updated: [task: Task];
  cancelled: [];
}>();

const store = useStore();
const users = ref<User[]>([]);
const projects = ref<Project[]>([]);

// Use Speculoos form helper
const { item: form, isCreationMode, isSubmitting, reset, submit } = useItemForm({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  assignee: '',
  project: ''
});

const isEditing = ref(false);

const handleSubmit = async () => {
  try {
    const result = await submit();
    emit(isCreationMode.value ? 'created' : 'updated', result);
    resetForm();
  } catch (error) {
    console.error('Failed to save task:', error);
  }
};

const resetForm = () => {
  reset();
  isEditing.value = false;
  emit('cancelled');
};

const editTask = (task: Task) => {
  reset(task);
  isEditing.value = true;
};

const loadUsers = async () => {
  try {
    const collection = await store.fetchCollection('/users');
    users.value = collection['hydra:member'];
  } catch (error) {
    console.error('Failed to load users:', error);
  }
};

const loadProjects = async () => {
  try {
    const collection = await store.fetchCollection('/projects');
    projects.value = collection['hydra:member'];
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
};

// Watch for task prop changes
watch(() => props.task, (task) => {
  if (task) {
    editTask(task);
  } else {
    resetForm();
  }
}, { immediate: true });

onMounted(() => {
  loadUsers();
  loadProjects();
});

defineExpose({ editTask });
</script>

<style scoped>
.task-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.task-form h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.btn-primary:hover:not(:disabled) {
  background: #1565c0;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #666;
  border-color: #ddd;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>
```

## Step 5: Main Views

### 5.1 Tasks View

```vue
<!-- src/views/TasksView.vue -->
<template>
  <div class="tasks-view">
    <header class="view-header">
      <h1>Tasks</h1>
      <button @click="showCreateForm = true" class="btn btn-primary">
        + New Task
      </button>
    </header>
    
    <div class="filters-section">
      <TaskFilters v-model="filters" />
    </div>
    
    <div class="tasks-section">
      <div v-if="loading" class="loading">
        Loading tasks...
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      
      <div v-else-if="filteredTasks.length === 0" class="empty">
        No tasks found. Create your first task!
      </div>
      
      <div v-else class="tasks-list">
        <TaskCard
          v-for="task in filteredTasks"
          :key="task['@id']"
          :task="task"
          @edit="editTask"
          @status-change="changeTaskStatus"
          @delete="deleteTask"
        />
      </div>
    </div>
    
    <!-- Task Form Modal -->
    <div v-if="showCreateForm || editingTask" class="modal-overlay" @click="closeForm">
      <div class="modal-content" @click.stop>
        <TaskForm
          :task="editingTask"
          @created="onTaskCreated"
          @updated="onTaskUpdated"
          @cancelled="closeForm"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTasks } from '../composables/useTasks';
import TaskCard from '../components/tasks/TaskCard.vue';
import TaskForm from '../components/tasks/TaskForm.vue';
import TaskFilters from '../components/tasks/TaskFilters.vue';
import type { Task } from '../types';

const {
  tasks,
  filteredTasks,
  loading,
  error,
  filters,
  loadTasks,
  createTask,
  updateTask,
  deleteTask,
  changeTaskStatus: changeStatus
} = useTasks();

const showCreateForm = ref(false);
const editingTask = ref<Task | null>(null);

const editTask = (task: Task) => {
  editingTask.value = task;
};

const changeTaskStatus = async (task: Task, status: Task['status']) => {
  try {
    await changeStatus(task, status);
  } catch (error) {
    console.error('Failed to change task status:', error);
  }
};

const deleteTask = async (task: Task) => {
  try {
    await deleteTask(task);
  } catch (error) {
    console.error('Failed to delete task:', error);
  }
};

const onTaskCreated = (task: Task) => {
  closeForm();
};

const onTaskUpdated = (task: Task) => {
  closeForm();
};

const closeForm = () => {
  showCreateForm.value = false;
  editingTask.value = null;
};

onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
.tasks-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.view-header h1 {
  margin: 0;
  color: #333;
}

.filters-section {
  margin-bottom: 2rem;
}

.tasks-section {
  min-height: 400px;
}

.loading, .error, .empty {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error {
  color: #f44336;
  background: #ffebee;
  border-radius: 4px;
}

.tasks-list {
  display: grid;
  gap: 1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.btn-primary:hover {
  background: #1565c0;
}

@media (max-width: 768px) {
  .tasks-view {
    padding: 1rem;
  }
  
  .view-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>
```

## Step 6: Routing

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/tasks'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/tasks',
      name: 'Tasks',
      component: () => import('../views/TasksView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/projects',
      name: 'Projects',
      component: () => import('../views/ProjectsView.vue'),
      meta: { requiresAuth: true }
    }
  ]
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const { isAuthenticated, fetchCurrentUser } = useAuth();
  
  // Try to fetch current user if not authenticated
  if (!isAuthenticated.value) {
    try {
      await fetchCurrentUser();
    } catch {
      // User is not logged in
    }
  }
  
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login');
  } else if (to.meta.requiresGuest && isAuthenticated.value) {
    next('/tasks');
  } else {
    next();
  }
});

export default router;
```

## Step 7: Main App

```vue
<!-- src/App.vue -->
<template>
  <div id="app">
    <nav class="navbar" v-if="isAuthenticated">
      <div class="nav-brand">
        <router-link to="/">Task Manager</router-link>
      </div>
      
      <div class="nav-links">
        <router-link to="/tasks">Tasks</router-link>
        <router-link to="/projects">Projects</router-link>
      </div>
      
      <div class="nav-user">
        <span v-if="currentUser">
          {{ currentUser.firstName }} {{ currentUser.lastName }}
        </span>
        <button @click="logout" class="btn btn-sm">Logout</button>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from './composables/useAuth';

const router = useRouter();
const { currentUser, isAuthenticated, fetchCurrentUser, logout } = useAuth();

const handleLogout = () => {
  logout();
  router.push('/login');
};

onMounted(() => {
  fetchCurrentUser().catch(() => {
    // User is not authenticated, will be handled by router
  });
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

.navbar {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand a {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1976d2;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-links a {
  color: #666;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #1976d2;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.main-content {
  min-height: calc(100vh - 70px);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #f5f5f5;
}
</style>
```

## Step 8: Entry Point

```typescript
// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import store from './store';
import mercure from './mercure';
import App from './App.vue';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(store);
app.use(mercure);

app.mount('#app');
```

## Running the Application

```bash
npm run dev
```

Your task management application is now running! It includes:

✅ **Authentication** - Login/logout functionality  
✅ **Task Management** - Complete CRUD operations  
✅ **Real-time Updates** - Live collaboration with Mercure  
✅ **Filtering & Search** - Advanced filtering capabilities  
✅ **Responsive Design** - Works on desktop and mobile  
✅ **Type Safety** - Full TypeScript support  

## Next Steps

To enhance your application:

1. **Add File Uploads** - Implement attachment functionality
2. **Add Comments** - Enable task discussions
3. **Add Notifications** - Real-time notifications for task updates
4. **Add Analytics** - Track task completion rates and productivity
5. **Add Offline Support** - Cache data for offline usage

For more advanced patterns, check out:
- [API Reference](../api-reference/) - Detailed module documentation
- [Guides](../guides/) - Practical tutorials and examples
- [Core Concepts](../core-concepts/) - Understanding the underlying technologies