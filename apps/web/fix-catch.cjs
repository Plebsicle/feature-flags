const fs = require('fs');
const { execSync } = require('child_process');
const files = execSync('find app src -name "*.tsx" -o -name "*.ts"').toString().split('\n').filter(Boolean);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  // Replace `catch {\n  console.error(err)` with `catch (err) {\n  console.error(err)`
  // We'll use regex
  const newContent = content.replace(/catch\s*\{\s*console\.error\(\s*(?:'[^']*',\s*)?(err|error|_error)\)/g, (match, errName) => {
    changed = true;
    return `catch (${errName}) { console.error(${errName})`;
  });

  const newContent2 = newContent.replace(/catch\s*\{\s*\/\/\s*console\.error\(\s*(?:'[^']*',\s*)?(err|error|_error)\)/g, (match, errName) => {
    changed = true;
    return `catch (${errName}) { // console.error(${errName})`;
  });
  
  const newContent3 = newContent2.replace(/catch\s*\{\s*return\s+(?:err|error|_error)/g, (match) => {
    // Actually if it's `catch { return err }` we don't know which one.
    // The errors from tsc show exactly the files and line numbers.
    return match;
  });

  if (changed) {
    fs.writeFileSync(file, newContent2, 'utf8');
    console.log('Fixed', file);
  }
});
