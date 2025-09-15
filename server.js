const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static('public'));

// 确保必要目录存在
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, 'downloads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

// Multer配置 - 文件上传中间件
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名，避免冲突
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 文件过滤器 - 只允许xlsx文件
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        path.extname(file.originalname).toLowerCase() === '.xlsx') {
        cb(null, true);
    } else {
        cb(new Error('只支持.xlsx格式的Excel文件'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
    }
});

// xlsx到csv转换函数
function convertXlsxToCsv(xlsxPath, outputPath) {
    try {
        // 读取Excel文件
        const workbook = xlsx.readFile(xlsxPath);
        
        // 获取第一个工作表
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 转换为CSV格式
        const csvData = xlsx.utils.sheet_to_csv(worksheet);
        
        // 写入CSV文件
        fs.writeFileSync(outputPath, csvData, 'utf8');
        
        return {
            success: true,
            message: '转换成功',
            csvPath: outputPath
        };
    } catch (error) {
        return {
            success: false,
            message: '转换失败: ' + error.message
        };
    }
}

// 文件清理函数
function cleanupFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('已清理文件:', filePath);
        }
    } catch (error) {
        console.error('清理文件失败:', error.message);
    }
}

// 路由定义

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 文件上传和转换路由
app.post('/upload', upload.single('xlsxFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的xlsx文件'
            });
        }

        const xlsxPath = req.file.path;
        const originalName = path.parse(req.file.originalname).name;
        const csvFileName = originalName + '_converted.csv';
        const csvPath = path.join(downloadsDir, csvFileName);

        // 执行转换
        const conversionResult = convertXlsxToCsv(xlsxPath, csvPath);

        if (conversionResult.success) {
            // 清理上传的xlsx文件
            cleanupFile(xlsxPath);
            
            res.json({
                success: true,
                message: '文件转换成功',
                downloadUrl: `/download/${csvFileName}`,
                fileName: csvFileName
            });
        } else {
            // 转换失败，清理文件
            cleanupFile(xlsxPath);
            cleanupFile(csvPath);
            
            res.status(500).json({
                success: false,
                message: conversionResult.message
            });
        }
    } catch (error) {
        // 清理可能存在的文件
        if (req.file) {
            cleanupFile(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: '服务器错误: ' + error.message
        });
    }
});

// 文件下载路由
app.get('/download/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(downloadsDir, filename);
        
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: '文件不存在'
            });
        }
        
        // 设置下载响应头，处理中文文件名乱码
        const encodedFilename = encodeURIComponent(filename);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        
        // 发送文件
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('文件下载错误:', err);
                res.status(500).json({
                    success: false,
                    message: '文件下载失败'
                });
            } else {
                // 下载完成后清理文件
                setTimeout(() => {
                    cleanupFile(filePath);
                }, 1000);
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '下载错误: ' + error.message
        });
    }
});

// 错误处理中间件
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '文件大小超过限制（最大10MB）'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '请求的资源不存在'
    });
});

// 定期清理临时文件（每30分钟）
setInterval(() => {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30分钟
    
    // 清理uploads目录
    fs.readdir(uploadsDir, (err, files) => {
        if (!err) {
            files.forEach(file => {
                const filePath = path.join(uploadsDir, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtime.getTime() > maxAge) {
                    cleanupFile(filePath);
                }
            });
        }
    });
    
    // 清理downloads目录
    fs.readdir(downloadsDir, (err, files) => {
        if (!err) {
            files.forEach(file => {
                const filePath = path.join(downloadsDir, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtime.getTime() > maxAge) {
                    cleanupFile(filePath);
                }
            });
        }
    });
}, 30 * 60 * 1000);

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('xlsx到csv转换服务已启动');
});

module.exports = app;
