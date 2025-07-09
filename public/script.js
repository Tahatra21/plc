class ProductLifecycleManager {
    constructor() {
        this.products = [];
        this.users = [];
        this.currentUser = null;
        this.editingUserId = null;
        this.currentEditId = null;
        this.charts = {};
        this.currentTab = 'overview';
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuth();
        
        // Initialize components
        this.bindEvents();
        this.setupTabNavigation();
        this.initializeAOS();
        
        // Load initial data
        await this.loadProducts();
        this.initializeCharts();
        this.switchTab('dashboard');
    }

    async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Invalid token');
            }

            const data = await response.json();
            this.currentUser = data.user;
            
            // Update UI with user info
            const userFullNameEl = document.getElementById('userFullName');
            const userRoleEl = document.getElementById('userRole');
            if (userFullNameEl) userFullNameEl.textContent = this.currentUser.full_name || this.currentUser.username;
            if (userRoleEl) userRoleEl.textContent = this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
            
            // Show user management menu for admin
            if (this.currentUser.role === 'admin') {
                const usersMenuItem = document.getElementById('usersMenuItem');
                if (usersMenuItem) usersMenuItem.style.display = 'block';
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    }

    initializeAOS() {
        // Initialize AOS animations
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-in-out',
                once: true
            });
        }
    }

    bindEvents() {
        // Modal controls
        const addProductBtn = document.getElementById('addProductBtn');
        const closeBtn = document.querySelector('.close-btn');
        const cancelBtn = document.getElementById('cancelBtn');
        const productForm = document.getElementById('productForm');
        
        if (addProductBtn) addProductBtn.addEventListener('click', () => this.openModal());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        if (productForm) productForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Sidebar toggle untuk mobile responsiveness
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('collapsed');
            });
        }
        
        // Filters
        const lifecycleFilter = document.getElementById('lifecycleFilter');
        const searchInput = document.getElementById('searchInput');
        if (lifecycleFilter) lifecycleFilter.addEventListener('change', () => this.filterProducts());
        if (searchInput) searchInput.addEventListener('input', () => this.filterProducts());
        
        // User management events
        const addUserBtn = document.getElementById('addUserBtn');
        const closeUserModal = document.getElementById('closeUserModal');
        const cancelUserBtn = document.getElementById('cancelUserBtn');
        const userForm = document.getElementById('userForm');
        
        if (addUserBtn) addUserBtn.addEventListener('click', () => this.openUserModal());
        if (closeUserModal) closeUserModal.addEventListener('click', () => this.closeUserModal());
        if (cancelUserBtn) cancelUserBtn.addEventListener('click', () => this.closeUserModal());
        if (userForm) userForm.addEventListener('submit', (e) => this.handleUserFormSubmit(e));
        
        // Logout event
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
        
        // Sidebar menu navigation - PERBAIKAN: gunakan selector yang sesuai dengan HTML
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = item.getAttribute('data-tab');
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });
        
        // Hapus atau komentari bagian ini karena tidak sesuai dengan struktur HTML
        // document.querySelectorAll('.menu-item').forEach(item => {
        //     item.addEventListener('click', (e) => {
        //         e.preventDefault();
        //         const tabName = item.getAttribute('data-tab');
        //         this.switchTab(tabName);
        //     });
        // });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('productModal');
            const userModal = document.getElementById('userModal');
            if (e.target === modal) {
                this.closeModal();
            }
            if (e.target === userModal) {
                this.closeUserModal();
            }
        });
    }

    setupTabNavigation() {
        // This method is now handled in bindEvents for sidebar menu
        // Keep for backward compatibility if there are other nav-tab elements
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update active sidebar menu
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.classList.remove('active');
        });
        const activeMenuItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }
        
        // Show/hide tab content
        document.querySelectorAll('.content-section').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetContent = document.getElementById(tabName);
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        this.currentTab = tabName;
        
        // Execute specific functions for each menu
        this.executeMenuFunction(tabName);
    }

    async executeMenuFunction(tabName) {
        switch(tabName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'products':
                await this.loadProductCatalog();
                break;
            case 'lifecycle':
                await this.loadLifecycleAnalysis();
                break;
            case 'analytics':
                await this.loadAdvancedAnalytics();
                break;
            case 'users':
                await this.loadUserManagement();
                break;
            case 'reports':
                await this.loadReports();
                break;
            default:
                console.log('Unknown tab:', tabName);
        }
    }

    // Dashboard Functions
    loadDashboard() {
        console.log('Loading Dashboard...');
        this.loadProducts().then(() => {
            this.updateStats();
            this.updateCharts();
            this.loadRecentActivities();
        });
        this.showNotification('Dashboard loaded successfully', 'success');
    }

    // Product Catalog Functions
    loadProductCatalog() {
        console.log('Loading Product Catalog...');
        this.loadProducts();
        this.setupProductFilters();
        this.showNotification('Product catalog loaded', 'info');
    }

    setupProductFilters() {
        // Setup additional product-specific filters
        const productSearch = document.getElementById('productSearch');
        if (productSearch) {
            productSearch.addEventListener('input', (e) => {
                this.filterProductsBySearch(e.target.value);
            });
        }
    }

    filterProductsBySearch(searchTerm) {
        const filtered = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.segment && product.segment.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        this.renderProducts(filtered);
    }

    // Lifecycle Analysis Functions
    loadLifecycleAnalysis() {
        console.log('Loading Lifecycle Analysis...');
        this.initTimelineChart();
        this.initTransitionMatrix();
        this.generateLifecycleInsights();
        this.showNotification('Lifecycle analysis loaded', 'info');
    }

    initTransitionMatrix() {
        const ctx = document.getElementById('transitionChart');
        if (!ctx) return;
        
        // Create transition matrix chart
        new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Introduction → Growth', 'Growth → Maturity', 'Maturity → Decline', 'Decline → Discontinued'],
                datasets: [{
                    data: [30, 45, 20, 5],
                    backgroundColor: [
                        'rgba(6, 182, 212, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    generateLifecycleInsights() {
        // Generate insights based on current product data
        const insights = this.analyzeLifecycleData();
        console.log('Lifecycle insights generated:', insights);
    }

    analyzeLifecycleData() {
        const stats = {
            Introduction: 0,
            Growth: 0,
            Maturity: 0,
            Decline: 0
        };

        this.products.forEach(product => {
            stats[product.lifecycle_stage]++;
        });

        return {
            totalProducts: this.products.length,
            stageDistribution: stats,
            recommendations: this.generateRecommendations(stats)
        };
    }

    generateRecommendations(stats) {
        const recommendations = [];
        
        if (stats.Introduction > stats.Growth) {
            recommendations.push('Consider focusing on growth strategies for introduction-stage products');
        }
        
        if (stats.Decline > 0) {
            recommendations.push(`${stats.Decline} products in decline stage need attention`);
        }
        
        return recommendations;
    }

    // Advanced Analytics Functions
    loadAdvancedAnalytics() {
        console.log('Loading Advanced Analytics...');
        this.initRevenueChart();
        this.initPerformanceMatrix();
        this.generateAdvancedMetrics();
        this.showNotification('Advanced analytics loaded', 'info');
    }

    generateAdvancedMetrics() {
        // Calculate advanced metrics
        const metrics = {
            averageLifecycleTime: this.calculateAverageLifecycleTime(),
            revenueByStage: this.calculateRevenueByStage(),
            growthRate: this.calculateGrowthRate()
        };
        
        console.log('Advanced metrics:', metrics);
        return metrics;
    }

    calculateAverageLifecycleTime() {
        // Calculate average time products spend in each stage
        return 'Not implemented yet';
    }

    calculateRevenueByStage() {
        const revenueByStage = {
            Introduction: 0,
            Growth: 0,
            Maturity: 0,
            Decline: 0
        };

        this.products.forEach(product => {
            if (product.price) {
                revenueByStage[product.lifecycle_stage] += parseFloat(product.price);
            }
        });

        return revenueByStage;
    }

    calculateGrowthRate() {
        // Calculate growth rate based on historical data
        return 'Not implemented yet';
    }

    // User Management Methods
    async loadUserManagement() {
        if (this.currentUser.role !== 'admin') {
            this.showNotification('Access denied. Admin privileges required.', 'error');
            return;
        }
        
        try {
            await this.loadUsers();
            this.showNotification('User management loaded', 'info');
        } catch (error) {
            console.error('Error loading user management:', error);
            this.showNotification('Failed to load user management', 'error');
        }
    }

    async loadUsers() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load users');
            }

            this.users = await response.json();
            this.renderUsers();
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Failed to load users', 'error');
        }
    }

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        this.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.full_name || '-'}</td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge role-${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                </td>
                <td>
                    <span class="status-badge ${user.is_active ? 'active' : 'inactive'}">
                        ${user.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="manager.editUser(${user.id})">
                        Edit
                    </button>
                    ${user.id !== this.currentUser.id ? `
                        <button class="btn btn-sm btn-danger" onclick="manager.deleteUser(${user.id})">
                            Delete
                        </button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    openUserModal(userId = null) {
        this.editingUserId = userId;
        const modal = document.getElementById('userModal');
        const title = document.getElementById('userModalTitle');
        const form = document.getElementById('userForm');
        const passwordGroup = document.getElementById('passwordGroup');
        const statusGroup = document.getElementById('statusGroup');
        
        if (!modal || !title || !form) return;
        
        if (userId) {
            title.textContent = 'Edit User';
            if (passwordGroup) passwordGroup.style.display = 'none';
            if (statusGroup) statusGroup.style.display = 'block';
            this.populateUserForm(userId);
        } else {
            title.textContent = 'Add User';
            if (passwordGroup) passwordGroup.style.display = 'block';
            if (statusGroup) statusGroup.style.display = 'none';
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    closeUserModal() {
        const modal = document.getElementById('userModal');
        if (modal) modal.style.display = 'none';
        this.editingUserId = null;
    }

    populateUserForm(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const usernameEl = document.getElementById('userUsername');
        const emailEl = document.getElementById('userEmail');
        const fullNameEl = document.getElementById('userFullName');
        const roleEl = document.getElementById('userRole');
        const statusEl = document.getElementById('userStatus');
        
        if (usernameEl) usernameEl.value = user.username;
        if (emailEl) emailEl.value = user.email;
        if (fullNameEl) fullNameEl.value = user.full_name || '';
        if (roleEl) roleEl.value = user.role;
        if (statusEl) statusEl.value = user.is_active.toString();
    }

    async handleUserFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            full_name: formData.get('full_name'),
            role: formData.get('role')
        };

        if (!this.editingUserId) {
            userData.password = formData.get('password');
        } else {
            userData.is_active = formData.get('is_active') === 'true';
        }

        try {
            const token = localStorage.getItem('token');
            const url = this.editingUserId ? `/api/users/${this.editingUserId}` : '/api/users';
            const method = this.editingUserId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save user');
            }

            await this.loadUsers();
            this.closeUserModal();
            this.showNotification(this.editingUserId ? 'User updated successfully' : 'User created successfully', 'success');
        } catch (error) {
            console.error('Error saving user:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async editUser(userId) {
        this.openUserModal(userId);
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete user');
            }

            await this.loadUsers();
            this.showNotification('User deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async logout() {
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    }

    // Reports Functions
    loadReports() {
        console.log('Loading Reports...');
        this.generateProductReport();
        this.generateLifecycleReport();
        this.generatePerformanceReport();
        this.showNotification('Reports generated successfully', 'success');
    }

    generateProductReport() {
        const report = {
            totalProducts: this.products.length,
            productsByCategory: this.groupProductsByCategory(),
            productsByStage: this.groupProductsByStage(),
            generatedAt: new Date().toISOString()
        };
        
        console.log('Product Report:', report);
        return report;
    }

    generateLifecycleReport() {
        const report = {
            stageDistribution: this.analyzeLifecycleData().stageDistribution,
            recommendations: this.generateRecommendations(this.analyzeLifecycleData().stageDistribution),
            generatedAt: new Date().toISOString()
        };
        
        console.log('Lifecycle Report:', report);
        return report;
    }

    generatePerformanceReport() {
        const report = {
            metrics: this.generateAdvancedMetrics(),
            topPerformers: this.getTopPerformingProducts(),
            underPerformers: this.getUnderPerformingProducts(),
            generatedAt: new Date().toISOString()
        };
        
        console.log('Performance Report:', report);
        return report;
    }

    groupProductsByCategory() {
        const grouped = {};
        this.products.forEach(product => {
            const category = product.category || 'Uncategorized';
            if (!grouped[category]) {
                grouped[category] = 0;
            }
            grouped[category]++;
        });
        return grouped;
    }

    groupProductsByStage() {
        const grouped = {
            Introduction: 0,
            Growth: 0,
            Maturity: 0,
            Decline: 0
        };
        
        this.products.forEach(product => {
            grouped[product.lifecycle_stage]++;
        });
        
        return grouped;
    }

    getTopPerformingProducts() {
        // Return products in Growth or Maturity stage
        return this.products.filter(product => 
            product.lifecycle_stage === 'Growth' || product.lifecycle_stage === 'Maturity'
        ).slice(0, 5);
    }

    getUnderPerformingProducts() {
        // Return products in Decline stage
        return this.products.filter(product => 
            product.lifecycle_stage === 'Decline'
        );
    }

    loadRecentActivities() {
        // Load recent activities for dashboard
        const activities = [
            {
                type: 'product_added',
                message: 'New product added to catalog',
                time: '2 hours ago',
                icon: 'fas fa-plus'
            },
            {
                type: 'stage_change',
                message: 'Product moved to Growth stage',
                time: '4 hours ago',
                icon: 'fas fa-arrow-up'
            },
            {
                type: 'report_generated',
                message: 'Monthly report generated',
                time: '1 day ago',
                icon: 'fas fa-file-alt'
            }
        ];
        
        this.renderActivities(activities);
    }

    renderActivities(activities) {
        const activityFeed = document.getElementById('activityFeed');
        if (!activityFeed) return;
        
        activityFeed.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.message}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    async loadProducts() {
        try {
            this.showLoading();
            const token = localStorage.getItem('token');
            const response = await fetch('/api/products', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to load products');
            
            this.products = await response.json();
            this.renderProducts();
            this.updateStats();
            this.updateCharts();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification('Failed to load products. Please check your database connection.', 'error');
            this.hideLoading();
        }
    }

    showLoading() {
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = '<div class="loading"><div class="spinner"></div>Loading products...</div>';
        }
    }

    hideLoading() {
        // Loading will be replaced by actual content
    }

    renderProducts(productsToRender = this.products) {
        const grid = document.getElementById('productsGrid');
        
        if (!grid) {
            console.error('Products grid element not found');
            return;
        }
        
        if (productsToRender.length === 0) {
            grid.innerHTML = '<div class="loading">No products found</div>';
            return;
        }

        grid.innerHTML = productsToRender.map(product => `
            <div class="product-card ${product.lifecycle_stage.toLowerCase()} glass-card" data-aos="fade-up">
                <div class="product-header">
                    <div>
                        <div class="product-title">${product.name}</div>
                        <div class="product-category">${product.category || 'No category'}</div>
                        <div class="product-segment">${product.segment || 'No segment'}</div>
                    </div>
                    <span class="lifecycle-badge ${product.lifecycle_stage.toLowerCase()}">
                        ${product.lifecycle_stage}
                    </span>
                </div>
                
                <div class="product-description">
                    ${product.description || 'No description'}
                </div>
                
                <div class="product-details">
                    <div>
                        <strong>Launch Date:</strong><br>
                        ${product.launch_date ? new Date(product.launch_date).toLocaleDateString() : 'Unknown'}
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="btn btn-secondary btn-small" onclick="manager.editProduct(${product.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-small" onclick="manager.deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        // Refresh AOS animations for new content
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }

    updateStats() {
        const lifecycleStats = {
            Introduction: 0,
            Growth: 0,
            Maturity: 0,
            Decline: 0
        };
        
        const segmentStats = {
            'Pembangkitan': 0,
            'Transmisi': 0,
            'Distribusi': 0,
            'Korporat': 0,
            'Pelayanan Pelanggan': 0
        };
        
        // Count products by lifecycle and segment
        this.products.forEach(product => {
            // Count lifecycle stages
            if (lifecycleStats.hasOwnProperty(product.lifecycle_stage)) {
                lifecycleStats[product.lifecycle_stage]++;
            }
            
            // Count segments
            if (segmentStats.hasOwnProperty(product.segment)) {
                segmentStats[product.segment]++;
            }
        });
        
        // Update lifecycle cards
        const totalProducts = this.products.length;
        this.animateCounter('totalProducts', totalProducts);
        this.animateCounter('introductionProducts', lifecycleStats.Introduction);
        this.animateCounter('growthProducts', lifecycleStats.Growth);
        this.animateCounter('maturityProducts', lifecycleStats.Maturity);
        this.animateCounter('declineProducts', lifecycleStats.Decline);
        
        // Update segment cards
        this.animateCounter('pembangkitanProducts', segmentStats['Pembangkitan']);
        this.animateCounter('transmisiProducts', segmentStats['Transmisi']);
        this.animateCounter('distribusiProducts', segmentStats['Distribusi']);
        this.animateCounter('korporatProducts', segmentStats['Korporat']);
        this.animateCounter('pelayananProducts', segmentStats['Pelayanan Pelanggan']);
        
        // Update charts
        this.updateCharts();
    }

    updateProgressBars(stats, total) {
        const stages = ['introduction', 'growth', 'maturity', 'decline'];
        const stageKeys = ['Introduction', 'Growth', 'Maturity', 'Decline'];
        
        stages.forEach((stage, index) => {
            const progressBar = document.querySelector(`.${stage}-progress`);
            if (progressBar && total > 0) {
                const percentage = (stats[stageKeys[index]] / total) * 100;
                progressBar.style.width = `${percentage}%`;
            }
        });
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const currentValue = parseInt(element.textContent) || 0;
        const increment = targetValue > currentValue ? 1 : -1;
        const duration = 1000;
        const steps = Math.abs(targetValue - currentValue);
        
        if (steps === 0) return;
        
        const stepDuration = duration / steps;
        let current = currentValue;
        
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            
            if (current === targetValue) {
                clearInterval(timer);
            }
        }, stepDuration);
    }

    filterProducts() {
        const lifecycleFilter = document.getElementById('lifecycleFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        let filtered = this.products;

        if (lifecycleFilter) {
            filtered = filtered.filter(product => product.lifecycle_stage === lifecycleFilter);
        }

        if (searchTerm) {
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                (product.category && product.category.toLowerCase().includes(searchTerm)) ||
                (product.segment && product.segment.toLowerCase().includes(searchTerm))
            );
        }

        this.renderProducts(filtered);
    }

    openModal(product = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('productForm');
        
        if (product) {
            title.textContent = 'Edit Product';
            this.currentEditId = product.id;
            this.populateForm(product);
        } else {
            title.textContent = 'Add Product';
            this.currentEditId = null;
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('productModal').style.display = 'none';
        this.currentEditId = null;
    }

    populateForm(product) {
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productSegment').value = product.segment || '';
        document.getElementById('productLifecycle').value = product.lifecycle_stage;
        document.getElementById('productLaunchDate').value = product.launch_date ? product.launch_date.split('T')[0] : '';
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            category: document.getElementById('productCategory').value,
            segment: document.getElementById('productSegment').value,
            lifecycle_stage: document.getElementById('productLifecycle').value,
            launch_date: document.getElementById('productLaunchDate').value || null
        };

        try {
            const token = localStorage.getItem('token');
            let response;
            if (this.currentEditId) {
                response = await fetch(`/api/products/${this.currentEditId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            }

            if (!response.ok) throw new Error('Failed to save product');

            this.closeModal();
            this.loadProducts();
            this.showNotification(this.currentEditId ? 'Product updated successfully' : 'Product added successfully', 'success');
        } catch (error) {
            console.error('Error saving product:', error);
            this.showNotification('Failed to save product', 'error');
        }
    }

    async editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            this.openModal(product);
        }
    }

    async deleteProduct(id) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete product');

            this.loadProducts();
            this.showNotification('Product deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showNotification('Failed to delete product', 'error');
        }
    }

    initializeCharts() {
        this.initLifecycleChart();
        this.initTrendChart();
        this.initRevenueChart();
        this.initPerformanceMatrix();
        this.initTimelineChart();
    }

    initLifecycleChart() {
        const ctx = document.getElementById('lifecycleChart');
        if (!ctx) return;
        
        this.charts.lifecycle = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Introduction', 'Growth', 'Maturity', 'Decline'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        '#06b6d4',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'white',
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 2000
                }
            }
        });
    }

    initTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;
        
        this.charts.trend = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Introduction',
                        data: [],
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Growth',
                        data: [],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Maturity',
                        data: [],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Decline',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white'
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    initRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        
        this.charts.revenue = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Introduction', 'Growth', 'Maturity', 'Decline'],
                datasets: [{
                    label: 'Revenue (USD)',
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(6, 182, 212, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        '#06b6d4',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        callbacks: {
                            label: function(context) {
                                return `Revenue: $${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutBounce'
                }
            }
        });
    }

    initPerformanceMatrix() {
        const ctx = document.getElementById('performanceMatrix');
        if (!ctx) return;
        
        this.charts.performance = new Chart(ctx.getContext('2d'), {
            type: 'scatter',
            data: {
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Product Age (months)',
                            color: 'white'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Revenue (USD)',
                            color: 'white'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    initTimelineChart() {
        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;
        
        this.charts.timeline = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Product Lifecycle Timeline',
                    data: [],
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white'
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        if (this.charts.lifecycle) {
            const stats = {
                Introduction: 0,
                Growth: 0,
                Maturity: 0,
                Decline: 0
            };

            this.products.forEach(product => {
                stats[product.lifecycle_stage]++;
            });

            this.charts.lifecycle.data.datasets[0].data = [
                stats.Introduction,
                stats.Growth,
                stats.Maturity,
                stats.Decline
            ];
            this.charts.lifecycle.update();
        }

        if (this.charts.revenue) {
            const revenueStats = {
                Introduction: 0,
                Growth: 0,
                Maturity: 0,
                Decline: 0
            };

            this.products.forEach(product => {
                if (product.price) {
                    revenueStats[product.lifecycle_stage] += parseFloat(product.price);
                }
            });

            this.charts.revenue.data.datasets[0].data = [
                revenueStats.Introduction,
                revenueStats.Growth,
                revenueStats.Maturity,
                revenueStats.Decline
            ];
            this.charts.revenue.update();
        }
    }

    updateActivityFeed() {
        const activityFeed = document.getElementById('activityFeed');
        if (!activityFeed) return;
        
        // Generate activity items based on recent product changes
        const activities = this.products.slice(0, 5).map(product => {
            return {
                type: 'product_update',
                message: `Product "${product.name}" is in ${product.lifecycle_stage} stage`,
                timestamp: new Date().toISOString()
            };
        });
        
        activityFeed.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-content">
                    <p>${activity.message}</p>
                    <small>${new Date(activity.timestamp).toLocaleString()}</small>
                </div>
            </div>
        `).join('');
    }

    globalSearch(query) {
        if (!query) {
            this.renderProducts();
            return;
        }
        
        const filtered = this.products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(query.toLowerCase())) ||
            (product.category && product.category.toLowerCase().includes(query.toLowerCase())) ||
            (product.segment && product.segment.toLowerCase().includes(query.toLowerCase())) ||
            product.lifecycle_stage.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderProducts(filtered);
    }

    switchChartType(chartType) {
        if (this.charts.lifecycle) {
            this.charts.lifecycle.config.type = chartType;
            this.charts.lifecycle.update();
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the application
const manager = new ProductLifecycleManager();
// Keep backward compatibility
const app = manager;