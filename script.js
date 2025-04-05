// Database Service
class Database {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('studyhub-users')) || [];
    this.notes = JSON.parse(localStorage.getItem('studyhub-notes')) || [];
    this.currentUser = JSON.parse(localStorage.getItem('studyhub-currentUser')) || null;
    this.initDemoData();
  }

  initDemoData() {
    if (this.users.length === 0) {
      this.users = [{
        id: 1,
        fullName: "John Smith",
        email: "johnsmith@gmail.com",
        password: this.hashPassword("password123"),
        university: "State University",
        major: "Computer Science",
        year: "Junior"
      }];
      this.saveUsers();
    }

    if (this.notes.length === 0) {
      this.notes = [
        {
          id: 1,
          userId: 1,
          title: "Introduction to Economics",
          semester: "Fall 2023",
          pages: 42,
          description: "Complete semester notes covering supply and demand...",
          uploadDate: "2023-10-15",
          fileType: "PDF"
        }
      ];
      this.saveNotes();
    }
  }

  hashPassword(password) {
    return CryptoJS.SHA256(password).toString();
  }

  saveUsers() {
    localStorage.setItem('studyhub-users', JSON.stringify(this.users));
  }

  saveNotes() {
    localStorage.setItem('studyhub-notes', JSON.stringify(this.notes));
  }

  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem('studyhub-currentUser', JSON.stringify(user));
    this.updateUI();
  }

  clearCurrentUser() {
    this.currentUser = null;
    localStorage.removeItem('studyhub-currentUser');
    this.updateUI();
  }

  getUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  addUser(user) {
    const newUser = {
      ...user,
      id: this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1
    };
    this.users.push(newUser);
    this.saveUsers();
    return newUser;
  }

  updateUser(updatedUser) {
    const index = this.users.findIndex(user => user.id === updatedUser.id);
    if (index !== -1) {
      this.users[index] = updatedUser;
      this.saveUsers();
      if (this.currentUser && this.currentUser.id === updatedUser.id) {
        this.setCurrentUser(updatedUser);
      }
      return true;
    }
    return false;
  }

  updateUI() {
    // Update UI based on authentication state
    const authElements = document.querySelectorAll('[data-auth-state]');
    authElements.forEach(el => {
      if (this.currentUser) {
        el.style.display = el.dataset.authState === 'logged-in' ? 'block' : 'none';
      } else {
        el.style.display = el.dataset.authState === 'logged-out' ? 'block' : 'none';
      }
    });

    // Update profile info if on profile page
    if (window.location.pathname.includes('profile') && !this.currentUser) {
      this.router.navigateTo('/login');
    }
  }
}

// Router Service
class Router {
  constructor() {
    this.routes = {
      '/': 'index-page',
      '/login': 'login-page',
      '/register': 'register-page',
      '/profile': 'profile-page',
      '/browse': 'browse-page'
    };

    window.addEventListener('popstate', () => this.loadPage());
    this.loadPage();
  }

  navigateTo(path) {
    window.history.pushState({}, '', path);
    this.loadPage();
  }

  async loadPage() {
    const path = window.location.pathname;
    const pageId = this.routes[path] || 'index-page';
    
    try {
      const response = await fetch(`pages/${pageId}.html`);
      const html = await response.text();
      document.getElementById('app').innerHTML = html;
      
      // Initialize page-specific JS
      this.initPage(pageId);
      
      // Scroll to top
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Failed to load page:', error);
      this.navigateTo('/');
    }
  }

  initPage(pageId) {
    // Initialize page-specific functionality
    switch(pageId) {
      case 'login-page':
        this.initLoginPage();
        break;
      case 'register-page':
        this.initRegisterPage();
        break;
      // ... other pages
    }
  }

  initLoginPage() {
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const user = db.getUserByEmail(email);
        if (user && user.password === db.hashPassword(password)) {
          db.setCurrentUser(user);
          showToast('Logged in successfully!', 'success');
          this.navigateTo('/profile');
        } else {
          showToast('Invalid email or password', 'error');
        }
      });
    }
  }
}

// UI Service
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.opacity = '0';
  }, 3000);
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(`${inputId}-icon`);
  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = '👁️‍🗨️';
  } else {
    input.type = 'password';
    icon.textContent = '👁️';
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // Set current year in footer
  document.getElementById('current-year').textContent = new Date().getFullYear();
  
  // Initialize services
  const db = new Database();
  const router = new Router();
  
  // Make services globally available (for demo purposes)
  window.db = db;
  window.router = router;
  window.showToast = showToast;
  window.togglePasswordVisibility = togglePasswordVisibility;
});