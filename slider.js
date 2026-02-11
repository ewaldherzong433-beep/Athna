// slider-manager.js - FULLY FIXED VERSION

class CardSlider {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.wrapper = this.container.querySelector('.cards-wrapper');
        this.prevArrow = this.container.querySelector('.prev-arrow');
        this.nextArrow = this.container.querySelector('.next-arrow');

        this.dotsContainer =
            this.container.nextElementSibling &&
                this.container.nextElementSibling.classList.contains('slider-dots')
                ? this.container.nextElementSibling
                : null;

        this.options = {
            cardsToShow: 3,
            autoSlide: false,
            slideInterval: 5000,
            ...options
        };

        this.isDragging = false;
        this.isHorizontalSwipe = false;
        this.startX = 0;
        this.startY = 0;
        this.currentTranslate = 0;
        this.prevTranslate = 0;
        this.currentIndex = 0;

        this.gestureResetTimer = null;

        this.init();
    }

    init() {
        this.calculateCardWidth();
        this.createDots();
        this.setupEventListeners();
        this.updateArrows();

        if (this.options.autoSlide) {
            this.startAutoSlide();
        }
    }

    calculateCardWidth() {
        const card = this.wrapper.querySelector('.product-card');
        if (!card) return;

        const style = window.getComputedStyle(card);
        const gap = parseFloat(window.getComputedStyle(this.wrapper).gap || 0);

        this.cardFullWidth =
            card.offsetWidth +
            parseFloat(style.marginLeft || 0) +
            parseFloat(style.marginRight || 0) +
            gap;

        this.totalCards = this.wrapper.querySelectorAll('.product-card').length;
        this.maxIndex = Math.max(0, this.totalCards - this.options.cardsToShow);
    }

    createDots() {
        if (!this.dotsContainer) return;

        this.dotsContainer.innerHTML = '';
        for (let i = 0; i <= this.maxIndex; i++) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.slideToIndex(i));
            this.dotsContainer.appendChild(dot);
        }

        this.dots = this.dotsContainer.querySelectorAll('.dot');
    }

    forceResetGesture() {
        this.isDragging = false;
        this.isHorizontalSwipe = false;

        clearTimeout(this.gestureResetTimer);
        this.gestureResetTimer = null;

        this.wrapper.classList.remove('dragging');
        this.wrapper.style.transition = 'transform 0.3s ease';
    }


    setupEventListeners() {
        this.wrapper.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.wrapper.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.wrapper.addEventListener('touchend', this.handleTouchEnd.bind(this));

        this.wrapper.addEventListener('mousedown', this.handleMouseDown.bind(this));

        if (this.prevArrow) {
            this.prevArrow.addEventListener('click', () => this.slideToIndex(this.currentIndex - 1));
        }
        if (this.nextArrow) {
            this.nextArrow.addEventListener('click', () => this.slideToIndex(this.currentIndex + 1));
        }

        window.addEventListener('resize', () => {
            this.calculateCardWidth();
            this.slideToIndex(this.currentIndex);
        });
        document.addEventListener('touchstart', (e) => {
            if (!this.wrapper.contains(e.target)) {
                this.forceResetGesture();
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!this.wrapper.contains(e.target)) {
                this.forceResetGesture();
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            this.forceResetGesture();
        }, { passive: true });

        // Mouse fallback
        document.addEventListener('mousedown', (e) => {
            if (!this.wrapper.contains(e.target)) {
                this.forceResetGesture();
            }
        });
    }

    handleTouchStart(e) {
        if (e.target.closest('a, button')) return;

        clearTimeout(this.gestureResetTimer);

        const touch = e.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;

        this.isDragging = false;
        this.isHorizontalSwipe = false;
        this.prevTranslate = this.currentTranslate;

        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
        }
    }

    handleTouchMove(e) {
        if (!this.wrapper.contains(e.target)) return;
        if (!e.touches[0]) return;

        const touch = e.touches[0];
        const diffX = touch.clientX - this.startX;
        const diffY = touch.clientY - this.startY;
        const LOCK_DISTANCE = 8;

        if (!this.isDragging && !this.isHorizontalSwipe) {
            if (Math.abs(diffX) < LOCK_DISTANCE && Math.abs(diffY) < LOCK_DISTANCE) {
                return;
            }

            if (Math.abs(diffX) > Math.abs(diffY)) {
                this.isHorizontalSwipe = true;
                this.isDragging = true;
                this.wrapper.style.transition = 'none';
                this.wrapper.classList.add('dragging');
                e.preventDefault();
            } else {
                return;
            }
        }

        if (this.isDragging) {
            this.currentTranslate = this.prevTranslate + diffX;
            this.setSliderPosition();
        }
    }

    handleTouchEnd() {
        if (this.isDragging) {
            this.dragEnd();
            this.wrapper.classList.remove('dragging');
        }

        this.isDragging = false;

        clearTimeout(this.gestureResetTimer);
        this.gestureResetTimer = setTimeout(() => {
            this.isHorizontalSwipe = false;
        }, 100);

        if (this.options.autoSlide) {
            this.startAutoSlide();
        }
    }

    handleMouseDown(e) {
        if (e.target.closest('a, button')) return;
        e.preventDefault();

        this.startX = e.clientX;
        this.prevTranslate = this.currentTranslate;
        this.isDragging = true;

        const move = (e) => {
            const diffX = e.clientX - this.startX;
            this.currentTranslate = this.prevTranslate + diffX;
            this.setSliderPosition();
        };

        const up = () => {
            this.dragEnd();
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        };

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    }

    dragEnd() {
        this.wrapper.style.transition = 'transform 0.3s ease';

        const movedBy = this.currentTranslate - this.prevTranslate;
        const threshold = this.cardFullWidth / 4;

        if (Math.abs(movedBy) > threshold) {
            this.slideToIndex(this.currentIndex + (movedBy < 0 ? 1 : -1));
        } else {
            this.slideToIndex(this.currentIndex);
        }
    }

    setSliderPosition() {
        this.wrapper.style.transform = `translateX(${this.currentTranslate}px)`;
    }

    slideToIndex(index) {
        index = Math.max(0, Math.min(index, this.maxIndex));
        this.currentIndex = index;
        this.currentTranslate = -(index * this.cardFullWidth);
        this.prevTranslate = this.currentTranslate;
        this.updateDots();
        this.updateArrows();
        this.setSliderPosition();
    }

    updateDots() {
        if (!this.dots) return;
        this.dots.forEach((dot, i) => dot.classList.toggle('active', i === this.currentIndex));
    }

    updateArrows() {
        if (this.prevArrow) this.prevArrow.disabled = this.currentIndex === 0;
        if (this.nextArrow) this.nextArrow.disabled = this.currentIndex === this.maxIndex;
    }

    startAutoSlide() {
        clearInterval(this.autoSlideInterval);
        this.autoSlideInterval = setInterval(() => {
            this.slideToIndex(this.currentIndex >= this.maxIndex ? 0 : this.currentIndex + 1);
        }, this.options.slideInterval);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.sliders = {};
    document.querySelectorAll('.cards-slider-container').forEach(container => {
        if (container.id) {
            window.sliders[container.id] = new CardSlider(container.id);
        }
    });
});
