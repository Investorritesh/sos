class Storage {
    static get(key, defaultValue = null) {
        const value = localStorage.getItem(key);
        try {
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            return value || defaultValue;
        }
    }

    static save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    static getInitialData() {
        return {
            subjects: [],
            stats: {
                totalHours: 0,
                streak: 0,
                lastStudyDate: null,
                totalXP: 0,
                level: 1
            },
            dailyLogs: {}, // date: { hours: 0, topics: 0 }
            distractions: []
        };
    }

    static init() {
        if (!localStorage.getItem('neuroflow_data')) {
            this.save('neuroflow_data', this.getInitialData());
        }
        return this.get('neuroflow_data');
    }

    static update(updater) {
        const data = this.get('neuroflow_data');
        updater(data);
        this.save('neuroflow_data', data);
    }
}

// Export for use in other files
window.Storage = Storage;
