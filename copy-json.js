const fs = require('fs');
const path = require('path');

// 定义源目录和目标目录
const publicDir = path.resolve(__dirname, 'public');
const distDir = path.resolve(__dirname, 'dist');

// 确保dist目录存在
if (!fs.existsSync(distDir)) {
  console.error('构建目录不存在，请先运行 npm run build');
  process.exit(1);
}

// 读取public目录中的所有文件
const files = fs.readdirSync(publicDir);

// 过滤出JSON文件
const jsonFiles = files.filter(file => file.endsWith('.json'));

console.log('正在复制JSON文件到构建目录...');

// 复制每个JSON文件到dist根目录和dist/public目录
jsonFiles.forEach(file => {
  const sourceFile = path.join(publicDir, file);
  const destFile1 = path.join(distDir, file); // 复制到dist根目录
  const destPublicDir = path.join(distDir, 'public');
  const destFile2 = path.join(destPublicDir, file); // 复制到dist/public目录
  
  try {
    // 读取源文件
    const fileContent = fs.readFileSync(sourceFile);
    
    // 写入到dist根目录
    fs.writeFileSync(destFile1, fileContent);
    console.log(`已复制: ${file} -> dist/${file}`);
    
    // 确保dist/public目录存在
    if (!fs.existsSync(destPublicDir)) {
      fs.mkdirSync(destPublicDir, { recursive: true });
    }
    
    // 写入到dist/public目录
    fs.writeFileSync(destFile2, fileContent);
    console.log(`已复制: ${file} -> dist/public/${file}`);
  } catch (error) {
    console.error(`复制 ${file} 时出错:`, error);
  }
});

console.log('JSON文件复制完成！'); 