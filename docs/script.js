// Configuration
const CONFIG = {
  // For development
  API_BASE_URL_DEV: "http://localhost:8000/api",

  get API_BASE_URL() {
	return window.location.hostname === "localhost" ||
	  window.location.hostname === "127.0.0.1"
	  ? this.API_BASE_URL_DEV
	  : this.API_BASE_URL_PROD;
  },
};

// DOM elements
const elements = {
  urlInput: document.getElementById("youtubeUrl"),
  extractBtn: document.getElementById("extractBtn"),
  loadingSection: document.getElementById("loadingSection"),
  videoSection: document.getElementById("videoSection"),
  videoTitle: document.getElementById("videoTitle"),
  videoMeta: document.getElementById("videoMeta"),
  videoEmbed: document.getElementById("videoEmbed"),
  resultSection: document.getElementById("resultSection"),
  errorSection: document.getElementById("errorSection"),
  captionsText: document.getElementById("captionsText"),
  videoId: document.getElementById("videoId"),
  captionLength: document.getElementById("captionLength"),
  errorText: document.getElementById("errorText"),
  copyBtn: document.getElementById("copyBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
};

// State management
let currentCaptions = "";
let currentVideoId = "";
let currentVideoData = null;

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  initializeEventListeners();
  elements.urlInput.focus();
});

// Event listeners
function initializeEventListeners() {
  // Extract button
  elements.extractBtn.addEventListener("click", extractCaptions);

  // Enter key in URL input
  elements.urlInput.addEventListener("keypress", function (e) {
	if (e.key === "Enter") {
	  extractCaptions();
	}
  });

  // URL input validation
  elements.urlInput.addEventListener("input", validateUrlInput);

  // Copy button
  elements.copyBtn.addEventListener("click", copyCaptions);

  // Download button
  elements.downloadBtn.addEventListener("click", downloadCaptions);
}

// Validate URL input
function validateUrlInput() {
  const url = elements.urlInput.value.trim();
  const isValid = url === "" || isValidYouTubeUrl(url);

  elements.urlInput.style.borderColor = isValid
	? "var(--border)"
	: "var(--error)";
  elements.extractBtn.disabled = !url || !isValid;
}

// Check if URL is valid YouTube URL
function isValidYouTubeUrl(url) {
  const youtubeRegex =
	/^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/.+$/i;
  return youtubeRegex.test(url);
}

// Extract video ID from URL
function extractVideoId(url) {
  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (shortMatch) return shortMatch[1];

  const longMatch = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (longMatch) return longMatch[1];

  return null;
}

// Fetch video information using YouTube oEmbed API (no API key required)
async function fetchVideoInfo(videoId) {
  try {
	const response = await fetch(
	  `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
	);

	if (response.ok) {
	  const data = await response.json();
	  return {
		title: data.title,
		author: data.author_name,
		thumbnail: data.thumbnail_url,
		duration: null, // oEmbed doesn't provide duration
	  };
	}
  } catch (error) {
	console.warn("Could not fetch video info:", error);
  }

  // Fallback: basic info
  return {
	title: `YouTube Video ${videoId}`,
	author: "Unknown Channel",
	thumbnail: null,
	duration: null,
  };
}

// Main extraction function
async function extractCaptions() {
  const url = elements.urlInput.value.trim();

  if (!url || !isValidYouTubeUrl(url)) {
	showError("Please enter a valid YouTube URL");
	return;
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
	showError("Could not extract video ID from URL");
	return;
  }

  hideAllSections();
  showLoading();

  try {
	// Fetch video info and captions in parallel
	const [videoInfoPromise, captionsPromise] = await Promise.allSettled([
	  fetchVideoInfo(videoId),
	  fetch(`${CONFIG.API_BASE_URL}/extract`, {
		method: "POST",
		headers: {
		  "Content-Type": "application/json",
		},
		body: JSON.stringify({ youtube_url: url }),
	  }),
	]);

	// Handle video info
	if (videoInfoPromise.status === "fulfilled") {
	  currentVideoData = videoInfoPromise.value;
	  showVideoInfo(videoId, currentVideoData);
	}

	// Handle captions
	if (captionsPromise.status === "fulfilled") {
	  const response = captionsPromise.value;
	  const data = await response.json();

	  if (response.ok) {
		currentCaptions = data.captions;
		currentVideoId = data.video_id;
		showResults(data);
	  } else {
		throw new Error(data.detail || "Failed to extract captions");
	  }
	} else {
	  throw captionsPromise.reason;
	}
  } catch (error) {
	console.error("Error:", error);

	if (error.name === "TypeError" && error.message.includes("fetch")) {
	  showError(
		"Cannot connect to the API server. Please make sure the backend is running on localhost:8000"
	  );
	} else {
	  showError(error.message || "An unexpected error occurred");
	}
  } finally {
	hideLoading();
  }
}

// Show loading state
function showLoading() {
  elements.loadingSection.classList.remove("hidden");
  elements.extractBtn.disabled = true;
  elements.extractBtn.innerHTML =
	'<i class="fas fa-spinner fa-spin"></i> Extracting...';
}

// Hide loading state
function hideLoading() {
  elements.loadingSection.classList.add("hidden");
  elements.extractBtn.disabled = false;
  elements.extractBtn.innerHTML =
	'<i class="fas fa-download"></i> Extract Captions';
}

// Show video information
function showVideoInfo(videoId, videoData) {
  elements.videoTitle.textContent = videoData.title;
  elements.videoMeta.textContent = `by ${videoData.author}`;
  elements.videoEmbed.src = `https://www.youtube.com/embed/${videoId}`;
  elements.videoSection.classList.remove("hidden");

  // Scroll to video
  elements.videoSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Show results
function showResults(data) {
  elements.captionsText.value = data.captions;
  elements.videoId.textContent = `Video ID: ${data.video_id}`;
  elements.captionLength.textContent = `${data.captions.length.toLocaleString()} characters`;
  elements.resultSection.classList.remove("hidden");

  // Scroll to results
  elements.resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Show error
function showError(message) {
  elements.errorText.textContent = message;
  elements.errorSection.classList.remove("hidden");
}

// Hide all sections
function hideAllSections() {
  elements.loadingSection.classList.add("hidden");
  elements.videoSection.classList.add("hidden");
  elements.resultSection.classList.add("hidden");
  elements.errorSection.classList.add("hidden");
}

// Copy captions to clipboard
async function copyCaptions() {
  if (!currentCaptions) return;

  try {
	await navigator.clipboard.writeText(currentCaptions);

	// Visual feedback
	const originalText = elements.copyBtn.innerHTML;
	elements.copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
	elements.copyBtn.classList.add("copy-success");

	setTimeout(() => {
	  elements.copyBtn.innerHTML = originalText;
	  elements.copyBtn.classList.remove("copy-success");
	}, 2000);
  } catch (error) {
	console.error("Failed to copy:", error);

	// Fallback for older browsers
	elements.captionsText.select();
	document.execCommand("copy");

	showTemporaryMessage(
	  elements.copyBtn,
	  '<i class="fas fa-check"></i> Copied!',
	  2000
	);
  }
}

// Download captions as text file
function downloadCaptions() {
  if (!currentCaptions) return;

  const blob = new Blob([currentCaptions], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `youtube-captions-${currentVideoId || "unknown"}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);

  // Visual feedback
  showTemporaryMessage(
	elements.downloadBtn,
	'<i class="fas fa-check"></i> Downloaded!',
	2000
  );
}

// Show temporary message on button
function showTemporaryMessage(button, message, duration) {
  const originalText = button.innerHTML;
  button.innerHTML = message;
  button.classList.add("copy-success");

  setTimeout(() => {
	button.innerHTML = originalText;
	button.classList.remove("copy-success");
  }, duration);
}

// Utility functions for better UX
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
	const later = () => {
	  clearTimeout(timeout);
	  func(...args);
	};
	clearTimeout(timeout);
	timeout = setTimeout(later, wait);
  };
}

// Add some demo functionality
function loadDemoVideo() {
  elements.urlInput.value = "https://www.youtube.com/watch?v=M7lc1UVf-VE";
  validateUrlInput();
}

// Keyboard shortcuts
document.addEventListener("keydown", function (e) {
  // Ctrl/Cmd + Enter to extract
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
	e.preventDefault();
	extractCaptions();
  }

  // Escape to clear/reset
  if (e.key === "Escape") {
	hideAllSections();
	elements.urlInput.focus();
  }
});

// Add a demo button (optional)
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  const demoContainer = document.createElement("div");
  demoContainer.className = "demo-container";
  demoContainer.innerHTML = `
	<button class="demo-btn" onclick="loadDemoVideo(); return false;">
	  <i class="fas fa-play-circle"></i>
	  <span>Load Demo Video</span>
	</button>
  `;

  const inputSection = document.querySelector(".input-section");
  inputSection.appendChild(demoContainer);
}

// Error handling for network issues
window.addEventListener("online", function () {
  console.log("Connection restored");
});

window.addEventListener("offline", function () {
  showError("No internet connection. Please check your network and try again.");
});

// Performance monitoring (optional)
if ("performance" in window) {
  window.addEventListener("load", function () {
	setTimeout(() => {
	  const loadTime =
		performance.timing.loadEventEnd - performance.timing.navigationStart;
	  console.log(`Page loaded in ${loadTime}ms`);
	}, 0);
  });
}
