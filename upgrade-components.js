const fs = require('fs');
const path = require('path');

function processDirectory(dir, isAutomationApp) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath, isAutomationApp);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;

      if (isAutomationApp) {
        // Automation App specific hardcoded dark hex overrides to use semantic tokens
        newContent = newContent.replace(/bg-\[#111113\]/g, 'bg-[var(--card)] shadow-xl shadow-black/20');
        newContent = newContent.replace(/bg-\[#161619\]/g, 'bg-[var(--card-hover)]');
        newContent = newContent.replace(/hover:bg-\[#161619\]/g, 'hover:bg-[var(--card-hover)]');
        newContent = newContent.replace(/border-\[#1e1e22\]/g, 'border-[var(--border)]');
        newContent = newContent.replace(/border-\[#2a2a30\]/g, 'border-[var(--border)]');
        newContent = newContent.replace(/bg-\[#0a0a0b\]/g, 'bg-[var(--background)]');
        // Inputs
        newContent = newContent.replace(/bg-\[var\(--background\)\] border border-\[var\(--border\)\]/g, 'bg-black/20 border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]');
      } else {
        // Job Tracker overrides
        // Standardize backgrounds if generic
        newContent = newContent.replace(/bg-slate-900/g, 'bg-[var(--background)]');
        newContent = newContent.replace(/bg-slate-800/g, 'bg-[var(--card)] shadow-xl shadow-black/20');
        newContent = newContent.replace(/border-slate-700/g, 'border-[var(--border)]');
        // Upgrade glassmorphism badges
        newContent = newContent.replace(/bg-amber-100/g, 'bg-indigo-500/10 text-indigo-400');
        newContent = newContent.replace(/text-amber-800/g, '');
        newContent = newContent.replace(/bg-blue-100/g, 'bg-indigo-500/10 text-indigo-400');
        newContent = newContent.replace(/text-blue-800/g, '');
        newContent = newContent.replace(/bg-emerald-100/g, 'bg-emerald-500/10 text-emerald-400');
        newContent = newContent.replace(/text-emerald-800/g, '');
      }

      // Both apps: Standardize Button Styles
      // Search for <button className="..."> or <Link className="...">
      // To simplify, we will just globally add the hover scale and smooth transition to existing buttons
      // If we see px-4 py-2, change to px-6 py-3 rounded-full
      newContent = newContent.replace(/px-4 py-2 rounded-md/g, 'px-6 py-3 rounded-full text-sm font-medium transition-all hover:scale-[1.02] shadow-sm');
      newContent = newContent.replace(/px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md/g, 'px-8 py-4 bg-[var(--primary)] hover:brightness-110 disabled:opacity-50 text-[var(--primary-foreground)] rounded-full transition-all hover:scale-[1.02] shadow-lg shadow-indigo-500/20');

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
      }
    }
  }
}

const autoDir = 'C:/Users/Lenovo/Downloads/n8n-data-20260510T162446Z-3-001/n8n-data/job-apply-automation';
const trackerDir = 'C:/Users/Lenovo/Downloads/Job-Tracker-Git/src';

processDirectory(path.join(autoDir, 'app'), true);
processDirectory(path.join(autoDir, 'components'), true);
processDirectory(path.join(trackerDir, 'app'), false);
processDirectory(path.join(trackerDir, 'components'), false);

console.log('Components updated globally with premium aesthetic.');
