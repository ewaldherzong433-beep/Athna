// slider-manager.js - WITH INFINITE LOOPING SHOWING 6 CARDS

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
            cardsToShow: 1, // Show 6 cards at once
            autoSlide: false, // Auto-slide turned OFF
            slideInterval: 5000,
            loop: true,
            ...options
        };

        this.isDragging = false;
        this.isHorizontalSwipe = false;
        this.startX = 0;
        this.startY = 0;
        this.initialX = 0;
        this.currentTranslate = 0;
        this.prevTranslate = 0;
        this.currentIndex = 0;

        this.gestureResetTimer = null;
        this.isAnimating = false;

        this.init();
    }

    init() {
        this.setupInfiniteLoop();
        this.calculateCardWidth();
        this.createDots();
        this.setupEventListeners();
        
        if (this.options.loop) {
            // Set initial position to first real card
            setTimeout(() => {
                this.currentIndex = this.totalRealCards;
                this.slideToIndex(this.currentIndex, false);
            }, 10);
        }

        // Auto-slide is disabled by default, but we'll check anyway
        if (this.options.autoSlide) {
            this.startAutoSlide();
        }
    }

    setupInfiniteLoop() {
        const cards = Array.from(this.wrapper.querySelectorAll('.product-card'));
        this.totalRealCards = cards.length;
        
        if (this.totalRealCards <= this.options.cardsToShow) {
            this.options.loop = false;
            return;
        }

        // Clone cards for infinite loop effect
        // Clone enough cards to cover the viewport when looping
        const cloneCount = Math.min(this.totalRealCards, this.options.cardsToShow);
        
        const firstCards = cards.slice(0, cloneCount).map(card => card.cloneNode(true));
        const lastCards = cards.slice(-cloneCount).map(card => card.cloneNode(true));

        // Add clones to the DOM
        lastCards.forEach(card => {
            card.classList.add('clone');
            this.wrapper.insertBefore(card, this.wrapper.firstChild);
        });

        firstCards.forEach(card => {
            card.classList.add('clone');
            this.wrapper.appendChild(card);
        });

        // Update total cards count including clones
        this.totalCards = this.wrapper.querySelectorAll('.product-card').length;
        this.maxIndex = this.totalCards - this.options.cardsToShow;
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
    }

    createDots() {
        if (!this.dotsContainer || !this.options.loop) return;

        this.dotsContainer.innerHTML = '';
        for (let i = 0; i < this.totalRealCards; i++) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.slideToRealIndex(i));
            this.dotsContainer.appendChild(dot);
        }

        this.dots = this.dotsContainer.querySelectorAll('.dot');
    }

    slideToRealIndex(realIndex) {
        if (this.options.loop) {
            this.slideToIndex(realIndex + this.options.cardsToShow);
        } else {
            this.slideToIndex(realIndex);
        }
    }

    forceResetGesture() {
        this.isDragging = false;
        this.isHorizontalSwipe = false;
        this.isAnimating = false;

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
            this.prevArrow.addEventListener('click', () => this.slidePrev());
        }
        if (this.nextArrow) {
            this.nextArrow.addEventListener('click', () => this.slideNext());
        }

        window.addEventListener('resize', () => {
            this.calculateCardWidth();
            this.slideToIndex(this.currentIndex, false);
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

        document.addEventListener('mousedown', (e) => {
            if (!this.wrapper.contains(e.target)) {
                this.forceResetGesture();
            }
        });
    }

    slidePrev() {
        if (this.isAnimating) return;
        this.slideToIndex(this.currentIndex - 1);
    }

    slideNext() {
        if (this.isAnimating) return;
        this.slideToIndex(this.currentIndex + 1);
    }

    handleTouchStart(e) {
        if (e.target.closest('a, button') || this.isAnimating) return;

        clearTimeout(this.gestureResetTimer);

        const touch = e.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;

        this.isDragging = false;
        this.isHorizontalSwipe = false;
        this.prevTranslate = this.currentTranslate;

        // Store the initial position for better direction detection
        this.initialX = this.startX;
        
        // Remove any transition while dragging
        this.wrapper.style.transition = 'none';
    }

    handleTouchMove(e) {
        if (!this.wrapper.contains(e.target) || this.isAnimating) return;
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
                e.preventDefault(); // Prevent page scroll
            } else {
                return; // Vertical scroll - let the page scroll
            }
        }

        if (this.isDragging) {
            e.preventDefault(); // Prevent page scroll while dragging horizontally
            this.currentTranslate = this.prevTranslate + diffX;
            this.setSliderPosition();
        }
    }

    handleTouchEnd() {
        if (this.isDragging && !this.isAnimating) {
            this.dragEnd();
            this.wrapper.classList.remove('dragging');
        }

        this.isDragging = false;

        clearTimeout(this.gestureResetTimer);
        this.gestureResetTimer = setTimeout(() => {
            this.isHorizontalSwipe = false;
        }, 100);

        // Auto-slide is disabled, so no need to restart
    }

    handleMouseDown(e) {
        if (e.target.closest('a, button') || this.isAnimating) return;
        e.preventDefault();

        this.startX = e.clientX;
        this.prevTranslate = this.currentTranslate;
        this.isDragging = true;
        this.wrapper.style.transition = 'none';

        const move = (e) => {
            if (this.isAnimating) return;
            const diffX = e.clientX - this.startX;
            this.currentTranslate = this.prevTranslate + diffX;
            this.setSliderPosition();
        };

        const up = () => {
            if (this.isDragging && !this.isAnimating) {
                this.dragEnd();
            }
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        };

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    }

    dragEnd() {
        this.wrapper.style.transition = 'transform 0.3s ease';

        const movedBy = this.currentTranslate - this.prevTranslate;
        // Threshold determines when to move to next/prev slide
        const threshold = this.cardFullWidth / 3;

        if (Math.abs(movedBy) > threshold) {
            // FIXED: When movedBy is negative (swipe left), we want to go to next slide (+1)
            // When movedBy is positive (swipe right), we want to go to previous slide (-1)
            const direction = movedBy < 0 ? 1 : -1;
            this.slideToIndex(this.currentIndex + direction);
        } else {
            this.slideToIndex(this.currentIndex);
        }
    }

    setSliderPosition() {
        this.wrapper.style.transform = `translateX(${this.currentTranslate}px)`;
    }

    slideToIndex(index, animate = true) {
        if (this.isAnimating) return;

        // Ensure index is within bounds
        index = Math.max(0, Math.min(index, this.maxIndex));
        
        if (!animate) {
            this.wrapper.style.transition = 'none';
        } else {
            this.wrapper.style.transition = 'transform 0.3s ease';
        }

        this.currentIndex = index;
        this.currentTranslate = -(index * this.cardFullWidth);
        this.prevTranslate = this.currentTranslate;
        
        this.updateDots();
        this.setSliderPosition();

        // Handle infinite loop reset
        if (this.options.loop && animate) {
            this.isAnimating = true;
            
            setTimeout(() => {
                // Check if we're near the beginning (in cloned cards)
                if (this.currentIndex <= this.options.cardsToShow - 1) {
                    // Jump to the corresponding real cards at the end
                    this.wrapper.style.transition = 'none';
                    this.currentIndex = this.maxIndex - (this.options.cardsToShow - 1 - this.currentIndex);
                    this.currentTranslate = -(this.currentIndex * this.cardFullWidth);
                    this.prevTranslate = this.currentTranslate;
                    this.setSliderPosition();
                } 
                // Check if we're near the end (in cloned cards)
                else if (this.currentIndex >= this.maxIndex - (this.options.cardsToShow - 1)) {
                    // Jump to the corresponding real cards at the beginning
                    this.wrapper.style.transition = 'none';
                    this.currentIndex = this.currentIndex - (this.maxIndex - (this.options.cardsToShow - 1)) + (this.options.cardsToShow - 1);
                    this.currentTranslate = -(this.currentIndex * this.cardFullWidth);
                    this.prevTranslate = this.currentTranslate;
                    this.setSliderPosition();
                }
                
                setTimeout(() => {
                    this.isAnimating = false;
                }, 50);
            }, 300);
        }
    }

    updateDots() {
        if (!this.dots || !this.options.loop) return;
        
        // Calculate real index for dots (excluding clones)
        let realIndex = this.currentIndex - this.options.cardsToShow;
        
        // Handle wrap-around for infinite loop
        if (realIndex < 0) {
            realIndex = this.totalRealCards + realIndex;
        } else if (realIndex >= this.totalRealCards) {
            realIndex = realIndex - this.totalRealCards;
        }
        
        this.dots.forEach((dot, i) => dot.classList.toggle('active', i === realIndex));
    }

    startAutoSlide() {
        // This method is kept but auto-slide is disabled by default
        clearInterval(this.autoSlideInterval);
        if (this.options.autoSlide) {
            this.autoSlideInterval = setInterval(() => {
                if (!this.isAnimating) {
                    this.slideNext();
                }
            }, this.options.slideInterval);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.sliders = {};
    document.querySelectorAll('.cards-slider-container').forEach(container => {
        if (container.id) {
            window.sliders[container.id] = new CardSlider(container.id, {
                loop: true,           // Enable infinite loop
                cardsToShow: 1,        // Show 6 cards at once
                autoSlide: false       // Auto-slide turned OFF
            });
        }
    });
});