// Dropdown functionality with click event and animations
document.addEventListener('DOMContentLoaded', function() {
    const dropdownBtn = document.getElementById('categoryDropdownBtn');
    const dropdownMenu = document.getElementById('categoryDropdownMenu');
    
    // Only proceed if elements exist
    if (!dropdownBtn || !dropdownMenu) return;
    
    // Toggle dropdown on button click
    dropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        this.classList.toggle('active');
        dropdownMenu.classList.toggle('show');
        
        // Rotate arrow
        const arrow = this.querySelector('.dropdown-arrow');
        if (arrow) {
            arrow.style.transform = dropdownMenu.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownBtn.classList.remove('active');
            dropdownMenu.classList.remove('show');
            
            const arrow = dropdownBtn.querySelector('.dropdown-arrow');
            if (arrow) {
                arrow.style.transform = 'rotate(0deg)';
            }
        }
    });
    
    // Handle dropdown item clicks
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Don't prevent default - we want the link to work
            // But close the dropdown first
            dropdownBtn.classList.remove('active');
            dropdownMenu.classList.remove('show');
            
            const arrow = dropdownBtn.querySelector('.dropdown-arrow');
            if (arrow) {
                arrow.style.transform = 'rotate(0deg)';
            }
            
            // The link will navigate naturally
        });
    });
    
    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && dropdownMenu.classList.contains('show')) {
            dropdownBtn.classList.remove('active');
            dropdownMenu.classList.remove('show');
            
            const arrow = dropdownBtn.querySelector('.dropdown-arrow');
            if (arrow) {
                arrow.style.transform = 'rotate(0deg)';
            }
        }
    });
});