// main.js - Auto-slide configuration

document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for sliders to initialize
    setTimeout(() => {
        const sliderConfigs = {
            'casualwear-slider': {
                autoSlide: true,
                slideInterval: 4000
            },
            'Sportwear-slider': {
                autoSlide: true,
                slideInterval: 5000
            },
            'sportswearMan-slider': {
                autoSlide: true,
                slideInterval: 5000
            },
            'CapsHats-slider': {
                autoSlide: true,
                slideInterval: 3500
            },
            'accessories-slider': {
                autoSlide: false
            }
        };
        
        // Apply custom configurations
        Object.keys(sliderConfigs).forEach(sliderId => {
            if (window.sliders && window.sliders[sliderId]) {
                const slider = window.sliders[sliderId];
                const config = sliderConfigs[sliderId];
                
                if (config.autoSlide) {
                    slider.options.autoSlide = true;
                    slider.options.slideInterval = config.slideInterval;
                    
                    // Stop any existing auto-slide and start new one
                    if (slider.autoSlideInterval) {
                        clearInterval(slider.autoSlideInterval);
                    }
                    slider.startAutoSlide();
                }
            }
        });
    }, 100);
});