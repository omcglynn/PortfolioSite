# Interactive Desktop Portfolio

A unique portfolio website inspired by the Cargo Wireframe N340 template, featuring draggable cards that simulate a desktop environment. Each project is presented as a movable "window" that users can arrange and interact with.

![Portfolio Preview](https://via.placeholder.com/800x400/f5f3f0/333333?text=Interactive+Desktop+Portfolio)

## ✨ Features

- **🖱️ Draggable Cards**: Each project card can be moved around like desktop windows
- **📱 Responsive Design**: Works on both desktop and mobile devices
- **🔍 Project Filtering**: Navigate between different project categories
- **🚀 GitHub Integration**: Automatically fetches your latest repositories
- **🎨 Modern Aesthetic**: Clean beige/cream design with subtle animations
- **⌨️ Keyboard Shortcuts**: Use keyboard to navigate and reorganize
- **🌊 Smooth Animations**: Subtle parallax and hover effects

## 🚀 Quick Start

1. **Clone or download** this repository
2. **Open `index.html`** in your browser
3. **Start customizing** your content

No build process required! It's pure HTML, CSS, and JavaScript.

## 🎯 Customization Guide

### Personal Information

Edit the `index.html` file to replace placeholder content:

1. **Update the About card** (line ~95):
```html
<h3>Your Name</h3>
<p>Full-stack developer, designer, and creative technologist.</p>
<div class="contact-links">
    <a href="https://github.com/yourusername" target="_blank">GitHub</a>
    <a href="mailto:your@email.com">Email</a>
    <a href="https://linkedin.com/in/yourprofile" target="_blank">LinkedIn</a>
</div>
```

2. **Update skills** (line ~140):
```html
<span class="skill">JavaScript</span>
<span class="skill">React</span>
<span class="skill">Node.js</span>
<!-- Add your skills here -->
```

3. **Change the site title** (line ~6):
```html
<title>Your Name - Portfolio</title>
```

### GitHub Integration

To connect your GitHub repositories:

1. Open `script.js`
2. Find line ~114 and replace `'octocat'` with your GitHub username:
```javascript
const username = 'yourgithubusername'; // Change this!
```

Your latest repositories will automatically populate the GitHub Projects card.

### Adding Your Projects

Replace the placeholder project cards with your own work:

```html
<!-- Example: Replace the Architecture Study card -->
<div class="card medium" data-category="project01" style="top: 80px; left: 100px;">
    <div class="card-header">
        <div class="card-title">My Web App</div>
        <div class="card-controls">
            <span class="drag-handle">⋮⋮</span>
        </div>
    </div>
    <div class="card-content">
        <div class="project-image">
            <img src="your-project-image.jpg" alt="My Web App" />
        </div>
        <div class="project-info">
            <h3>Project Description</h3>
            <p>Brief description of what this project does.</p>
            <a href="https://yourproject.com" target="_blank">View Live →</a>
        </div>
    </div>
</div>
```

### Card Types and Sizes

Available card sizes:
- `tiny` (180×120px) - For small info pieces
- `small` (250×200px) - For compact content
- `medium` (300×250px) - Standard size
- `large` (400×350px) - For featured projects
- `large-wide` (500×300px) - For horizontal layouts

### Color Customization

The color scheme is defined in `styles.css`. Key variables to customize:

```css
/* Background gradient */
background: linear-gradient(135deg, #f5f3f0 0%, #e8e4df 100%);

/* Card background */
background: rgba(255, 255, 255, 0.95);

/* Typography colors - change in the typography card */
.type-line.red { background: #e74c3c; }
.type-line.blue { background: #3498db; }
.type-line.navy { background: #2c3e50; }
.type-line.yellow { background: #f1c40f; }
```

## 🎮 Interactive Features

### Keyboard Shortcuts

- **R** - Randomize card positions
- **1-4** - Filter projects by category
- **Mouse/Touch** - Drag cards around

### Navigation

Use the top navigation to filter cards by project type:
- **All Projects** - Show everything
- **Project 01-04** - Filter by category

### Mobile Experience

On mobile devices:
- Cards stack vertically
- Drag functionality is disabled
- Navigation is simplified
- Touch-friendly interactions

## 🛠️ Advanced Customization

### Adding New Cards Programmatically

You can add new cards using JavaScript:

```javascript
// Add this after the portfolio is initialized
window.portfolio.addCard({
    title: 'New Project',
    category: 'project01',
    size: 'medium',
    content: `
        <div class="project-info">
            <h3>Dynamic Project</h3>
            <p>Added via JavaScript!</p>
        </div>
    `
});
```

### Custom Animations

Modify the `PortfolioEffects` class in `script.js` to add your own animations:

```javascript
// Example: Add a floating animation
setupFloatingAnimation() {
    document.querySelectorAll('.card').forEach((card, index) => {
        card.style.animation = `float ${3 + index * 0.5}s ease-in-out infinite`;
    });
}
```

### External APIs

The GitHub integration shows how to fetch external data. You can extend this pattern for other APIs:

```javascript
// Example: Fetch Medium articles, Dribbble shots, etc.
async setupMediumIntegration() {
    try {
        const response = await fetch('https://api.medium.com/...');
        const articles = await response.json();
        this.renderArticles(articles);
    } catch (error) {
        console.log('Medium integration failed:', error);
    }
}
```

## 🌐 Deployment

### GitHub Pages
1. Push your code to a GitHub repository
2. Go to Settings → Pages
3. Select your main branch
4. Your site will be live at `yourusername.github.io/repository-name`

### Netlify
1. Drag your project folder to [netlify.com](https://netlify.com)
2. Your site deploys instantly with a custom URL

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts

## 📝 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ⚠️ IE11 (limited support)

## 🤝 Contributing

Feel free to fork this project and make it your own! Some ideas for contributions:

- Additional card types
- More animation effects
- Better mobile interactions
- Dark mode support
- Accessibility improvements

## 📜 License

This project is inspired by the Cargo Wireframe N340 template and follows a Creative Commons Attribution approach. Feel free to use, modify, and distribute with attribution.

## 🙏 Acknowledgments

- Inspired by [Cargo](https://cargo.site) wireframe templates
- Built with modern web standards
- Typography uses [Inter](https://rsms.me/inter/) font

---

**Ready to make it yours?** Start by editing `index.html` and replacing the placeholder content with your own projects and information!

For questions or support, feel free to open an issue or reach out. 