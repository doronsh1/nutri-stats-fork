class Footer {
    constructor() {
        this.loadFooter();
    }

    async loadFooter() {
        try {
            // Load the footer HTML
            const response = await fetch('/components/footer.html');
            if (!response.ok) throw new Error('Failed to load footer');
            const footerHtml = await response.text();

            // Insert the footer at the end of the body
            document.body.insertAdjacentHTML('beforeend', footerHtml);

            // Load version information
            this.loadVersionInfo();
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    }

    async loadVersionInfo() {
        try {
            const response = await fetch('/api/version');
            const versionData = await response.json();
            
            const versionText = document.getElementById('footerVersionText');
            const versionInfo = document.getElementById('footerVersionInfo');
            
            if (versionText) {
                versionText.textContent = versionData.fullVersion || `v${versionData.version}`;
            }
            
            if (versionInfo) {
                // Add click handler to show version info
                versionInfo.addEventListener('click', () => {
                    const details = [
                        `Version: ${versionData.version}`,
                        `Build Date: ${new Date(versionData.buildDate).toLocaleString()}`
                    ].join('\n');
                    
                    alert(`NutriStats Version Info\n\n${details}`);
                });
                
                // Update tooltip with build date
                versionInfo.title = `Version ${versionData.version} - Built: ${new Date(versionData.buildDate).toLocaleString()}`;
            }
        } catch (error) {
            console.error('Error loading version info:', error);
            const versionText = document.getElementById('footerVersionText');
            if (versionText) {
                versionText.textContent = 'v1.0.0';
            }
        }
    }
}

// Initialize footer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Footer();
});