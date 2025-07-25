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

        const formData = new FormData(this.form);

        fetch(this.form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                alert('Message sent! Thank you for contacting me.');
                this.form.reset();
            } else {
                response.json().then(data => {
                    alert(data.error || 'Oops! There was a problem submitting your form.');
                });
            }
        })
        .catch(error => {
            alert('Oops! There was a problem submitting your form.');
        });
    }
} 