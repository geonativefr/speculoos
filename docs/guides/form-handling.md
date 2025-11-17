# Form Handling Guide

This guide demonstrates comprehensive form handling in Speculoos applications, including validation, error management, optimistic updates, and integration with Hydra APIs.

## What You'll Build

A complete form handling system with:
- Multi-step forms with validation
- Real-time validation feedback
- Optimistic form updates
- File upload handling
- Form state management
- Error boundary handling

## Prerequisites

Before starting, ensure you have:
- Completed: [Basic CRUD Guide](./basic-crud.md)
- Understanding of [Hydra API Reference](../api-reference/hydra.md)
- Knowledge of [Vue 3 Composition API](../core-concepts/vue3-reactivity.md)

## Step 1: Basic Form Handling

### 1.1 Create Simple Form Component

```vue
<!-- src/components/SimpleForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="simple-form">
    <div class="form-group">
      <label for="title">Title</label>
      <input
        id="title"
        v-model="form.title"
        type="text"
        required
        :class="{ 'is-invalid': errors.title }"
        @blur="validateField('title')"
        placeholder="Enter title"
      />
      <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
    </div>
    
    <div class="form-group">
      <label for="email">Email</label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        required
        :class="{ 'is-invalid': errors.email }"
        @blur="validateField('email')"
        placeholder="Enter email"
      />
      <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
    </div>
    
    <div class="form-group">
      <label for="age">Age</label>
      <input
        id="age"
        v-model.number="form.age"
        type="number"
        :class="{ 'is-invalid': errors.age }"
        @blur="validateField('age')"
        placeholder="Enter age"
      />
      <span v-if="errors.age" class="error-message">{{ errors.age }}</span>
    </div>
    
    <button type="submit" :disabled="isSubmitting" class="btn btn-primary">
      {{ isSubmitting ? 'Submitting...' : 'Submit' }}
    </button>
  </form>
</template>

<script setup>
import { ref, reactive } from 'vue';

const form = reactive({
  title: '',
  email: '',
  age: null
});

const errors = ref({});
const isSubmitting = ref(false);

const validateField = (fieldName) => {
  const value = form[fieldName];
  errors.value[fieldName] = '';
  
  switch (fieldName) {
    case 'title':
      if (!value || value.trim() === '') {
        errors.value[fieldName] = 'Title is required';
      } else if (value.length < 3) {
        errors.value[fieldName] = 'Title must be at least 3 characters';
      }
      break;
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.value[fieldName] = 'Please enter a valid email address';
      }
      break;
    case 'age':
      if (!value || value < 18) {
        errors.value[fieldName] = 'You must be at least 18 years old';
      } else if (value > 120) {
        errors.value[fieldName] = 'Age cannot be more than 120 years';
      }
      break;
  }
};

const handleSubmit = async () => {
  if (Object.values(errors.value).some(error => error)) {
    return; // Don't submit if there are errors
  }
  
  isSubmitting.value = true;
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Form submitted:', form);
    alert('Form submitted successfully!');
  } catch (error) {
    console.error('Form submission failed:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const clearForm = () => {
  Object.keys(form).forEach(key => {
    form[key] = '';
  });
  Object.keys(errors.value).forEach(key => {
    errors.value[key] = '';
  });
};
</script>

<style scoped>
.simple-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 2px rgba(0,123,255,0.25);
}

.is-invalid {
  border-color: #dc3545;
}

.error-message {
  display: block;
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

### 1.2 Use Speculoos Form Helpers

```javascript
// src/composables/useForm.js
import { useItemForm } from 'speculoos';

export function useForm(initialData) {
  const {
    item,
    isUnsavedDraft,
    isCreationMode,
    isSubmitting,
    reset,
    submit
  } = useItemForm(initialData);
  
  const validate = () => {
    // Use the item's validation rules
    return item.validate();
  };
  
  const handleSubmit = async (onSuccess) => {
    if (!validate()) {
      return;
    }
    
    try {
      const result = await submit();
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (error) {
      console.error('Form submission failed:', error);
      throw error;
    }
  };
  
  return {
    item,
    isUnsavedDraft,
    isCreationMode,
    isSubmitting,
    validate,
    reset,
    handleSubmit
  };
}
```

## Step 2: Advanced Form Features

### 2.1 Multi-step Form with Progress Tracking

```vue
<!-- src/components/MultiStepForm.vue -->
<template>
  <div class="multi-step-form">
    <div class="progress-bar">
      <div 
        v-for="step in totalSteps" 
        :key="step"
        :class="['step', { active: currentStep >= step, completed: currentStep > step }]"
      >
        {{ step }}
      </div>
    </div>
    
    <div class="form-container">
      <transition name="slide-fade" mode="out-in">
        <div v-if="currentStep === 1" key="step1">
          <Step1Form :data="form" @next="nextStep" />
        </div>
        
        <div v-if="currentStep === 2" key="step2">
          <Step2Form :data="form" @next="nextStep" @back="previousStep" />
        </div>
        
        <div v-if="currentStep === 3" key="step3">
          <Step3Form :data="form" @next="nextStep" @back="previousStep" />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const currentStep = ref(1);
const totalSteps = 3;
const form = ref({});

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const goToStep = (step) => {
  currentStep.value = step;
};
</script>

<style scoped>
.multi-step-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.progress-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.progress-bar div {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
}

.progress-bar div.active {
  background: #007bff;
}

.progress-bar div.completed {
  background: #28a745;
}

.form-container {
  position: relative;
  min-height: 300px;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
```

### 2.2 File Upload Form

```vue
<!-- src/components/FileUploadForm.vue -->
<template>
  <div class="file-upload-form">
    <div class="form-group">
      <label for="file">Upload File</label>
      <input
        id="file"
        type="file"
        @change="handleFileChange"
        :class="{ 'is-invalid': errors.file }"
        accept="image/*,.pdf,.doc,.docx"
      />
      <span v-if="errors.file" class="error-message">{{ errors.file }}</span>
    </div>
    
    <div v-if="file" class="file-preview">
      <img :src="filePreview" :alt="file.name" />
      <div class="file-info">
        <p><strong>{{ file.name }}</strong></p>
        <p>{{ formatFileSize(file.size) }}</p>
        <button @click="removeFile" class="btn btn-sm btn-danger">Remove</button>
      </div>
    </div>
    
    <div v-if="uploadProgress > 0" class="upload-progress">
      <div class="progress-bar">
        <div :style="{ width: uploadProgress + '%' }"></div>
      </div>
      <p>Uploading... {{ uploadProgress }}%</p>
    </div>
    
    <button type="submit" @click="uploadFile" :disabled="isUploading" class="btn btn-primary">
      {{ isUploading ? 'Uploading...' : 'Upload' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const file = ref(null);
const filePreview = ref(null);
const uploadProgress = ref(0);
const isUploading = ref(false);
const errors = ref({});

const handleFileChange = (event) => {
  const selectedFile = event.target.files[0];
  
  if (selectedFile) {
    // Validate file
    if (!selectedFile.type.startsWith('image/')) {
      errors.value.file = 'Please select an image file';
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      errors.value.file = 'File size must be less than 5MB';
      return;
    }
    
    file.value = selectedFile;
    filePreview.value = URL.createObjectURL(selectedFile);
    errors.value.file = '';
  }
};

const removeFile = () => {
  file.value = null;
  filePreview.value = null;
  uploadProgress.value = 0;
};

const uploadFile = async () => {
  if (!file.value || isUploading.value) return;
  
  isUploading.value = true;
  
  try {
    const formData = new FormData();
    formData.append('file', file.value);
    
    // Simulate upload with progress
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      console.log('File uploaded successfully');
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
    errors.value.file = 'Upload failed: ' + error.message;
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style scoped>
.file-upload-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.file-preview {
  margin-top: 1rem;
  text-align: center;
}

.file-preview img {
  max-width: 200px;
  max-height: 200px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.file-info {
  margin-top: 0.5rem;
}

.upload-progress {
  margin-top: 1rem;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar div {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}
</style>
```

## Step 3: Form Validation with Speculoos

### 3.1 Server-side Validation

```javascript
// src/composables/useServerValidation.js
import { ref } from 'vue';

export function useServerValidation() {
  const validationErrors = ref({});
  const isValidating = ref(false);
  
  const validateField = async (fieldName, value) => {
    isValidating.value = true;
    validationErrors.value[fieldName] = '';
    
    try {
      const response = await fetch(`/api/validate/${fieldName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [fieldName]: value })
      });
      
      const data = await response.json();
      
      if (!response.valid) {
        validationErrors.value[fieldName] = data.message || 'Validation failed';
      }
    } catch (error) {
      validationErrors.value[fieldName] = 'Validation error';
    } finally {
      isValidating.value = false;
    }
  };
  
  return {
    validationErrors,
    isValidating,
    validateField
  };
}
```

### 3.2 Real-time Validation Feedback

```vue
<!-- src/components/RealtimeValidation.vue -->
<template>
  <div class="realtime-validation">
    <div class="field-validation" :class="{ 'valid': !isValidating, 'invalid': isValidating, 'error': hasError }">
      <div class="validation-icon">
        <span v-if="isValidating">⏳</span>
        <span v-else-if="isValid">✓</span>
        <span v-if="hasError">❌</span>
      </div>
      
      <div class="validation-message">
        {{ validationMessage }}
      </div>
    </div>
  </template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  fieldName: String,
  value: [String, Number],
  isValidating: Boolean,
  validationErrors: Object
});

const validationMessage = computed(() => {
  if (props.isValidating) {
    return 'Validating...';
  }
  
  const error = props.validationErrors[props.fieldName];
  if (error) {
    return error;
  }
  
  if (!error && props.value) {
    return `${props.fieldName} is valid`;
  }
  
  return null;
});
</script>

<style scoped>
.realtime-validation {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem;
}

.field-validation {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.field-validation.valid {
  border-color: #28a745;
  background: #f0f9ff;
}

.field-validation.invalid {
  border-color: #dc3545;
  background: #f8d7da;
}

.field-validation.error {
  border-color: #dc3545;
  background: #ffebee8;
}

.validation-icon {
  font-size: 1rem;
  margin-right: 0.5rem;
}

.validation-message {
  font-size: 0.875rem;
}
</style>
```

## Step 4: Optimistic Updates

### 4.1 Optimistic Form Updates

```javascript
// src/composables/useOptimisticForm.js
import { ref } from 'vue';

export function useOptimisticForm(initialData, apiFunction) {
  const originalData = ref({ ...initialData });
  const optimisticData = ref({ ...initialData });
  const isOptimistic = ref(false);
  const pendingUpdates = ref([]);
  
  const applyOptimisticUpdate = (update) => {
    if (!isOptimistic.value) return;
    
    // Store original for rollback
    const original = { ...optimisticData.value };
    
    // Apply optimistic update
    Object.assign(optimisticData.value, update);
    
    // Add to pending updates
    pendingUpdates.value.push({
      data: { ...update },
      original,
      timestamp: Date.now()
    });
    
    // Execute API call
    try {
      const result = await apiFunction(optimisticData.value);
      
      // Clear pending updates
      const updateIndex = pendingUpdates.value.findIndex(
        pending => pending.data === result
      );
      
      if (updateIndex >= 0) {
        pendingUpdates.value.splice(updateIndex, 1);
      }
      
      // Apply server response
      Object.assign(optimisticData.value, result);
      originalData.value = { ...optimisticData.value };
    } catch (error) {
      // Rollback on error
      Object.assign(optimisticData.value, original);
      
      // Show error notification
      console.error('Optimistic update failed:', error);
    }
  };
  
  const commitOptimisticUpdates = () => {
    // Clear all pending updates that match the current state
    pendingUpdates.value = pendingUpdates.value.filter(pending => {
      // Check if the update matches current optimistic data
      return Object.keys(pending.data).every(key => 
        pending.data[key] === optimisticData.value[key]
      );
    });
    
    isOptimistic.value = false;
  };
  
  return {
    originalData,
    optimisticData,
    isOptimistic,
    pendingUpdates,
    applyOptimisticUpdate,
    commitOptimisticUpdates
  };
}
```

## Step 5: Error Handling

### 5.1 Error Boundary Component

```vue
<!-- src/components/ErrorBoundary.vue -->
<template>
  <div v-if="error" class="error-boundary">
    <h2>Something went wrong</h2>
    <p>{{ error.message }}</p>
    <button @click="retry" class="btn btn-primary">Try Again</button>
    <button @click="report" class="btn btn-secondary">Report Issue</button>
  </div>
  
  <slot v-else>
    <slot></slot>
  </slot>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue';

const error = ref(null);

const handleError = (error, errorInfo) => {
  console.error('Error caught:', error, errorInfo);
  error.value = error;
  onErrorCaptured(error, errorInfo);
};

const retry = () => {
  error.value = null;
  window.location.reload();
};

const report = () => {
  // Send error report to monitoring service
  console.log('Reporting error:', error.value);
  error.value = null;
};
</script>

<style scoped>
.error-boundary {
  padding: 2rem;
  margin: 1rem 0;
  border: 1px solid #dc3545;
  border-radius: 8px;
  background: #ffebee8;
  text-align: center;
}

.error-boundary h2 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.error-boundary p {
  color: #721c24;
  margin-bottom: 1rem;
}

.error-boundary button {
  margin: 0 0.5rem;
}
</style>
```

## Best Practices

### 1. Validation Strategy

- Use client-side validation for immediate feedback
- Implement server-side validation for critical checks
- Provide clear error messages
- Use debounced validation to reduce API calls
- Show validation state visually

### 2. User Experience

- Provide clear loading states during form submission
- Show progress indicators for multi-step forms
- Implement auto-save functionality
- Use optimistic updates for better perceived performance
- Handle keyboard navigation properly

### 3. Performance Optimization

- Batch validation requests when possible
- Use debouncing for real-time validation
- Implement form state persistence
- Optimize re-renders with proper keys
- Use virtual scrolling for large forms

### 4. Error Handling

- Implement error boundaries for graceful degradation
- Provide retry mechanisms for failed operations
- Log errors appropriately for debugging
- Use try-catch-finally patterns consistently
- Provide user-friendly error messages

### 5. Security

- Sanitize all user input before submission
- Validate file types and sizes
- Implement CSRF protection
- Use HTTPS for all form submissions
- Validate authentication for sensitive operations
- Implement rate limiting for form submissions

## Next Steps

With comprehensive form handling implemented, you can:

1. **Add Advanced Features**: Conditional fields, dynamic forms, wizard interfaces
2. **Add Accessibility**: ARIA labels, keyboard navigation, screen reader support
3. **Add Analytics**: Form completion tracking, validation analytics
4. **Add Testing**: Comprehensive form testing with edge cases

For more advanced patterns, see:
- [API Reference - Hydra](../api-reference/hydra.md) - Hydra form helpers
- [Core Concepts - Vue 3 Reactivity](../core-concepts/vue3-reactivity.md) - Form reactivity patterns
- [Real-time Updates Guide](./real-time-updates.md) - Real-time form updates