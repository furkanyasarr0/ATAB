// ATAB - Clock, Date & Greeting Module

const ClockManager = {
  elements: {
    timeDisplay: null,
    dateDisplay: null,
    greetingDisplay: null
  },

  settings: null,
  timerInterval: null,

  init(settings) {
    this.settings = settings;
    this.elements.timeDisplay = document.getElementById('clock-time');
    this.elements.dateDisplay = document.getElementById('clock-date');
    this.elements.greetingDisplay = document.getElementById('clock-greeting');

    this.update();

    // Clear any previous interval and run every second
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => this.update(), 1000);
  },

  updateSettings(newSettings) {
    this.settings = newSettings;
    this.update();
  },

  getGreeting(hour) {
    if (hour >= 5 && hour < 12) {
      return 'Günaydın';
    } else if (hour >= 12 && hour < 18) {
      return 'İyi günler';
    } else if (hour >= 18 && hour < 22) {
      return 'İyi akşamlar';
    } else {
      return 'İyi geceler';
    }
  },

  update() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // 1. Greeting
    if (this.elements.greetingDisplay) {
      let greeting = this.getGreeting(hours);
      if (this.settings && this.settings.userName && this.settings.userName.trim() !== '') {
        greeting += `, ${this.settings.userName.trim()}`;
      }
      this.elements.greetingDisplay.textContent = greeting;
    }

    // 2. Time
    if (this.elements.timeDisplay) {
      const is24h = this.settings ? this.settings.clockFormat24 !== false : true;
      const showSec = this.settings ? this.settings.showSeconds === true : false;

      let displayHours = hours;
      let ampm = '';

      if (!is24h) {
        ampm = hours >= 12 ? ' PM' : ' AM';
        displayHours = hours % 12 || 12;
      }

      const hStr = String(displayHours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      const sStr = String(seconds).padStart(2, '0');

      let timeString = `${hStr}:${mStr}`;
      if (showSec) {
        timeString += `:${sStr}`;
      }
      if (ampm) {
        timeString += `<span class="clock-ampm">${ampm}</span>`;
      }

      this.elements.timeDisplay.innerHTML = timeString;
    }

    // 3. Date
    if (this.elements.dateDisplay) {
      const showDate = this.settings ? this.settings.showDate !== false : true;
      if (!showDate) {
        this.elements.dateDisplay.style.display = 'none';
      } else {
        this.elements.dateDisplay.style.display = 'block';
        const months = [
          'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
          'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];
        const days = [
          'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
        ];

        const dayNum = now.getDate();
        const monthName = months[now.getMonth()];
        const dayName = days[now.getDay()];
        const year = now.getFullYear();

        this.elements.dateDisplay.textContent = `${dayNum} ${monthName} ${year}, ${dayName}`;
      }
    }
  }
};
