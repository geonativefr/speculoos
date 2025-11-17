# Real-time Updates Guide

This guide demonstrates how to implement real-time updates in Speculoos applications using Mercure. We'll build a collaborative task management system with live updates, notifications, and conflict resolution.

## What You'll Build

A real-time task management system with:
- Live task status updates
- Real-time notifications
- Multi-user collaboration
- Conflict resolution for concurrent edits
- Live activity feeds
- Presence indicators

## Prerequisites

Before starting, ensure you have:
- Completed the [Basic CRUD Guide](./basic-crud.md)
- A running Mercure hub
- Understanding of [Mercure concepts](../core-concepts/mercure.md)

## Step 1: Mercure Setup

### 1.1 Configure Mercure Hub

```javascript
// src/mercure/index.js
import { createMercure } from 'speculoos';

export const mercure = createMercure(
  import.meta.env.VITE_MERCURE_URL || 'http://localhost:1337/.well-known/mercure',
  {
    authorization: `Bearer ${import.meta.env.VITE_JWT_TOKEN || ''}`,
    withCredentials: true,
    reconnectInterval: 3000,
    // Enable debug mode for development
    debug: import.meta.env.DEV
  }
);

// Export for use in components
export default mercure;
```

### 1.2 JWT Token Management

```javascript
// src/auth/tokenManager.js
class TokenManager {
  constructor() {
    this.token = null;
    this.refreshPromise = null;
    this.refreshTimeout = null;
  }
  
  async getToken() {
    if (this.token && !this.isTokenExpired(this.token)) {
      return this.token;
    }
    
    // Refresh token if needed
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    this.refreshPromise = this.refreshToken();
    
    try {
      this.token = await this.refreshPromise;
      return this.token;
    } finally {
      this.refreshPromise = null;
    }
  }
  
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true; // Assume expired if can't parse
    }
  }
  
  async refreshToken() {
    const response = await fetch('/api/token/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    return data.token;
  }
  
  setToken(token) {
    this.token = token;
    this.scheduleTokenRefresh();
  }
  
  scheduleTokenRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    // Refresh 5 minutes before expiry
    this.refreshTimeout = setTimeout(() => {
      this.getToken(); // Will refresh if needed
    }, 4 * 60 * 1000);
  }
  
  clearToken() {
    this.token = null;
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }
}

export const tokenManager = new TokenManager();
```

## Step 2: Real-time Task Management

### 2.1 Create Real-time Task Component

```vue
<!-- src/components/RealtimeTask.vue -->
<template>
  <div class="realtime-task" :class="taskClasses">
    <div class="task-header">
      <div class="task-title">
        <h3>{{ task.title }}</h3>
        <div class="task-meta">
          <span class="assignee" v-if="task.assignee">
            <img 
              :src="task.assignee.avatar" 
              :alt="task.assignee.name"
              class="assignee-avatar"
            />
            {{ task.assignee.name }}
          </span>
          <span class="priority" :class="priorityClass">{{ priorityText }}</span>
          <span class="status" :class="statusClass">{{ statusText }}</span>
        </div>
      </div>
      
      <div class="task-actions">
        <button 
          @click="toggleStatus" 
          :disabled="isUpdating"
          class="btn btn-sm"
        >
          {{ nextStatusText }}
        </button>
        
        <button 
          @click="editTask" 
          class="btn btn-sm btn-secondary"
        >
          Edit
        </button>
      </div>
    </div>
    
    <div class="task-description" v-if="task.description">
      <p>{{ task.description }}</p>
    </div>
    
    <div class="task-updates" v-if="updates.length > 0">
      <h4>Recent Updates</h4>
      <div class="update-list">
        <div 
          v-for="update in recentUpdates" 
          :key="update.id"
          class="update-item"
        >
          <span class="update-time">{{ formatTime(update.timestamp) }}</span>
          <span class="update-user">{{ update.user.name }}</span>
          <span class="update-action">{{ update.action }}</span>
          <span class="update-details">{{ update.details }}</span>
        </div>
      </div>
    </div>
    
    <div class="conflict-resolution" v-if="conflict">
      <div class="conflict-header">
        <h4>⚠️ Conflict Detected</h4>
        <p>Another user modified this task at the same time.</p>
      </div>
      
      <div class="conflict-details">
        <div class="conflict-versions">
          <div class="version current">
            <h5>Your Version</h5>
            <pre>{{ formatTask(currentVersion) }}</pre>
          </div>
          
          <div class="version other">
            <h5>{{ conflict.user.name }}'s Version</h5>
            <pre>{{ formatTask(conflict.version) }}</pre>
          </div>
        </div>
        
        <div class="conflict-actions">
          <button 
            @click="acceptConflict" 
            class="btn btn-primary"
          >
            Accept Their Changes
          </button>
          
          <button 
            @click="rejectConflict" 
            class="btn btn-secondary"
          >
            Keep Your Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useMercureSync } from 'speculoos';

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['status-changed', 'edit']);

const isUpdating = ref(false);
const updates = ref([]);
const conflict = ref(null);

// Set up Mercure synchronization
const mercureSync = useMercureSync({
  removeListenersOnUnmount: true
});

// Computed properties
const taskClasses = computed(() => ({
  'status-draft': props.task.status === 'draft',
  'status-in-progress': props.task.status === 'in_progress',
  'status-completed': props.task.status === 'completed',
  'status-cancelled': props.task.status === 'cancelled',
  [`priority-${props.task.priority}`]: true
}));

const priorityClass = computed(() => `priority-${props.task.priority}`);
const statusClass = computed(() => `status-${props.task.status}`);

const priorityText = computed(() => {
  const priorities = {
    low: 'Low',
    medium: 'Medium',
    high: 'High'
  };
  return priorities[props.task.priority] || props.task.priority;
});

const statusText = computed(() => {
  const statuses = {
    draft: 'Draft',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  return statuses[props.task.status] || props.task.status;
});

const nextStatusText = computed(() => {
  const statusFlow = {
    draft: 'Start',
    in_progress: 'Complete',
    completed: 'Reopen',
    cancelled: 'Reopen'
  };
  return statusFlow[props.task.status] || 'Update';
});

const recentUpdates = computed(() => {
  return updates.value
    .filter(update => update.timestamp > Date.now() - 300000) // Last 5 minutes
    .slice(-5) // Last 5 updates
    .reverse(); // Most recent first
});

const currentVersion = computed(() => {
  return updates.value.length > 0 ? updates.value[0].version : props.task;
});

onMounted(() => {
  // Set up Mercure synchronization for this task
  mercureSync.synchronize(
    [props.task],
    [`/tasks/${props.task.id}`],
    // Update handler
    (update, task) => {
      const updateEntry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        user: update.user,
        action: getUpdateAction(update, task),
        details: getUpdateDetails(update, task),
        version: { ...task }
      };
      
      updates.value.unshift(updateEntry);
      
      // Keep only last 50 updates
      if (updates.value.length > 50) {
        updates.value = updates.value.slice(0, 50);
      }
      
      // Check for conflicts
      if (update.user.id !== getCurrentUserId()) {
        conflict.value = {
          user: update.user,
          version: update,
          timestamp: update.timestamp
        };
      } else {
        // Apply update if no conflict
        Object.assign(task, update);
        conflict.value = null;
      }
    },
    // Delete handler
    (iri) => {
      if (iri === props.task['@id']) {
        // Task was deleted by another user
        const deleteEntry = {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          user: { name: 'System', id: 'system' },
          action: 'deleted',
          details: 'Task was deleted',
          version: null
        };
        
        updates.value.unshift(deleteEntry);
      }
    }
  );
});

const toggleStatus = async () => {
  if (isUpdating.value) return;
  
  isUpdating.value = true;
  
  try {
    const statusFlow = {
      draft: 'in_progress',
      in_progress: 'completed',
      completed: 'draft',
      cancelled: 'draft'
    };
    
    const updatedTask = {
      ...props.task,
      status: statusFlow[props.task.status] || props.task.status
    };
    
    // This will trigger Mercure update
    emit('status-changed', updatedTask);
    
    // Optimistic update
    Object.assign(props.task, updatedTask);
  } finally {
    isUpdating.value = false;
  }
};

const editTask = () => {
  emit('edit', props.task);
};

const acceptConflict = () => {
  if (conflict.value) {
    // Accept the other user's version
    Object.assign(props.task, conflict.value.version);
    conflict.value = null;
    
    // Notify acceptance
    showNotification('Conflict resolved: Changes accepted');
  }
};

const rejectConflict = () => {
  if (conflict.value) {
    conflict.value = null;
    showNotification('Conflict resolved: Your changes kept');
  }
};

// Helper functions
const getUpdateAction = (update, task) => {
  if (update.status !== task.status) {
    return `Status changed to ${update.status}`;
  } else if (update.assignee !== task.assignee) {
    return 'Assigned to different user';
  } else if (update.title !== task.title) {
    return 'Title modified';
  } else {
    return 'Updated';
  }
};

const getUpdateDetails = (update, task) => {
  const details = [];
  
  if (update.status !== task.status) {
    details.push(`Status: ${task.status} → ${update.status}`);
  }
  
  if (update.assignee !== task.assignee) {
    details.push(`Assignee: ${task.assignee?.name || 'Unassigned'} → ${update.assignee?.name}`);
  }
  
  if (update.title !== task.title) {
    details.push(`Title: "${task.title}" → "${update.title}"`);
  }
  
  return details.join(', ');
};

const formatTask = (task) => {
  return JSON.stringify(task, null, 2);
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString();
};

const getCurrentUserId = () => {
  // Get current user ID from auth context
  return localStorage.getItem('userId') || 'anonymous';
};

const showNotification = (message) => {
  // Simple notification implementation
  console.log('Notification:', message);
  // In a real app, you'd use a toast library or custom notifications
};

// Clean up Mercure listener
onUnmounted(() => {
  // MercureSync handles cleanup automatically when removeListenersOnUnmount: true
});
</script>

<style scoped>
.realtime-task {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: white;
  transition: all 0.3s ease;
}

.realtime-task:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.task-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.task-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.assignee {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.assignee-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.priority {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-low {
  background: #d4edda;
  color: #155724;
}

.priority-medium {
  background: #fff3cd;
  color: #856404;
}

.priority-high {
  background: #f8d7da;
  color: #721c24;
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-draft {
  background: #6c757d;
  color: white;
}

.status-in-progress {
  background: #007bff;
  color: white;
}

.status-completed {
  background: #28a745;
  color: white;
}

.status-cancelled {
  background: #dc3545;
  color: white;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-sm {
  font-size: 0.75rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.task-description {
  color: #666;
  line-height: 1.5;
  margin: 1rem 0;
}

.task-updates {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.update-list {
  max-height: 200px;
  overflow-y: auto;
}

.update-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.875rem;
}

.update-time {
  color: #999;
  font-size: 0.75rem;
}

.update-user {
  font-weight: 600;
  color: #007bff;
}

.update-action {
  color: #666;
}

.update-details {
  color: #999;
}

.conflict-resolution {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
}

.conflict-header h4 {
  margin: 0 0 1rem 0;
  color: #856404;
}

.conflict-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.version {
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.version.current {
  background: #e8f5e8;
  border-color: #28a745;
}

.version.other {
  background: #f8f9fa;
  border-color: #dee2e6;
}

.version h5 {
  margin: 0 0 0.5rem 0;
}

.version pre {
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  overflow-x: auto;
}

.conflict-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
```

### 2.2 Create Real-time Task List

```vue
<!-- src/components/RealtimeTaskList.vue -->
<template>
  <div class="realtime-task-list">
    <div class="list-header">
      <h2>Live Tasks</h2>
      <div class="presence-indicator">
        <span class="presence-dot online"></span>
        <span>{{ onlineUsers.length }} users online</span>
      </div>
    </div>
    
    <div class="task-filters">
      <select v-model="statusFilter" @change="applyFilters">
        <option value="">All Status</option>
        <option value="draft">Draft</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
      
      <select v-model="assigneeFilter" @change="applyFilters">
        <option value="">All Assignees</option>
        <option 
          v-for="user in users" 
          :key="user.id" 
          :value="user['@id']"
        >
          {{ user.name }}
        </option>
      </select>
    </div>
    
    <div class="activity-feed">
      <h3>Live Activity</h3>
      <div class="activity-list">
        <div 
          v-for="activity in recentActivity" 
          :key="activity.id"
          class="activity-item"
          :class="activity.type"
        >
          <div class="activity-icon">{{ getActivityIcon(activity.type) }}</div>
          <div class="activity-content">
            <div class="activity-user">{{ activity.user.name }}</div>
            <div class="activity-action">{{ activity.action }}</div>
            <div class="activity-details">{{ activity.details }}</div>
            <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="task-grid">
      <RealtimeTask
        v-for="task in filteredTasks"
        :key="task['@id']"
        :task="task"
        @status-changed="handleTaskStatusChange"
        @edit="editTask"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useMercureSync } from 'speculoos';

const tasks = ref([]);
const users = ref([]);
const onlineUsers = ref([]);
const activity = ref([]);
const statusFilter = ref('');
const assigneeFilter = ref('');

// Set up Mercure synchronization
const mercureSync = useMercureSync({
  removeListenersOnUnmount: true
});

// Computed properties
const filteredTasks = computed(() => {
  let filtered = tasks.value;
  
  if (statusFilter.value) {
    filtered = filtered.filter(task => task.status === statusFilter.value);
  }
  
  if (assigneeFilter.value) {
    filtered = filtered.filter(task => 
      task.assignee === assigneeFilter.value
    );
  }
  
  return filtered;
});

const recentActivity = computed(() => {
  return activity.value
    .filter(item => item.timestamp > Date.now() - 300000) // Last 5 minutes
    .slice(-10) // Last 10 activities
    .reverse(); // Most recent first
});

onMounted(async () => {
  // Load initial data
  await loadTasks();
  await loadUsers();
  
  // Set up Mercure synchronization
  mercureSync.synchronize(
    tasks,
    ['/tasks/{id}'],
    // Task update handler
    (update, task) => {
      const index = tasks.value.findIndex(t => t['@id'] === update['@id']);
      if (index >= 0) {
        tasks.value[index] = { ...tasks.value[index], ...update };
      }
      
      // Add to activity feed
      addActivity('task_updated', update.user, `Updated "${update.title}"`, update);
      
      // Update online users
      updateUserPresence(update.user, true);
    },
    // Task creation handler
    (iri) => {
      // New task created
      const newTask = await fetchTask(iri);
      if (newTask) {
        tasks.value.push(newTask);
        addActivity('task_created', newTask.assignee, `Created "${newTask.title}"`, newTask);
      }
    }
  );
  
  // Set up activity feed synchronization
  mercureSync.on(['/activity/{userId}'], (data) => {
    addActivity(data.type, data.user, data.details, data);
  });
});

const loadTasks = async () => {
  try {
    const response = await fetch('/api/tasks');
    tasks.value = response['hydra:member'];
  } catch (error) {
    console.error('Failed to load tasks:', error);
  }
};

const loadUsers = async () => {
  try {
    const response = await fetch('/api/users');
    users.value = response['hydra:member'];
    
    // Initially mark all users as online
    onlineUsers.value = users.value.map(user => user.id);
  } catch (error) {
    console.error('Failed to load users:', error);
  }
};

const fetchTask = async (iri) => {
  try {
    const response = await fetch(iri);
    return response;
  } catch (error) {
    console.error('Failed to fetch task:', error);
    return null;
  }
};

const applyFilters = () => {
  // Filters are applied via computed property
};

const handleTaskStatusChange = (task) => {
  // Update task in list
  const index = tasks.value.findIndex(t => t['@id'] === task['@id']);
  if (index >= 0) {
    tasks.value[index] = task;
  }
  
  // Add to activity
  addActivity('status_changed', getCurrentUser(), `Changed "${task.title}" to ${task.status}`, task);
};

const editTask = (task) => {
  // Open edit modal or navigate to edit page
  console.log('Edit task:', task);
};

const addActivity = (type, user, details, data) => {
  const activity = {
    id: Date.now() + Math.random(),
    type,
    user,
    details,
    timestamp: new Date().toISOString(),
    data
  };
  
  activity.value.unshift(activity);
  
  // Keep only last 100 activities
  if (activity.value.length > 100) {
    activity.value = activity.value.slice(0, 100);
  }
};

const updateUserPresence = (user, isOnline) => {
  if (isOnline && !onlineUsers.value.includes(user.id)) {
    onlineUsers.value.push(user.id);
    addActivity('user_online', user, 'User came online', user);
  } else if (!isOnline && onlineUsers.value.includes(user.id)) {
    const index = onlineUsers.value.indexOf(user.id);
    if (index >= 0) {
      onlineUsers.value.splice(index, 1);
    }
    addActivity('user_offline', user, 'User went offline', user);
  }
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('currentUser') || '{}');
};

const getActivityIcon = (type) => {
  const icons = {
    task_created: '📝',
    task_updated: '✏️',
    status_changed: '🔄',
    user_online: '🟢',
    user_offline: '🔴'
  };
  
  return icons[type] || '📝';
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString();
};

// Clean up Mercure listeners
onUnmounted(() => {
  // MercureSync handles cleanup automatically when removeListenersOnUnmount: true
});
</script>

<style scoped>
.realtime-task-list {
  padding: 2rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.presence-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.presence-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.25rem;
}

.presence-dot.online {
  background: #28a745;
}

.presence-dot.offline {
  background: #dc3545;
}

.task-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.task-filters select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.activity-feed {
  margin-bottom: 2rem;
}

.activity-feed h3 {
  margin: 0 0 1rem 0;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.activity-content {
  flex: 1;
}

.activity-user {
  font-weight: 600;
  color: #007bff;
  margin-bottom: 0.25rem;
}

.activity-action {
  color: #666;
  margin-bottom: 0.25rem;
}

.activity-details {
  color: #999;
  font-size: 0.875rem;
}

.activity-time {
  color: #999;
  font-size: 0.75rem;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}
</style>
```

## Step 3: Advanced Real-time Features

### 3.1 Live Notifications

```javascript
// src/composables/useNotifications.js
import { ref, computed } from 'vue';
import { useMercureSync } from 'speculoos';

export function useNotifications() {
  const notifications = ref([]);
  const unreadCount = ref(0);
  
  const mercureSync = useMercureSync({
    removeListenersOnUnmount: true
  });
  
  // Set up notification synchronization
  mercureSync.on(['/notifications/{userId}'], (data) => {
    addNotification(data);
  });
  
  const addNotification = (notification) => {
    notifications.value.unshift({
      ...notification,
      id: Date.now() + Math.random(),
      read: false,
      timestamp: new Date().toISOString()
    });
    
    unreadCount.value++;
    
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/notification-icon.png'
      });
    }
    
    // Keep only last 50 notifications
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50);
    }
  };
  
  const markAsRead = (notificationId) => {
    const index = notifications.value.findIndex(n => n.id === notificationId);
    if (index >= 0 && !notifications.value[index].read) {
      notifications.value[index].read = true;
      unreadCount.value--;
    }
  };
  
  const markAllAsRead = () => {
    notifications.value.forEach(notification => {
      notification.read = true;
    });
    unreadCount.value = 0;
  };
  
  const clearNotifications = () => {
    notifications.value = [];
    unreadCount.value = 0;
  };
  
  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
}
```

### 3.2 Collaborative Editing

```javascript
// src/composables/useCollaborativeEditing.js
import { ref, computed } from 'vue';
import { useMercureSync } from 'speculoos';

export function useCollaborativeEditing(taskId) {
  const collaborators = ref([]);
  const activeEditors = ref(new Set());
  const conflicts = ref([]);
  
  const mercureSync = useMercureSync({
    removeListenersOnUnmount: true
  });
  
  // Set up collaboration synchronization
  mercureSync.on([`/tasks/${taskId}/collaboration`], (data) => {
    handleCollaborationEvent(data);
  });
  
  const handleCollaborationEvent = (data) => {
    switch (data.type) {
      case 'user_joined':
        collaborators.value.push(data.user);
        addCollaborationEvent('joined', data.user);
        break;
        
      case 'user_left':
        const index = collaborators.value.findIndex(u => u.id === data.user.id);
        if (index >= 0) {
          collaborators.value.splice(index, 1);
        }
        activeEditors.value.delete(data.user.id);
        addCollaborationEvent('left', data.user);
        break;
        
      case 'editing_started':
        activeEditors.value.add(data.user.id);
        addCollaborationEvent('editing', data.user);
        break;
        
      case 'editing_stopped':
        activeEditors.value.delete(data.user.id);
        addCollaborationEvent('stopped', data.user);
        break;
        
      case 'conflict_detected':
        conflicts.value.push(data.conflict);
        addCollaborationEvent('conflict', data.user);
        break;
    }
  };
  
  const addCollaborationEvent = (type, user) => {
    const event = {
      id: Date.now() + Math.random(),
      type,
      user,
      timestamp: new Date().toISOString()
    };
    
    // In a real app, you'd store this in a database
    console.log('Collaboration event:', event);
  };
  
  const joinEditing = (userId) => {
    // Signal that user is editing
    mercureSync.emit(`/tasks/${taskId}/editing`, {
      type: 'editing_started',
      user: { id: userId },
      taskId
    });
  };
  
  const leaveEditing = (userId) => {
    // Signal that user stopped editing
    mercureSync.emit(`/tasks/${taskId}/editing`, {
      type: 'editing_stopped',
      user: { id: userId },
      taskId
    });
  };
  
  const activeEditorsList = computed(() => {
    return Array.from(activeEditors.value).map(id => 
      collaborators.value.find(u => u.id === id)
    );
  });
  
  return {
    collaborators,
    activeEditors,
    activeEditorsList,
    conflicts,
    joinEditing,
    leaveEditing
  };
}
```

### 3.3 Performance Optimization

```javascript
// src/composables/useOptimizedRealtime.js
import { ref, computed } from 'vue';
import { useMercureSync } from 'speculoos';

export function useOptimizedRealtime() {
  const items = ref([]);
  const updates = ref([]);
  const batchUpdates = ref([]);
  
  const mercureSync = useMercureSync({
    removeListenersOnUnmount: true
  });
  
  // Batch update mechanism
  let batchTimeout = null;
  
  const batchUpdate = (update) => {
    batchUpdates.value.push(update);
    
    if (!batchTimeout) {
      batchTimeout = setTimeout(() => {
        processBatch();
      }, 100); // Batch every 100ms
    }
  };
  
  const processBatch = () => {
    if (batchUpdates.value.length === 0) return;
    
    const updatesToProcess = batchUpdates.value.splice(0);
    batchTimeout = null;
    
    // Group updates by item ID
    const updatesByItem = new Map();
    updatesToProcess.forEach(update => {
      if (!updatesByItem.has(update.itemId)) {
        updatesByItem.set(update.itemId, []);
      }
      updatesByItem.get(update.itemId).push(update);
    });
    
    // Apply latest update for each item
    updatesByItem.forEach((itemUpdates, itemId) => {
      const latestUpdate = itemUpdates[itemUpdates.length - 1];
      const index = items.value.findIndex(item => item['@id'] === itemId);
      
      if (index >= 0) {
        items.value[index] = { ...items.value[index], ...latestUpdate };
      }
      
      // Add to update history
      updates.value.unshift({
        ...latestUpdate,
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString()
      });
    });
  };
  
  // Debounced subscription management
  const subscriptionManager = {
    currentTopics: new Set(),
    pendingTopics: new Set(),
    
    subscribe: (topics) => {
      topics.forEach(topic => this.pendingTopics.add(topic));
      
      // Debounce subscription changes
      clearTimeout(this.subscriptionTimeout);
      this.subscriptionTimeout = setTimeout(() => {
        const topicsToSubscribe = Array.from(this.pendingTopics);
        const topicsToUnsubscribe = Array.from(this.currentTopics).filter(
          topic => !this.pendingTopics.has(topic)
        );
        
        // Update subscriptions
        if (topicsToSubscribe.length > 0) {
          mercureSync.synchronize(items, topicsToSubscribe);
        }
        
        if (topicsToUnsubscribe.length > 0) {
          // Unsubscribe from old topics (implementation depends on your Mercure client)
          console.log('Unsubscribing from:', topicsToUnsubscribe);
        }
        
        this.currentTopics = new Set(topicsToSubscribe);
        this.pendingTopics.clear();
      }, 50);
    },
    
    unsubscribe: (topics) => {
      topics.forEach(topic => this.pendingTopics.add(topic));
      this.subscribe(); // Trigger debounced re-subscription
    }
  };
  
  // Set up optimized Mercure synchronization
  mercureSync.synchronize(
    items,
    // Dynamically managed topics
    computed(() => Array.from(subscriptionManager.currentTopics)),
    // Optimized update handler
    (update, item) => {
      batchUpdate({
        itemId: item['@id'],
        ...update
      });
    }
  );
  
  return {
    items,
    updates,
    subscriptionManager
  };
}
```

## Step 4: Testing Real-time Features

### 4.1 Mock Mercure for Testing

```javascript
// tests/utils/mockMercure.js
import mitt from 'mitt';

export class MockMercure {
  constructor() {
    this.emitter = mitt();
    this.subscribers = new Map();
    this.connected = false;
  }
  
  connect() {
    setTimeout(() => {
      this.connected = true;
      this.emitter.emit('open');
    }, 100);
  }
  
  subscribe(topics) {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }
    
    topics.forEach(topic => {
      if (!this.subscribers.has(topic)) {
        this.subscribers.set(topic, new Set());
      }
      this.subscribers.get(topic).add(callback);
    });
  }
  
  emit(topic, data) {
    const subscribers = this.subscribers.get(topic);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback({
            data: JSON.stringify(data),
            lastEventId: Date.now().toString()
          });
        } catch (error) {
          console.error('Mock Mercure callback error:', error);
        }
      });
    }
  }
  
  disconnect() {
    this.connected = false;
    this.emitter.emit('close');
  }
}
```

### 4.2 Real-time Component Tests

```javascript
// tests/components/RealtimeTask.test.js
import { mount } from '@vue/test-utils';
import RealtimeTask from '../../components/RealtimeTask.vue';
import { MockMercure } from '../utils/mockMercure';

describe('RealtimeTask', () => {
  let mockMercure;
  
  beforeEach(() => {
    mockMercure = new MockMercure();
  });
  
  test('receives real-time updates', async () => {
    const mockTask = {
      '@id': '/tasks/1',
      title: 'Test Task',
      status: 'draft'
    };
    
    const wrapper = mount(RealtimeTask, {
      props: { task: mockTask },
      global: {
        provide: {
          mercure: mockMercure
        }
      }
    });
    
    // Simulate Mercure connection
    mockMercure.connect();
    
    // Simulate update
    const updateData = {
      '@id': '/tasks/1',
      title: 'Updated Task',
      status: 'in_progress',
      user: { id: 'user1', name: 'Test User' }
    };
    
    mockMercure.emit('/tasks/1', updateData);
    
    // Wait for update to propagate
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(wrapper.vm.task.title).toBe('Updated Task');
    expect(wrapper.vm.task.status).toBe('in_progress');
  });
  
  test('handles conflicts', async () => {
    const mockTask = {
      '@id': '/tasks/1',
      title: 'Test Task',
      status: 'draft',
      version: 1
    };
    
    const wrapper = mount(RealtimeTask, {
      props: { task: mockTask },
      global: {
        provide: {
          mercure: mockMercure
        }
      }
    });
    
    mockMercure.connect();
    
    // Simulate conflict
    const conflictData = {
      '@id': '/tasks/1',
      title: 'Test Task',
      status: 'in_progress',
      version: 2,
      user: { id: 'user2', name: 'Other User' }
    };
    
    mockMercure.emit('/tasks/1', conflictData);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(wrapper.vm.conflict).toBeTruthy();
    expect(wrapper.vm.conflict.user.name).toBe('Other User');
  });
});
```

## Best Practices

### 1. Connection Management
- Implement proper reconnection logic with exponential backoff
- Monitor connection status and provide user feedback
- Handle authentication token refresh automatically
- Gracefully handle connection failures

### 2. Performance Optimization
- Batch rapid updates to reduce network traffic
- Use debouncing for subscription changes
- Implement efficient data structures for updates
- Monitor memory usage with large datasets

### 3. User Experience
- Provide clear visual feedback for real-time status
- Implement presence indicators for collaborative features
- Show meaningful notifications for important events
- Handle conflicts gracefully with resolution options

### 4. Security Considerations
- Validate incoming data on the client side
- Implement proper topic-based authorization
- Handle authentication token expiration
- Sanitize user input before sending updates

### 5. Testing Strategy
- Mock Mercure for reliable unit testing
- Test conflict resolution scenarios
- Verify reconnection behavior
- Test performance with large datasets

## Next Steps

With real-time updates implemented, you can:

1. **Add Advanced Features**: File sharing, collaborative cursors, typing indicators
2. **Improve Performance**: Implement delta updates, compression, connection pooling
3. **Add Analytics**: Track real-time engagement metrics
4. **Add Mobile Support**: Push notifications, offline mode
5. **Add Security**: End-to-end encryption, audit logging

For more advanced patterns, see:
- [Advanced Filtering Guide](./advanced-filtering.md)
- [Form Handling Guide](./form-handling.md)
- [API Reference - Mercure](../api-reference/mercure.md) - Detailed Mercure API