const fs = require('fs');
const path = require('path');

const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/cine-dark/g, 'cine-bg');
    content = content.replace(/cine-baby-hover/g, 'cine-brand-hover');
    content = content.replace(/cine-baby-soft/g, 'amber-200');
    content = content.replace(/cine-baby/g, 'cine-brand');
    fs.writeFileSync(file, content);
});
console.log('Replacement done.');
