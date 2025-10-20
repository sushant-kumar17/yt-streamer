// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : window.location.origin;

// DOM Elements
const scheduleForm = document.getElementById('scheduleForm');
const dateInput = document.getElementById('date');
const slotSelect = document.getElementById('slot');
const videoUrlInput = document.getElementById('videoUrl');
const submitBtn = document.getElementById('submitBtn');
const messageDiv = document.getElementById('message');
const schedulesListDiv = document.getElementById('schedulesList');

// Set minimum date to today
const today = new Date().toISOString().split('T')[0];
dateInput.setAttribute('min', today);
dateInput.value = today;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSchedules();
});

// Handle form submission
scheduleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    date: dateInput.value,
    slot: slotSelect.value,
    video_url: videoUrlInput.value.trim()
  };

  // Basic URL validation
  if (!formData.video_url.includes('drive.google.com')) {
    showMessage('Please enter a valid Google Drive URL', 'error');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Saving...';

    const response = await fetch(`${API_BASE_URL}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (response.ok) {
      showMessage(result.message || 'Schedule saved successfully!', 'success');
      scheduleForm.reset();
      dateInput.value = today; // Reset to today
      loadSchedules(); // Refresh the list
    } else {
      showMessage(result.error || 'Failed to save schedule', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('Network error. Please check if the server is running.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '💾 Save Schedule';
  }
});

// Load and display schedules
async function loadSchedules() {
  try {
    schedulesListDiv.innerHTML = '<p class="loading">Loading schedules...</p>';

    const response = await fetch(`${API_BASE_URL}/schedules`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedules');
    }

    const result = await response.json();
    const schedules = result.data || [];

    if (schedules.length === 0) {
      schedulesListDiv.innerHTML = '<p class="no-schedules">No schedules found. Create your first schedule above!</p>';
      return;
    }

    // Sort schedules by date and slot
    schedules.sort((a, b) => {
      if (a.date === b.date) {
        return a.slot === 'morning' ? -1 : 1;
      }
      return new Date(a.date) - new Date(b.date);
    });

    // Render schedules
    schedulesListDiv.innerHTML = schedules.map(schedule => 
      renderScheduleItem(schedule)
    ).join('');

  } catch (error) {
    console.error('Error loading schedules:', error);
    schedulesListDiv.innerHTML = '<p class="error">Failed to load schedules. Please refresh the page.</p>';
  }
}

// Render individual schedule item
function renderScheduleItem(schedule) {
  const date = new Date(schedule.date + 'T00:00:00');
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const slotIcon = schedule.slot === 'morning' ? '🌅' : '🌆';
  const slotTime = schedule.slot === 'morning' ? '6:00 AM' : '5:00 PM';
  const streamTime = schedule.slot === 'morning' ? '5:50 AM' : '4:50 PM';
  
  const statusClass = `status-${schedule.status}`;
  const statusText = schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1);

  // Shorten URL for display
  const displayUrl = schedule.video_url.length > 50 
    ? schedule.video_url.substring(0, 50) + '...' 
    : schedule.video_url;

  return `
    <div class="schedule-item">
      <div class="schedule-info">
        <h3>${slotIcon} ${formattedDate} - ${schedule.slot.charAt(0).toUpperCase() + schedule.slot.slice(1)}</h3>
        <p><strong>Stream starts:</strong> ${streamTime} | <strong>Goes live:</strong> ${slotTime}</p>
        <p><strong>Video:</strong> <code>${displayUrl}</code></p>
      </div>
      <div class="schedule-status ${statusClass}">
        ${statusText}
      </div>
    </div>
  `;
}

// Show message to user
function showMessage(text, type = 'success') {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type} show`;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageDiv.classList.remove('show');
  }, 5000);
}

// Utility: Format date for display
function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Auto-refresh schedules every 30 seconds
setInterval(() => {
  loadSchedules();
}, 30000);
