class Analytics {
    constructor() {
        this.charts = {};
    }

    init(data) {
        this.renderDailyIntensity(data);
        this.renderConsistency(data);
        this.renderSubjectDistribution(data);
        this.renderDistractionVsFocus(data);
    }

    renderDailyIntensity(data) {
        const ctx = document.getElementById('dailyIntensityChart')?.getContext('2d');
        if (!ctx) return;

        const dates = this.getLastNDays(7);
        const hours = dates.map(date => data.dailyLogs[date]?.hours || 0);

        // Don't render if no data at all
        const hasData = hours.some(h => h > 0);
        if (!hasData && this.charts.intensity) {
            this.charts.intensity.destroy();
            return;
        }

        if (this.charts.intensity) this.charts.intensity.destroy();

        this.charts.intensity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates.map(d => d.split('-').slice(1).join('/')),
                datasets: [{
                    label: 'Study Hours',
                    data: hours,
                    backgroundColor: 'rgba(0, 242, 255, 0.5)',
                    borderColor: '#00f2ff',
                    borderWidth: 2,
                    borderRadius: 5
                }]
            },
            options: this.getChartOptions()
        });
    }

    renderConsistency(data) {
        const ctx = document.getElementById('consistencyChart')?.getContext('2d');
        if (!ctx) return;

        const dates = this.getLastNDays(14);
        const hours = dates.map(date => data.dailyLogs[date]?.hours || 0);

        const hasData = hours.some(h => h > 0);
        if (!hasData && this.charts.consistency) {
            this.charts.consistency.destroy();
            return;
        }

        if (this.charts.consistency) this.charts.consistency.destroy();

        this.charts.consistency = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(d => d.split('-').slice(2).join('')),
                datasets: [{
                    label: 'Efficiency',
                    data: hours,
                    borderColor: '#bc13fe',
                    backgroundColor: 'rgba(188, 19, 254, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                }]
            },
            options: this.getChartOptions()
        });
    }

    renderSubjectDistribution(data) {
        const ctx = document.getElementById('subjectDistributionChart')?.getContext('2d');
        if (!ctx) return;

        const labels = data.subjects.map(s => s.name);
        const topicCounts = data.subjects.map(s => s.topics.length);

        if (this.charts.subjects) this.charts.subjects.destroy();

        if (labels.length === 0) return;

        this.charts.subjects = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: topicCounts,
                    backgroundColor: [
                        '#00f2ff', '#bc13fe', '#2979ff', '#ff0055', '#70ff00'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#a0a0a0' }
                    }
                }
            }
        });
    }

    renderDistractionVsFocus(data) {
        const ctx = document.getElementById('distractionVsFocusChart')?.getContext('2d');
        if (!ctx) return;

        const focusHours = data.stats.totalHours;
        const distractionHours = data.distractions.reduce((acc, d) => acc + (d.duration / 60), 0);

        if (this.charts.distractions) this.charts.distractions.destroy();

        this.charts.distractions = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Focus Time', 'Distractions'],
                datasets: [{
                    data: [focusHours, distractionHours],
                    backgroundColor: ['#00f2ff', '#ff4d00'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#a0a0a0' }
                    }
                }
            }
        });
    }

    getLastNDays(n) {
        const dates = [];
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    }

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#a0a0a0' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#a0a0a0' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        };
    }
}

window.Analytics = Analytics;
