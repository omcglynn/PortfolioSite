// Contact form logic for XP simulator
// Handles contact form submission, validation, etc.

export class ContactFormManager {
    constructor(formSelector = '#contact-form') {
        this.form = document.querySelector(formSelector);
        this.dialogManager = null;
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleContactFormSubmit(e));
        }
    }

    setDialogManager(dialogManager) {
        this.dialogManager = dialogManager;
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
                if (this.dialogManager) {
                    this.dialogManager.showSuccess(
                        'Message Sent',
                        'Thank you for contacting me! I\'ll get back to you soon.',
                        ['OK']
                    );
                } else {
                alert('Message sent! Thank you for contacting me.');
                }
                this.form.reset();
            } else {
                response.json().then(data => {
                    const errorMessage = data.error || 'Oops! There was a problem submitting your form.';
                    if (this.dialogManager) {
                        this.dialogManager.showError(
                            'Submission Error',
                            errorMessage,
                            ['OK']
                        );
                    } else {
                        alert(errorMessage);
                    }
                });
            }
        })
        .catch(error => {
            const errorMessage = 'Oops! There was a problem submitting your form.';
            if (this.dialogManager) {
                this.dialogManager.showError(
                    'Network Error',
                    errorMessage,
                    ['OK']
                );
            } else {
                alert(errorMessage);
            }
        });
    }
} 