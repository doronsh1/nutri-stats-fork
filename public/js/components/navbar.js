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

            // Load authentication state and user display
            this.loadAuthenticatedUser();

            // Load version information
            this.loadVersionInfo();
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

    async loadAuthenticatedUser() {
        try {
            // Check if user is authenticated
            const authResponse = await API.auth.me();
            const authData = await authResponse.json();
            this.showAuthenticatedUser(authData.user);
            this.setupLogoutHandler();
        } catch (error) {
            // Only log errors and redirect on protected pages
            if (!isPublicPage()) {
                console.error('Error checking authentication:', error);
                this.redirectToLogin();
            }
            this.showLoginPrompt();
        }
    }

    showAuthenticatedUser(user) {
        const userMenu = document.getElementById('userMenu');
        const loginPrompt = document.getElementById('loginPrompt');
        const userName = document.getElementById('userName');

        if (userMenu) userMenu.style.display = 'flex';
        if (loginPrompt) loginPrompt.style.display = 'none';
        if (userName) userName.textContent = user.name;
    }

    showLoginPrompt() {
        const userMenu = document.getElementById('userMenu');
        const loginPrompt = document.getElementById('loginPrompt');

        if (userMenu) userMenu.style.display = 'none';
        if (loginPrompt) loginPrompt.style.display = 'block';
    }

    setupLogoutHandler() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    // Use the auth manager's logout method for consistency
                    await auth.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                    alert('Logout failed. Please try again.');
                }
            });
        }
    }

    async loadVersionInfo() {
        try {
            const response = await fetch('/api/version');
            const versionData = await response.json();

            const versionText = document.getElementById('versionText');
            const versionInfo = document.getElementById('versionInfo');

            if (versionText) {
                versionText.textContent = versionData.fullVersion;
            }

            if (versionInfo) {
                // Add click handler to show detailed version info
                versionInfo.addEventListener('click', () => {
                    const details = [
                        `Version: ${versionData.version}`,
                        `Git Hash: ${versionData.gitHash}`,
                        `Branch: ${versionData.gitBranch}`,
                        `Commit Date: ${new Date(versionData.commitDate).toLocaleString()}`,
                        `Build Date: ${new Date(versionData.buildDate).toLocaleString()}`
                    ].join('\n');

                    alert(`Food Diary Version Info\n\n${details}`);
                });

                // Update tooltip with build date
                versionInfo.title = `Built: ${new Date(versionData.buildDate).toLocaleString()}`;
            }
        } catch (error) {
            console.error('Error loading version info:', error);
            const versionText = document.getElementById('versionText');
            if (versionText) {
                versionText.textContent = 'v1.0.0-dev';
            }
        }
    }

    redirectToLogin() {
        // Small delay to prevent immediate redirect flashing
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 100);
    }
}

// Initialize navigation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NavigationBar();
}); 