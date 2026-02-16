class Timer {
    constructor() {
        this.minutesDisplay = document.getElementById('minutes');
        this.secondsDisplay = document.getElementById('seconds');
        this.startButton = document.getElementById('start-timer');
        this.resetButton = document.getElementById('reset-timer');
        this.timerContainer = document.querySelector('.timer-container');
        this.modeButtons = document.querySelectorAll('.timer-mode-btn');

        this.timerId = null;
        this.timeLeft = 25 * 60;
        this.isRunning = false;
        this.currentMode = 25;

        this.init();
    }

    init() {
        this.startButton.addEventListener('click', () => this.toggleTimer());
        this.resetButton.addEventListener('click', () => this.resetTimer());

        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMode = parseInt(btn.dataset.time);
                this.resetTimer();
            });
        });
    }

    updateDisplay() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        this.minutesDisplay.textContent = mins.toString().padStart(2, '0');
        this.secondsDisplay.textContent = secs.toString().padStart(2, '0');

        // Update document title for easy tracking
        document.title = `${mins}:${secs.toString().padStart(2, '0')} | NeuroFlow`;
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        this.isRunning = true;
        this.startButton.textContent = 'PAUSE';
        this.timerContainer.classList.add('active');

        this.timerId = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        this.startButton.textContent = 'RESUME';
        this.timerContainer.classList.remove('active');
        clearInterval(this.timerId);
    }

    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.currentMode * 60;
        this.startButton.textContent = 'START SESSION';
        this.updateDisplay();
        document.title = 'NeuroFlow | AI-Inspired Study Planner';
    }

    completeSession() {
        this.resetTimer();
        this.playNotification();

        // Log study time
        const durationHours = this.currentMode / 60;
        window.app.addStudySession(durationHours);

        alert(`Great job! You completed a ${this.currentMode} min session.`);
    }

    playNotification() {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play();
    }
}

window.Timer = Timer;
