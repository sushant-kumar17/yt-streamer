// YouTube Live Streamer - Frontend Application
// Enhanced version with Supabase Authentication

// ==================== Configuration ====================

// Get Supabase credentials from environment or use defaults
// IMPORTANT: Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://jatgjprtghxkvjqxcvjz.supabase.co '; // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphdGdqcHJ0Z2h4a3ZqcXhjdmp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTgzMDQsImV4cCI6MjA3NjUzNDMwNH0.x87F9LLYcySgoD9NZTUWSFgiy8AU_5nxw0eb7mtSuys';

// SUPABASE_URL=https://jatgjprtghxkvjqxcvjz.supabase.co 
// SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphdGdqcHJ0Z2h4a3ZqcXhjdmp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTgzMDQsImV4cCI6MjA3NjUzNDMwNH0.x87F9LLYcySgoD9NZTUWSFgiy8AU_5nxw0eb7mtSuys 


// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// API Base URL
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : window.location.origin;

// ==================== Global State ====================

let currentUser = null;
let authToken = null;
let allSchedules = [];
let currentWeekOffset = 0; // 0 = this week, -1 = last week, 1 = next week

// ==================== Authentication ====================

// Check authentication state on load
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (session) {
    currentUser = session.user;
    authToken = session.access_token;
    showDashboard();
  } else {
    showLogin();
  }
}

// Handle login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const loginBtn = document.getElementById('loginBtn');
  
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';
  
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    currentUser = data.user;
    authToken = data.session.access_token;
    
    showMessage('authMessage', 'Login successful!', 'success');
    
    setTimeout(() => {
      showDashboard();
    }, 500);
    
  } catch (error) {
    showMessage('authMessage', error.message || 'Login failed', 'error');
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
});

// Handle logout
async function handleLogout() {
  const { error } = await supabaseClient.auth.signOut();
  
  if (error) {
    console.error('Logout error:', error);
  }
  
  currentUser = null;
  authToken = null;
  showLogin();
}

// Show/hide screens
function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainDashboard').style.display = 'block';
  document.getElementById('userEmail').textContent = currentUser.email;
  
  // Load initial data
  loadSchedules();
  renderCalendar();
}

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('mainDashboard').style.display = 'none';
}

// ==================== Schedule Management ====================

// Load all schedules
async function loadSchedules() {
  try {
    const response = await fetch(`${API_BASE_URL}/schedules`);
    const result = await response.json();
    
    if (!response.ok) throw new Error(result.error || 'Failed to load schedules');
    
    allSchedules = result.data || [];
    
    // Update UI
    updateStats();
    renderSchedulesList();
    renderCalendar();
    
  } catch (error) {
    console.error('Error loading schedules:', error);
    document.getElementById('schedulesList').innerHTML = 
      `<p class="error">Failed to load schedules: ${error.message}</p>`;
  }
}

// Update statistics
function updateStats() {
  const scheduled = allSchedules.filter(s => s.status === 'scheduled').length;
  const streaming = allSchedules.filter(s => s.status === 'streaming').length;
  const streamed = allSchedules.filter(s => s.status === 'streamed').length;
  const total = allSchedules.length;
  
  document.getElementById('scheduledCount').textContent = scheduled;
  document.getElementById('streamingCount').textContent = streaming;
  document.getElementById('streamedCount').textContent = streamed;
  document.getElementById('totalCount').textContent = total;
}

// Render schedules list
function renderSchedulesList() {
  const container = document.getElementById('schedulesList');
  const filterStatus = document.getElementById('statusFilter').value;
  
  let filteredSchedules = allSchedules;
  if (filterStatus !== 'all') {
    filteredSchedules = allSchedules.filter(s => s.status === filterStatus);
  }
  
  if (filteredSchedules.length === 0) {
    container.innerHTML = '<p class="no-schedules">No schedules found</p>';
    return;
  }
  
  // Sort by date and slot
  filteredSchedules.sort((a, b) => {
    if (a.date === b.date) {
      return a.slot === 'morning' ? -1 : 1;
    }
    return new Date(a.date) - new Date(b.date);
  });
  
  container.innerHTML = filteredSchedules.map(schedule => renderScheduleItem(schedule)).join('');
}

// Render single schedule item
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
  
  const privacyIcon = schedule.privacy === 'public' ? '🌍' : 
                       schedule.privacy === 'unlisted' ? '🔗' : '🔒';
  
  const youtubeUrl = schedule.youtube_watch_url ? 
    `<p><strong>YouTube:</strong> <a href="${schedule.youtube_watch_url}" target="_blank">Watch Live</a></p>` : '';
  
  return `
    <div class="schedule-item">
      <div class="schedule-info">
        <h3>${slotIcon} ${schedule.title || 'Untitled Stream'}</h3>
        <p><strong>Date:</strong> ${formattedDate} | <strong>Slot:</strong> ${schedule.slot}</p>
        <p><strong>Starts:</strong> ${streamTime} | <strong>Live:</strong> ${slotTime}</p>
        ${schedule.description ? `<p><strong>Description:</strong> ${schedule.description.substring(0, 100)}...</p>` : ''}
        ${youtubeUrl}
        <div class="schedule-meta">
          <span>${privacyIcon} ${schedule.privacy}</span>
          <span>Created: ${new Date(schedule.created_at).toLocaleDateString()}</span>
          ${schedule.created_by ? `<span>By: ${schedule.created_by}</span>` : ''}
        </div>
      </div>
      <div class="schedule-actions">
        <span class="status-badge ${statusClass}">${statusText}</span>
        ${schedule.status === 'scheduled' ? `
          <button onclick="editSchedule(${schedule.id})" class="btn btn-sm btn-secondary">Edit</button>
          <button onclick="cancelSchedule(${schedule.id})" class="btn btn-sm btn-danger">Cancel</button>
        ` : ''}
      </div>
    </div>
  `;
}

// ==================== Calendar View ====================

function renderCalendar() {
  const container = document.getElementById('calendarView');
  const today = new Date();
  
  // Calculate start of week based on offset
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (currentWeekOffset * 7));
  
  // Generate 7 days
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  
  // Update week display
  const weekStart = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekEnd = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('weekDisplay').textContent = `${weekStart} - ${weekEnd}`;
  
  // Render calendar
  container.innerHTML = days.map(day => {
    const dateStr = day.toISOString().split('T')[0];
    const daySchedules = allSchedules.filter(s => s.date === dateStr);
    
    const morningSchedule = daySchedules.find(s => s.slot === 'morning');
    const eveningSchedule = daySchedules.find(s => s.slot === 'evening');
    
    return `
      <div class="calendar-day">
        <div class="calendar-day-header">
          ${day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
        ${renderCalendarSlot(morningSchedule, 'morning', '🌅 Morning')}
        ${renderCalendarSlot(eveningSchedule, 'evening', '🌆 Evening')}
      </div>
    `;
  }).join('');
}

function renderCalendarSlot(schedule, slotType, label) {
  if (!schedule) {
    return `<div class="calendar-slot empty ${slotType}">${label}<br>—</div>`;
  }
  
  const statusEmoji = schedule.status === 'scheduled' ? '📅' :
                      schedule.status === 'streaming' ? '🔴' :
                      schedule.status === 'streamed' ? '✅' :
                      schedule.status === 'cancelled' ? '❌' : '⚠️';
  
  return `
    <div class="calendar-slot ${slotType}" onclick="editSchedule(${schedule.id})" title="${schedule.title}">
      ${statusEmoji} ${schedule.title ? schedule.title.substring(0, 20) : 'Stream'}
    </div>
  `;
}

function changeWeek(offset) {
  currentWeekOffset += offset;
  renderCalendar();
}

// ==================== Schedule Modal ====================

function showScheduleModal() {
  document.getElementById('scheduleModal').classList.add('active');
  document.getElementById('scheduleForm').reset();
  
  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('scheduleDate').setAttribute('min', today);
  document.getElementById('scheduleDate').value = today;
}

function closeScheduleModal() {
  document.getElementById('scheduleModal').classList.remove('active');
}

// Handle schedule form submission
document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    date: document.getElementById('scheduleDate').value,
    slot: document.getElementById('scheduleSlot').value,
    title: document.getElementById('scheduleTitle').value,
    description: document.getElementById('scheduleDescription').value,
    video_url: document.getElementById('scheduleVideoUrl').value,
    privacy: document.getElementById('schedulePrivacy').value
  };
  
  const submitBtn = document.getElementById('scheduleSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';
  
  try {
    const response = await fetch(`${API_BASE_URL}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (!response.ok) throw new Error(result.error || 'Failed to create schedule');
    
    showMessage('scheduleMessage', 'Schedule created successfully!', 'success');
    
    setTimeout(() => {
      closeScheduleModal();
      loadSchedules();
    }, 1500);
    
  } catch (error) {
    showMessage('scheduleMessage', error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Schedule';
  }
});

// ==================== Edit Schedule ====================

async function editSchedule(id) {
  const schedule = allSchedules.find(s => s.id === id);
  if (!schedule) return;
  
  // Populate edit form
  document.getElementById('editId').value = schedule.id;
  document.getElementById('editTitle').value = schedule.title;
  document.getElementById('editDescription').value = schedule.description || '';
  document.getElementById('editVideoUrl').value = schedule.video_url;
  document.getElementById('editPrivacy').value = schedule.privacy;
  
  // Show modal
  document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}

document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('editId').value;
  const updates = {
    title: document.getElementById('editTitle').value,
    description: document.getElementById('editDescription').value,
    video_url: document.getElementById('editVideoUrl').value,
    privacy: document.getElementById('editPrivacy').value
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updates)
    });
    
    const result = await response.json();
    
    if (!response.ok) throw new Error(result.error || 'Failed to update schedule');
    
    showMessage('editMessage', 'Schedule updated successfully!', 'success');
    
    setTimeout(() => {
      closeEditModal();
      loadSchedules();
    }, 1500);
    
  } catch (error) {
    showMessage('editMessage', error.message, 'error');
  }
});

// Cancel schedule
async function cancelSchedule(id) {
  if (!confirm('Are you sure you want to cancel this schedule?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) throw new Error(result.error || 'Failed to cancel schedule');
    
    loadSchedules();
    
  } catch (error) {
    alert('Error cancelling schedule: ' + error.message);
  }
}

// ==================== Bulk Scheduling ====================

function showBulkScheduleModal() {
  document.getElementById('bulkScheduleModal').classList.add('active');
  generateBulkScheduleList();
}

function closeBulkScheduleModal() {
  document.getElementById('bulkScheduleModal').classList.remove('active');
}

function generateBulkScheduleList() {
  const container = document.getElementById('bulkScheduleList');
  const today = new Date();
  
  let html = '';
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dateDisplay = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    // Morning slot
    html += `
      <div class="bulk-schedule-item">
        <span class="date-label">${dateDisplay} 🌅</span>
        <input type="text" class="bulk-title" data-date="${dateStr}" data-slot="morning" placeholder="Title" value="Morning Yoga Session">
        <input type="text" class="bulk-url" data-date="${dateStr}" data-slot="morning" placeholder="Video URL">
        <select class="bulk-privacy" data-date="${dateStr}" data-slot="morning">
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
          <option value="private">Private</option>
        </select>
        <input type="checkbox" class="bulk-enable" data-date="${dateStr}" data-slot="morning" checked>
      </div>
    `;
    
    // Evening slot
    html += `
      <div class="bulk-schedule-item">
        <span class="date-label">${dateDisplay} 🌆</span>
        <input type="text" class="bulk-title" data-date="${dateStr}" data-slot="evening" placeholder="Title" value="Evening Yoga Session">
        <input type="text" class="bulk-url" data-date="${dateStr}" data-slot="evening" placeholder="Video URL">
        <select class="bulk-privacy" data-date="${dateStr}" data-slot="evening">
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
          <option value="private">Private</option>
        </select>
        <input type="checkbox" class="bulk-enable" data-date="${dateStr}" data-slot="evening" checked>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

function applyBulkDefaults() {
  const defaultTitle = document.getElementById('bulkTitle').value;
  const defaultUrl = document.getElementById('bulkVideoUrl').value;
  const defaultPrivacy = document.getElementById('bulkPrivacy').value;
  
  document.querySelectorAll('.bulk-title').forEach(input => {
    if (defaultTitle) input.value = defaultTitle;
  });
  
  document.querySelectorAll('.bulk-url').forEach(input => {
    if (defaultUrl) input.value = defaultUrl;
  });
  
  document.querySelectorAll('.bulk-privacy').forEach(select => {
    select.value = defaultPrivacy;
  });
}

async function submitBulkSchedule() {
  const items = document.querySelectorAll('.bulk-schedule-item');
  const schedules = [];
  
  items.forEach(item => {
    const checkbox = item.querySelector('.bulk-enable');
    if (!checkbox.checked) return;
    
    const date = item.querySelector('.bulk-title').dataset.date;
    const slot = item.querySelector('.bulk-title').dataset.slot;
    const title = item.querySelector('.bulk-title').value;
    const video_url = item.querySelector('.bulk-url').value;
    const privacy = item.querySelector('.bulk-privacy').value;
    
    if (title && video_url) {
      schedules.push({
        date,
        slot,
        title,
        video_url,
        privacy,
        description: `Automated ${slot} yoga session`
      });
    }
  });
  
  if (schedules.length === 0) {
    showMessage('bulkMessage', 'Please fill in at least one schedule', 'error');
    return;
  }
  
  const submitBtn = document.getElementById('bulkSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = `Creating ${schedules.length} schedules...`;
  
  try {
    const response = await fetch(`${API_BASE_URL}/schedule/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ schedules })
    });
    
    const result = await response.json();
    
    if (!response.ok) throw new Error(result.error || 'Failed to create schedules');
    
    showMessage('bulkMessage', `Successfully created ${schedules.length} schedules!`, 'success');
    
    setTimeout(() => {
      closeBulkScheduleModal();
      loadSchedules();
    }, 2000);
    
  } catch (error) {
    showMessage('bulkMessage', error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create All Schedules';
  }
}

// ==================== Utility Functions ====================

function showMessage(elementId, text, type = 'info') {
  const element = document.getElementById(elementId);
  element.textContent = text;
  element.className = `message ${type} show`;
  
  setTimeout(() => {
    element.classList.remove('show');
  }, 5000);
}

// ==================== Initialization ====================

// Check auth on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  
  // Auto-refresh schedules every 30 seconds
  setInterval(() => {
    if (currentUser) {
      loadSchedules();
    }
  }, 30000);
});

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    currentUser = null;
    authToken = null;
    showLogin();
  }
});
