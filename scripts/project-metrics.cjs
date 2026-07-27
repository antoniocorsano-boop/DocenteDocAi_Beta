#!/usr/bin/env node
/**
 * Project Metrics Analyzer
 * Tracks codebase health metrics over time
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const METRICS_FILE = path.join(__dirname, '..', 'project-metrics.json');

// Thresholds
const THRESHOLDS = {
    componentLines: 400,
    cssFileLines: 1000,
    typesFileLines: 500
};

// Helper: Count lines in file
function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.split('\n').length;
    } catch {
        return 0;
    }
}

// Helper: Find all files recursively
function findFiles(dir, pattern) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            files.push(...findFiles(fullPath, pattern));
        } else if (pattern.test(item)) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Analyze components
function analyzeComponents() {
    const components = findFiles(path.join(SRC_DIR, 'components'), /\.tsx$/);
    const stats = {
        total: components.length,
        oversized: [],
        critical: []
    };
    
    for (const file of components) {
        const lines = countLines(file);
        const name = path.basename(file);
        
        if (lines > THRESHOLDS.componentLines) {
            stats.oversized.push({ name, lines });
        }
        if (lines > 800) {
            stats.critical.push({ name, lines });
        }
    }
    
    // Sort by lines descending
    stats.oversized.sort((a, b) => b.lines - a.lines);
    stats.critical.sort((a, b) => b.lines - a.lines);
    
    return stats;
}

// Analyze CSS
function analyzeCSS() {
    const cssFiles = findFiles(SRC_DIR, /\.css$/);
    const stats = {
        totalFiles: cssFiles.length,
        totalLines: 0,
        oversized: []
    };
    
    for (const file of cssFiles) {
        const lines = countLines(file);
        stats.totalLines += lines;
        
        if (lines > THRESHOLDS.cssFileLines) {
            stats.oversized.push({
                name: path.basename(file),
                lines
            });
        }
    }
    
    stats.oversized.sort((a, b) => b.lines - a.lines);
    return stats;
}

// Analyze types
function analyzeTypes() {
    const typesFile = path.join(SRC_DIR, 'types.ts');
    if (fs.existsSync(typesFile)) {
        return {
            exists: true,
            lines: countLines(typesFile)
        };
    }
    return { exists: false, lines: 0 };
}

// Generate report
function generateReport() {
    const components = analyzeComponents();
    const css = analyzeCSS();
    const types = analyzeTypes();
    
    const report = {
        date: new Date().toISOString(),
        summary: {
            totalComponents: components.total,
            oversizedComponents: components.oversized.length,
            criticalComponents: components.critical.length,
            cssTotalLines: css.totalLines,
            cssOversizedFiles: css.oversized.length,
            typesLines: types.lines
        },
        details: {
            components,
            css,
            types
        }
    };
    
    return report;
}

// Print report
function printReport(report) {
    console.log('\n📊 Project Metrics Report\n');
    console.log('==========================\n');
    
    console.log(`📅 Date: ${report.date}\n`);
    
    // Components
    console.log('📦 Components');
    console.log(`   Total: ${report.summary.totalComponents}`);
    console.log(`   Oversized (>${THRESHOLDS.componentLines} lines): ${report.summary.oversizedComponents}`);
    console.log(`   Critical (>800 lines): ${report.summary.criticalComponents}`);
    
    if (report.details.components.critical.length > 0) {
        console.log('\n   🔴 Critical Components:');
        report.details.components.critical.slice(0, 5).forEach(c => {
            console.log(`      - ${c.name}: ${c.lines} lines`);
        });
    }
    
    // CSS
    console.log('\n🎨 CSS');
    console.log(`   Total Lines: ${report.summary.cssTotalLines.toLocaleString()}`);
    console.log(`   Oversized Files: ${report.summary.cssOversizedFiles}`);
    
    if (report.details.css.oversized.length > 0) {
        console.log('\n   ⚠️  Large CSS Files:');
        report.details.css.oversized.forEach(f => {
            console.log(`      - ${f.name}: ${f.lines} lines`);
        });
    }
    
    // Types
    console.log('\n📋 Types');
    if (report.summary.typesLines > 0) {
        console.log(`   types.ts: ${report.summary.typesLines} lines`);
        if (report.summary.typesLines > THRESHOLDS.typesFileLines) {
            console.log('   ⚠️  Consider modularizing types.ts');
        }
    }
    
    console.log('\n==========================\n');
}

// Save metrics history
function saveMetrics(report) {
    let history = [];
    if (fs.existsSync(METRICS_FILE)) {
        history = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    }
    
    history.push(report);
    
    // Keep only last 30 entries
    if (history.length > 30) {
        history = history.slice(-30);
    }
    
    fs.writeFileSync(METRICS_FILE, JSON.stringify(history, null, 2));
}

// Main
function main() {
    const report = generateReport();
    printReport(report);
    saveMetrics(report);
    
    // Exit with error if critical issues found
    if (report.summary.criticalComponents > 0) {
        process.exit(1);
    }
}

main();
