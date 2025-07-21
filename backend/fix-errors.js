// Quick script to update error handlers
const fs = require('fs');
const path = require('path');

const files = [
  'src/controllers/upload.controller.ts',
  'src/controllers/processing.controller.ts',
  'src/services/audio/audio-processor.service.ts',
  'src/services/storage/storage.service.ts',
  'src/services/storage/file-upload.service.ts'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix error.message to error instanceof Error ? error.message : 'Unknown error'
    content = content.replace(
      /error\.message/g,
      'error instanceof Error ? error.message : "Unknown error"'
    );
    
    // Fix return statements in catch blocks
    content = content.replace(
      /} catch \(error\) \{([^}]+)(?!return)/g,
      '} catch (error) {$1return;'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  }
}

console.log('All error handlers updated!');