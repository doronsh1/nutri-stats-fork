class NavigationBar {
    constructor() {
        this.loadNavbar();
        this.currentPath = window.location.pathname;
    }

    async loadNavbar() {
        try {
            // Load the navbar HTML
            const response = await fetch('/components/navbar.html');
            if (!response.ok) throw new Error('Failed to load navbar');
            const navbarHtml = await response.text();

            // Insert the navbar at the start of the body
            document.body.insertAdjacentHTML('afterbegin', navbarHtml);

            // Set active state for current page
            this.setActiveLink();

            // Load user display
            this.loadUserDisplay();
        } catch (error) {
            console.error('Error loading navbar:', error);
        }
    }

    setActiveLink() {
        // Remove any existing active classes
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === this.currentPath) {
                link.classList.add('active');
            }
        });
    }

    async loadUserDisplay() {
        try {
            const response = await fetch('/api/settings');
            if (!response.ok) throw new Error('Failed to load settings');
            const settings = await response.json();
            
            const userDisplay = document.getElementById('userDisplay');
            if (userDisplay && settings.userName) {
                userDisplay.textContent = settings.userName;
            }
        } catch (error) {
            console.error('Error loading user display:', error);
        }
    }
}

// Initialize navigation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NavigationBar();
}); 