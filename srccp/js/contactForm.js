// Contact form logic for XP simulator
// Handles contact form submission, validation, etc.

export class ContactFormManager {
    constructor(formSelector = '#contact-form') {
        this.form = document.querySelector(formSelector);
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleContactFormSubmit(e));
        }
    }

    handleContactFormSubmit(e) {
        e.preventDefault();
        // Add form validation and submission logic here
        // For now, just show a success message
        alert('Message sent! (Demo)');
        this.form.reset();
    }
} 