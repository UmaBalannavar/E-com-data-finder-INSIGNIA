// --- Fetch Websites ---
const fetchForm = document.getElementById('fetchForm');
const fetchBtn = document.getElementById('fetchBtn');

// --- Filter Websites ---
const domainActive = document.getElementById('domainActive');
const shopifyOnly = document.getElementById('shopifyOnly');
const load5s = document.getElementById('load5s');
const excludeCSV = document.getElementById('excludeCSV');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');

// --- Fetch Email IDs ---
const csvDrop = document.getElementById('csvDrop');
const csvFileInput = document.getElementById('csvFile');
const fetchEmailBtn = document.getElementById('fetchEmailBtn');

// --- API Base URL ---
const API_BASE_URL = 'http://localhost:5000';

// --- Helper: Show error message ---
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000); // Increased display time to 5 seconds
}

// --- Helper: Show success message ---
function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  setTimeout(() => successDiv.remove(), 3000);
}

// --- Fetch Websites Logic ---
if (fetchForm) {
  fetchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    fetchBtn.disabled = true;
    fetchBtn.textContent = 'Processing, please wait...';

    try {
      const country = document.getElementById('country').value;
      const city = document.getElementById('state').value;
      const keyword = document.getElementById('industry').value;
      const count = document.getElementById('count').value;

      // Validate inputs
      if (!country || !city || !keyword || !count) {
        showError('Please fill all required fields');
        return;
      }

      if (count < 1 || count > 1000) {
        showError('Count must be between 1 and 1000');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/fetch-sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, city, keyword, count })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch sites');
      }

      if (data.status === 'success') {
        showSuccess('Sites fetched successfully! Downloading file...');
        await downloadFile(data.file, 'Websites_Fetched.csv');
        showSuccess('Download complete!');
      } else {
        showError(data.error || data.message || 'Failed to fetch sites');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      showError(err.message || 'Error fetching sites. Please try again.');
    } finally {
      fetchBtn.disabled = false;
      fetchBtn.textContent = 'Fetch Websites';
    }
  });
}

// --- Download File Helper ---
async function downloadFile(filePath, downloadName) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/download?path=${encodeURIComponent(filePath)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Download failed');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName || 'download.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    console.error('Download error:', err);
    showError(err.message || 'Failed to download file');
    throw err; // Re-throw to handle in the calling function
  }
}

// --- Filter Websites Logic ---
if (applyFiltersBtn) {
  applyFiltersBtn.addEventListener('click', async () => {
    applyFiltersBtn.disabled = true;
    applyFiltersBtn.textContent = 'Processing...';
    try {
      // Get filters
      const filters = [];
      if (domainActive.checked) filters.push('active');
      if (shopifyOnly.checked) filters.push('shopify');
      if (load5s.checked) filters.push('fast');
      if (filters.length === 0) {
        showError('Select at least one filter');
        applyFiltersBtn.disabled = false;
        applyFiltersBtn.textContent = 'Apply Filters';
        return;
      }
      // Get file
      const file = excludeCSV.files[0];
      if (!file) {
        showError('Upload a CSV file');
        applyFiltersBtn.disabled = false;
        applyFiltersBtn.textContent = 'Apply Filters';
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      filters.forEach(f => formData.append('filters', f));
      const response = await fetch(`${API_BASE_URL}/api/filter-sites`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.status === 'success') {
        await downloadFile(data.file, 'Websites_Filtered.csv');
      } else {
        showError(data.error || data.message || 'Failed to filter sites');
      }
    } catch (err) {
      showError('Error filtering sites');
    }
    applyFiltersBtn.disabled = false;
    applyFiltersBtn.textContent = 'Apply Filters';
  });
}

// --- Drag & Drop for Fetch Email IDs ---
if (csvDrop && csvFileInput) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    csvDrop.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
  ['dragenter', 'dragover'].forEach(eventName => {
    csvDrop.addEventListener(eventName, () => csvDrop.classList.add('active'));
  });
  ['dragleave', 'drop'].forEach(eventName => {
    csvDrop.addEventListener(eventName, () => csvDrop.classList.remove('active'));
  });
  csvDrop.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      csvFileInput.files = files;
    }
  });
  // Clicking label triggers file input
  csvDrop.querySelector('label').addEventListener('click', () => csvFileInput.click());
}

// --- Fetch Email IDs Logic ---
if (fetchEmailBtn) {
  fetchEmailBtn.addEventListener('click', async () => {
    const file = csvFileInput.files[0];
    if (!file) {
      showError('Please upload a CSV file');
      return;
    }

    fetchEmailBtn.disabled = true;
    fetchEmailBtn.textContent = 'Processing...';

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/fetch-emails`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch emails');
      }

      if (data.status === 'success' && data.file) {
        showSuccess('Emails fetched successfully! Downloading file...');
        await downloadFile(data.file, 'Emails_Extracted.csv');
        showSuccess('Download complete!');
      } else {
        throw new Error('No file received from server');
      }
    } catch (err) {
      console.error('Email fetch error:', err);
      showError(err.message || 'Error fetching emails. Please try again.');
    } finally {
      fetchEmailBtn.disabled = false;
      fetchEmailBtn.textContent = 'Fetch Email IDs';
    }
  });
}
