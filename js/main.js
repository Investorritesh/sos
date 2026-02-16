class NeuroFlow {
    constructor() {
        this.storage = window.Storage;
        this.data = this.storage.init();

        this.ui = new window.UI();
        this.timer = new window.Timer();
        this.analytics = new window.Analytics();

        this.init();
    }

    init() {
        this.ui.initNavigation();
        this.updateAllUI();
        this.setupEventListeners();

        // Initial chart render
        this.analytics.init(this.data);
    }

    setupEventListeners() {
        // Mobile Toggle
        const mobileToggle = document.getElementById('mobile-toggle');
        const sidebar = document.querySelector('.sidebar');
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            mobileToggle.querySelector('i').classList.toggle('fa-bars');
            mobileToggle.querySelector('i').classList.toggle('fa-times');
        });

        // Close sidebar on nav click (mobile)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    mobileToggle.querySelector('i').classList.add('fa-bars');
                    mobileToggle.querySelector('i').classList.remove('fa-times');
                }
            });
        });

        document.getElementById('add-subject-btn').addEventListener('click', () => {
            this.promptAddSubject();
        });

        document.getElementById('distraction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleDistractionLog();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.ui.hideModal();
        });
    }

    updateAllUI() {
        this.ui.renderStats(this.data.stats);
        this.ui.renderRoadmap(this.data.subjects);
        this.ui.renderDashboard(this.data);
    }

    // --- Subject & Topic Management ---

    promptAddSubject() {
        const name = prompt("Enter Subject Name (e.g., JavaScript, React):");
        if (name && name.trim()) {
            this.data.subjects.push({
                id: Date.now(),
                name: name.trim(),
                topics: []
            });
            this.saveAndUpdate();
        } else if (name !== null) {
            alert("Subject name cannot be empty.");
        }
    }

    deleteSubject(index) {
        if (confirm(`Are you sure you want to delete "${this.data.subjects[index].name}"?`)) {
            this.data.subjects.splice(index, 1);
            this.saveAndUpdate();
        }
    }

    promptAddTopic(subjectIndex) {
        const name = prompt("Enter Topic Name:");
        if (name && name.trim()) {
            const difficulty = prompt("Difficulty (easy, medium, hard):", "medium") || "medium";
            this.data.subjects[subjectIndex].topics.push({
                id: Date.now(),
                name: name.trim(),
                difficulty: difficulty.toLowerCase(),
                completed: false
            });
            this.saveAndUpdate();
        } else if (name !== null) {
            alert("Topic name cannot be empty.");
        }
    }

    deleteTopic(subIndex, topIndex) {
        const topic = this.data.subjects[subIndex].topics[topIndex];
        if (confirm(`Delete topic "${topic.name}"?`)) {
            if (topic.completed) {
                this.addXP(-50);
                this.logDailyTopic(-1);
            }
            this.data.subjects[subIndex].topics.splice(topIndex, 1);
            this.saveAndUpdate();
        }
    }

    toggleTopic(subIndex, topIndex) {
        const topic = this.data.subjects[subIndex].topics[topIndex];
        topic.completed = !topic.completed;

        if (topic.completed) {
            this.addXP(50);
            this.logDailyTopic();
        } else {
            this.addXP(-50);
            this.logDailyTopic(-1);
        }

        this.saveAndUpdate();
    }

    // --- Stats & XP ---

    addStudySession(hours) {
        const today = new Date().toISOString().split('T')[0];

        // Update stats
        this.data.stats.totalHours += hours;

        // Update daily logs
        if (!this.data.dailyLogs[today]) {
            this.data.dailyLogs[today] = { hours: 0, topics: 0 };
        }
        this.data.dailyLogs[today].hours += hours;

        // Add XP (100 XP per hour)
        this.addXP(Math.round(hours * 100));

        // Check streak
        this.updateStreak();

        this.saveAndUpdate();
    }

    logDailyTopic(count = 1) {
        const today = new Date().toISOString().split('T')[0];
        if (!this.data.dailyLogs[today]) {
            this.data.dailyLogs[today] = { hours: 0, topics: 0 };
        }
        this.data.dailyLogs[today].topics += count;
    }

    addXP(amount) {
        this.data.stats.totalXP += amount;
        if (this.data.stats.totalXP < 0) this.data.stats.totalXP = 0;

        // Level up every 1000 XP
        this.data.stats.level = Math.floor(this.data.stats.totalXP / 1000) + 1;
    }

    updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = this.data.stats.lastStudyDate;

        if (!lastDate) {
            this.data.stats.streak = 1;
        } else {
            const last = new Date(lastDate);
            const curr = new Date(today);
            const diffTime = Math.abs(curr - last);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                this.data.stats.streak += 1;
            } else if (diffDays > 1) {
                this.data.stats.streak = 1;
            }
        }
        this.data.stats.lastStudyDate = today;
    }

    handleDistractionLog() {
        const reason = document.getElementById('distraction-reason').value;
        const duration = parseInt(document.getElementById('distraction-duration').value);

        if (duration) {
            this.data.distractions.push({
                reason,
                duration,
                date: new Date().toISOString()
            });

            this.saveAndUpdate();
            document.getElementById('distraction-form').reset();
            alert("Distraction logged. Stay focused, you can do it!");
        }
    }

    // --- Persistence & Sync ---

    saveAndUpdate() {
        this.storage.save('neuroflow_data', this.data);
        this.updateAllUI();
        this.refreshCharts();
    }

    refreshCharts() {
        this.analytics.init(this.data);
    }
}

// Global App Instance
window.onload = () => {
    window.app = new NeuroFlow();
};
