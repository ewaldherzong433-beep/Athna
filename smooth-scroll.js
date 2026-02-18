/**
 * Smooth Scroll JavaScript
 * Handles both local and cross-page anchor links
 * Version: 2.0
 */

(function() {
    'use strict';

    // Configuration
    const config = {
        offset: 80, // Offset for fixed header (in pixels)
        duration: 800, // Animation duration in milliseconds
        easing: 'easeInOutQuad', // Easing function
        debug: true // Set to true to enable console logs
    };

    // Easing functions
    const easingFunctions = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    };

    // Log function for debugging
    function log(message, type = 'log') {
        if (config.debug) {
            console[type](`[SmoothScroll] ${message}`);
        }
    }

    // Check if we're on the home page
    function isHomePage() {
        const path = window.location.pathname;
        return path.endsWith('index.html') || path.endsWith('/') || path === '';
    }

    // Extract ID from href
    function extractIdFromHref(href) {
        // Handle /index.html#section format
        if (href.includes('index.html#')) {
            return '#' + href.split('index.html#')[1];
        }
        // Handle ./index.html#section format
        if (href.includes('./index.html#')) {
            return '#' + href.split('./index.html#')[1];
        }
        // Handle #section format
        if (href.startsWith('#')) {
            return href;
        }
        return null;
    }

    // Get target element from hash
    function getTargetElement(hash) {
        if (!hash || hash === '#') return null;
        
        try {
            const target = document.querySelector(hash);
            if (!target) {
                log(`Target element not found: ${hash}`, 'warn');
            }
            return target;
        } catch (error) {
            log(`Invalid selector: ${hash}`, 'error');
            return null;
        }
    }

    // Calculate target position with offset
    function getTargetPosition(target) {
        const rect = target.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetTop = rect.top + scrollTop - config.offset;
        
        log(`Target position: ${targetTop}px`);
        
        return targetTop;
    }

    // Smooth scroll animation
    function animateScroll(targetPosition) {
        const startPosition = window.pageYOffset || document.documentElement.scrollTop;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();
        const easing = easingFunctions[config.easing] || easingFunctions.easeInOutQuad;

        // If distance is very small, just jump
        if (Math.abs(distance) < 5) {
            window.scrollTo(0, targetPosition);
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            function animation(currentTime) {
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / config.duration, 1);
                const ease = easing(progress);
                
                window.scrollTo(0, startPosition + (distance * ease));

                if (timeElapsed < config.duration) {
                    requestAnimationFrame(animation);
                } else {
                    // Ensure we end at exact position
                    window.scrollTo(0, targetPosition);
                    resolve();
                }
            }

            requestAnimationFrame(animation);
        });
    }

    // Handle anchor link click
    function handleAnchorClick(event) {
        const link = event.currentTarget;
        const href = link.getAttribute('href');
        
        log(`Link clicked: ${href}`);
        
        // Skip if no href
        if (!href) return;

        // Handle different types of links
        if (href.startsWith('#') && href !== '#') {
            // Local anchor link (e.g., #contact)
            event.preventDefault();
            const target = getTargetElement(href);
            if (target) {
                log(`Local anchor: scrolling to ${href}`);
                const targetPosition = getTargetPosition(target);
                animateScroll(targetPosition).then(() => {
                    history.pushState(null, null, href);
                });
            }
        }
        else if (href.includes('index.html#')) {
            // Link to home page section (e.g., ./index.html#shop)
            if (isHomePage()) {
                // We're already on home page, just scroll
                event.preventDefault();
                const id = extractIdFromHref(href);
                const target = getTargetElement(id);
                if (target) {
                    log(`Home page section: scrolling to ${id}`);
                    const targetPosition = getTargetPosition(target);
                    animateScroll(targetPosition).then(() => {
                        history.pushState(null, null, id);
                    });
                }
            } else {
                // We're on another page, let the navigation happen
                log(`Navigating to home page section: ${href}`);
                // Store the target in sessionStorage
                const id = extractIdFromHref(href);
                if (id) {
                    sessionStorage.setItem('scrollTarget', id);
                }
            }
        }
    }

    // Check for stored scroll target when page loads
    function checkStoredScrollTarget() {
        const targetId = sessionStorage.getItem('scrollTarget');
        if (targetId) {
            // Clear the stored target
            sessionStorage.removeItem('scrollTarget');
            
            // Wait for page to fully load
            setTimeout(() => {
                const target = getTargetElement(targetId);
                if (target) {
                    log(`Scrolling to stored target: ${targetId}`);
                    const targetPosition = getTargetPosition(target);
                    animateScroll(targetPosition).then(() => {
                        history.pushState(null, null, targetId);
                    });
                }
            }, 500); // Increased timeout for images to load
        }
    }

    // Initialize smooth scroll
    function initSmoothScroll(options = {}) {
        // Merge options with config
        Object.assign(config, options);
        
        log('Initializing smooth scroll...');
        
        // Get all relevant links
        const selector = 'a[href^="#"], a[href*="index.html#"], a[href*="./index.html#"]';
        const links = document.querySelectorAll(selector);
        
        links.forEach(link => {
            // Remove existing listeners
            link.removeEventListener('click', handleAnchorClick);
            // Add new listener
            link.addEventListener('click', handleAnchorClick);
        });
        
        log(`Attached smooth scroll to ${links.length} links`);
        
        // Check for stored scroll target
        checkStoredScrollTarget();
    }

    // Handle dynamic content
    function observeDynamicLinks() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    // Re-initialize for new links
                    const selector = 'a[href^="#"], a[href*="index.html#"], a[href*="./index.html#"]';
                    const newLinks = document.querySelectorAll(selector);
                    newLinks.forEach(link => {
                        link.removeEventListener('click', handleAnchorClick);
                        link.addEventListener('click', handleAnchorClick);
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Expose public API
    window.SmoothScroll = {
        init: initSmoothScroll,
        setConfig: (options) => Object.assign(config, options),
        version: '2.0.0'
    };

    // Auto-initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        initSmoothScroll();
        observeDynamicLinks();
    });

})();