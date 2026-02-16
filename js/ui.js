class UI {
    constructor() {
        this.pages = document.querySelectorAll('.page');
        this.navItems = document.querySelectorAll('.nav-item');
        this.roadmapContainer = document.getElementById('roadmap-subjects');
        this.statsElements = {
            totalHours: document.getElementById('total-hours'),
            streak: document.getElementById('streak-count'),
            level: document.getElementById('user-level'),
            xp: document.getElementById('user-xp'),
            xpProgress: document.querySelector('.xp-progress')
        };
    }

    initNavigation() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = item.dataset.page;
                this.showPage(pageId);

                // Update active state
                this.navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    showPage(pageId) {
        this.pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === pageId) page.classList.add('active');
        });

        // Custom events for page entry
        if (pageId === 'analytics') window.app.refreshCharts();
    }

    renderStats(stats) {
        this.statsElements.totalHours.textContent = `${stats.totalHours.toFixed(1)}h`;
        this.statsElements.streak.textContent = `${stats.streak} Days`;
        this.statsElements.level.textContent = stats.level;
        this.statsElements.xp.textContent = stats.totalXP % 1000;

        const xpPercent = (stats.totalXP % 1000) / 10;
        this.statsElements.xpProgress.style.width = `${xpPercent}%`;
    }

    renderRoadmap(subjects) {
        this.roadmapContainer.innerHTML = subjects.length ? '' : '<div class="empty-state">No subjects yet. Add one to start your roadmap!</div>';

        subjects.forEach((subject, subIndex) => {
            const subjectCard = document.createElement('div');
            subjectCard.className = 'glass-card subject-card';

            const totalTopics = subject.topics.length;
            const completedTopics = subject.topics.filter(t => t.completed).length;
            const progress = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

            subjectCard.innerHTML = `
                <div class="subject-header">
                    <h4>${subject.name}</h4>
                    <div class="subject-actions">
                        <span class="badge">${progress}%</span>
                        <button class="btn-danger btn-sm" onclick="window.app.deleteSubject(${subIndex})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="xp-bar" style="margin-bottom: 1.5rem;">
                    <div class="xp-progress" style="width: ${progress}%; background: var(--neon-cyan)"></div>
                </div>
                <div class="topic-list">
                    ${subject.topics.length ? subject.topics.map((topic, topIndex) => `
                        <div class="task-item ${topic.completed ? 'completed' : ''}">
                            <input type="checkbox" ${topic.completed ? 'checked' : ''} 
                                onchange="window.app.toggleTopic(${subIndex}, ${topIndex})">
                            <span style="flex:1">${topic.name}</span>
                            <span class="difficulty ${topic.difficulty}">${topic.difficulty}</span>
                            <button class="btn-icon" style="color:var(--text-dim)" onclick="window.app.deleteTopic(${subIndex}, ${topIndex})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('') : '<div class="empty-state" style="padding:1rem">No topics yet</div>'}
                </div>
                <button class="btn-outline" style="width: 100%; margin-top: 1rem;" 
                    onclick="window.app.promptAddTopic(${subIndex})">
                    <i class="fas fa-plus"></i> Add Topic
                </button>
            `;
            this.roadmapContainer.appendChild(subjectCard);
        });
    }

    renderDashboard(data) {
        const today = new Date().toISOString().split('T')[0];
        const todayLogs = data.dailyLogs[today] || { hours: 0, topics: 0 };

        // Update circular progress (target 4 hours)
        const targetHours = 4;
        const percent = Math.min(Math.round((todayLogs.hours / targetHours) * 100), 100);
        const circle = document.querySelector('.progress-bar-circle');
        const offset = 377 - (377 * percent) / 100;
        circle.style.strokeDashoffset = offset;

        document.getElementById('daily-progress-percent').textContent = `${percent}%`;
        document.getElementById('today-completed-topics').textContent = `${todayLogs.topics} Topics`;
        document.getElementById('today-focus-time').textContent = `${Math.round(todayLogs.hours * 60)}m`;

        // Update priority task list from roadmap
        const priorityList = document.getElementById('priority-task-list');
        const allPending = [];
        data.subjects.forEach(sub => {
            sub.topics.forEach(top => {
                if (!top.completed) allPending.push({ ...top, subject: sub.name });
            });
        });

        priorityList.innerHTML = allPending.length ? '' : '<li class="empty-state">All caught up!</li>';
        allPending.slice(0, 5).forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `
                <i class="fas fa-circle-dot" style="color: var(--neon-cyan)"></i>
                <div style="flex:1">
                    <div style="font-weight:600">${task.name}</div>
                    <div style="font-size:0.7rem; color:var(--text-dim)">${task.subject}</div>
                </div>
                <span class="badge">${task.difficulty}</span>
            `;
            priorityList.appendChild(li);
        });
    }

    showModal(title, contentHtml) {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        content.innerHTML = `<h2>${title}</h2>${contentHtml}`;
        overlay.classList.add('active');
    }

    hideModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    }
}

window.UI = UI;
