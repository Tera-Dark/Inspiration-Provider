/**
 * JSON文件复制工具 - 专门用于部署时复制JSON文件到多个路径
 */

const fs = require('fs');
const path = require('path');

try {
  console.log('JSON文件复制工具启动...');
  
  // 定义源目录和目标目录
  const publicDir = path.resolve(__dirname, 'public');
  const distDir = path.resolve(__dirname, 'dist');
  
  // 检查目录是否存在
  if (!fs.existsSync(publicDir)) {
    console.error('错误: 未找到public目录');
    process.exit(1);
  }
  
  if (!fs.existsSync(distDir)) {
    console.error('错误: 未找到dist目录，请先运行 npm run build');
    process.exit(1);
  }
  
  // 读取public目录中的所有文件
  const files = fs.readdirSync(publicDir);
  
  // 过滤出JSON文件
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  
  if (jsonFiles.length === 0) {
    console.log('注意: 未找到任何JSON文件，跳过复制过程');
    process.exit(0);
  }
  
  console.log(`找到 ${jsonFiles.length} 个JSON文件，开始复制...`);
  
  // 所有可能的目标目录
  const directories = [
    distDir,                    // 根目录
    path.join(distDir, 'public'), // /public目录
    path.join(distDir, 'assets')  // /assets目录
  ];
  
  // 确保所有目标目录存在
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`创建目录: ${path.relative(process.cwd(), dir)}`);
    }
  });
  
  // 复制文件到所有目录
  let successCount = 0;
  let failCount = 0;
  
  for (const file of jsonFiles) {
    try {
      // 读取源文件
      const sourceFile = path.join(publicDir, file);
      const content = fs.readFileSync(sourceFile);
      
      // 复制到每个目标目录
      for (const dir of directories) {
        const destFile = path.join(dir, file);
        
        try {
          fs.writeFileSync(destFile, content);
          console.log(`✅ 已复制: ${file} -> ${path.relative(process.cwd(), destFile)}`);
          successCount++;
        } catch (err) {
          console.error(`❌ 复制失败 ${file} -> ${path.relative(process.cwd(), destFile)}: ${err.message}`);
          failCount++;
        }
      }
    } catch (error) {
      console.error(`❌ 处理文件 ${file} 时出错: ${error.message}`);
      failCount++;
    }
  }
  
  // 汇总结果
  console.log('----------------------------------------');
  console.log(`复制完成: ${successCount} 成功, ${failCount} 失败`);
  
  if (failCount > 0) {
    console.log('注意: 部分文件复制失败，但仍可继续部署');
  } else {
    console.log('所有文件复制成功！');
  }
  
  process.exit(failCount > 0 ? 1 : 0);
} catch (error) {
  console.error('执行过程中发生严重错误:');
  console.error(error);
  process.exit(1);
} 