#!/usr/bin/env node

/**
 * Presentation Video Generator
 *
 * Generates a video from the captured presentation screenshots
 * using FFmpeg or a Node.js video generation library.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCREENSHOTS_DIR = 'presentation-screenshots';
const OUTPUT_VIDEO = 'docentedoc-ai-presentation.mp4';

console.log('🎬 DocenteDoc AI - Presentation Video Generator');
console.log('==============================================\n');

// Check if screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  console.error(`❌ Error: Directory '${SCREENSHOTS_DIR}' not found.`);
  console.log('Run "npm run test:presentation" first to capture screenshots.');
  process.exit(1);
}

// Get all screenshot files
const screenshotFiles = fs.readdirSync(SCREENSHOTS_DIR)
  .filter(file => file.endsWith('.png'))
  .sort()
  .map(file => path.join(SCREENSHOTS_DIR, file));

if (screenshotFiles.length === 0) {
  console.error('❌ Error: No screenshot files found.');
  console.log('Run "npm run test:presentation" first to capture screenshots.');
  process.exit(1);
}

console.log(`📁 Found ${screenshotFiles.length} screenshots:`);
screenshotFiles.forEach((file, index) => {
  console.log(`  ${index + 1}. ${path.basename(file)}`);
});

console.log('\n🎬 Generating presentation video...');

// Check if FFmpeg is available
try {
  execSync('ffmpeg -version', { stdio: 'pipe' });
  console.log('✅ FFmpeg found, generating video with FFmpeg...');

  // Create a text file with the list of images for FFmpeg
  const concatList = screenshotFiles.map((file, index) => {
    const duration = index === screenshotFiles.length - 1 ? 3 : 2; // Last image shows longer
    return `file '${file}'\nduration ${duration}`;
  }).join('\n') + '\n';

  const concatFile = path.join(SCREENSHOTS_DIR, 'concat.txt');
  fs.writeFileSync(concatFile, concatList);

  // Generate video with FFmpeg
  const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${OUTPUT_VIDEO}"`;

  execSync(ffmpegCommand, { stdio: 'inherit' });

  // Clean up
  fs.unlinkSync(concatFile);

  console.log(`\n✅ Video generated successfully: ${OUTPUT_VIDEO}`);
  console.log(`📊 Video specs: ${screenshotFiles.length} slides, 2-3 seconds each`);

} catch (error) {
  console.log('⚠️  FFmpeg not found, trying alternative method...');

  // Fallback: Create a simple HTML presentation
  console.log('📄 Creating HTML presentation instead...');

  const htmlContent = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DocenteDoc AI - Presentazione</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            text-align: center;
        }
        .presentation {
            max-width: 1200px;
            margin: 0 auto;
        }
        .slide {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin: 20px 0;
            overflow: hidden;
        }
        .slide img {
            width: 100%;
            height: auto;
            display: block;
        }
        .slide-title {
            padding: 15px;
            background: #6750a4;
            color: white;
            margin: 0;
            font-size: 18px;
            font-weight: bold;
        }
        .navigation {
            margin: 20px 0;
        }
        button {
            background: #6750a4;
            color: white;
            border: none;
            padding: 10px 20px;
            margin: 0 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #5c4a91;
        }
        .slide-counter {
            margin: 10px 0;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="presentation">
        <h1>🎓 DocenteDoc AI - Presentazione delle Funzionalità</h1>
        <p>Presentazione interattiva delle caratteristiche principali dell'applicazione</p>

        <div class="navigation">
            <button onclick="previousSlide()">⬅️ Precedente</button>
            <button onclick="nextSlide()">Successivo ➡️</button>
            <button onclick="toggleAutoPlay()">⏯️ Auto Play</button>
        </div>

        <div class="slide-counter">Slide <span id="current-slide">1</span> di <span id="total-slides">${screenshotFiles.length}</span></div>

        <div id="slides">
            ${screenshotFiles.map((file, index) => `
                <div class="slide" style="display: ${index === 0 ? 'block' : 'none'};">
                    <h3 class="slide-title">Slide ${index + 1}: ${getSlideTitle(index)}</h3>
                    <img src="${file.replace(/\\/g, '/')}" alt="Slide ${index + 1}" loading="lazy">
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        let currentSlide = 0;
        let autoPlayInterval = null;
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;

        function updateSlideCounter() {
            document.getElementById('current-slide').textContent = currentSlide + 1;
        }

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.style.display = i === index ? 'block' : 'none';
            });
            currentSlide = index;
            updateSlideCounter();
        }

        function nextSlide() {
            const next = (currentSlide + 1) % totalSlides;
            showSlide(next);
        }

        function previousSlide() {
            const prev = currentSlide === 0 ? totalSlides - 1 : currentSlide - 1;
            showSlide(prev);
        }

        function toggleAutoPlay() {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            } else {
                autoPlayInterval = setInterval(nextSlide, 3000);
            }
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                previousSlide();
            }
        });

        function getSlideTitle(index) {
            const titles = [
                'Homepage - Sezione Hero',
                'Azioni Rapide',
                'Suggerimenti AI',
                'Prossima Lezione',
                'Vista Appello',
                'Vista Valutazioni',
                'Vista Progettazione',
                'Pannello Impostazioni',
                'Vista Mobile',
                'Dimostrazione Scrolling'
            ];
            return titles[index] || \`Slide \${index + 1}\`;
        }
    </script>
</body>
</html>`;

  const htmlFile = 'docentedoc-ai-presentation.html';
  fs.writeFileSync(htmlFile, htmlContent);

  console.log(`\n✅ HTML presentation created: ${htmlFile}`);
  console.log('📊 Features: Interactive navigation, auto-play, keyboard controls');
  console.log('🔗 Open the HTML file in your browser to view the presentation');
}

// Helper function for slide titles (only used in fallback)
function getSlideTitle(index) {
  const titles = [
    'Homepage - Sezione Hero',
    'Azioni Rapide',
    'Suggerimenti AI',
    'Prossima Lezione',
    'Vista Appello',
    'Vista Valutazioni',
    'Vista Progettazione',
    'Pannello Impostazioni',
    'Vista Mobile',
    'Dimostrazione Scrolling'
  ];
  return titles[index] || `Slide ${index + 1}`;
}

console.log('\n🎉 Presentation generation completed!');
console.log('💡 Tips:');
console.log('   - Use the HTML version for interactive presentation');
console.log('   - Install FFmpeg for high-quality video generation');
console.log('   - Customize timings and transitions as needed');