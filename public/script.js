// 工具导航页面JavaScript

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('工具导航页面已加载');
    
    // 添加页面加载动画
    addPageLoadAnimation();
    
    // 初始化工具卡片交互
    initializeToolCards();
});

// 页面加载动画
function addPageLoadAnimation() {
    const cards = document.querySelectorAll('.tool-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// 初始化工具卡片交互
function initializeToolCards() {
    const toolCards = document.querySelectorAll('.tool-card:not(.coming-soon)');
    
    toolCards.forEach(card => {
        // 添加键盘支持
        card.setAttribute('tabindex', '0');
        
        // 键盘事件监听
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
        
        // 添加焦点样式
        card.addEventListener('focus', function() {
            this.style.outline = '2px solid #3498db';
            this.style.outlineOffset = '2px';
        });
        
        card.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    });
}

// 导航到具体工具
function navigateToTool(toolName) {
    switch(toolName) {
        case 'xlsx-converter':
            // 创建Excel转CSV工具页面
            createXlsxConverterPage();
            break;
        default:
            showComingSoonModal();
    }
}

// 创建Excel转CSV工具页面
function createXlsxConverterPage() {
    const converterHTML = `
        <div class="converter-container">
            <div class="converter-header">
                <h2><i class="fas fa-file-excel"></i> Excel转CSV工具</h2>
                <p>将Excel文件(.xlsx)快速转换为CSV格式</p>
            </div>
            
            <div class="converter-content">
                <div class="upload-area" id="uploadArea">
                    <div class="upload-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <div class="upload-text">
                        <h3>拖拽文件到此处或点击选择文件</h3>
                        <p>支持.xlsx格式，最大10MB</p>
                    </div>
                    <input type="file" id="fileInput" accept=".xlsx" style="display: none;">
                </div>
                
                <div class="progress-area" id="progressArea" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <p class="progress-text" id="progressText">正在处理文件...</p>
                </div>
                
                <div class="result-area" id="resultArea" style="display: none;">
                    <div class="success-message">
                        <i class="fas fa-check-circle"></i>
                        <h3>转换成功！</h3>
                        <p id="resultMessage"></p>
                        <button class="download-btn" id="downloadBtn">
                            <i class="fas fa-download"></i> 下载CSV文件
                        </button>
                    </div>
                </div>
                
                <div class="error-area" id="errorArea" style="display: none;">
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>转换失败</h3>
                        <p id="errorMessage"></p>
                    </div>
                </div>
            </div>
            
            <div class="converter-footer">
                <button class="back-btn" onclick="showMainPage()">
                    <i class="fas fa-arrow-left"></i> 返回主页
                </button>
            </div>
        </div>
    `;
    
    // 替换页面内容
    document.querySelector('.main-content').innerHTML = converterHTML;
    
    // 初始化转换器功能
    initializeConverter();
}

// 初始化转换器功能
function initializeConverter() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const progressArea = document.getElementById('progressArea');
    const resultArea = document.getElementById('resultArea');
    const errorArea = document.getElementById('errorArea');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // 点击上传区域
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // 文件选择
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    // 处理文件
    function handleFile(file) {
        // 验证文件类型
        if (!file.name.toLowerCase().endsWith('.xlsx')) {
            showError('请选择.xlsx格式的Excel文件');
            return;
        }
        
        // 验证文件大小 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError('文件大小不能超过10MB');
            return;
        }
        
        // 开始上传
        uploadFile(file);
    }
    
    // 上传文件
    function uploadFile(file) {
        const formData = new FormData();
        formData.append('xlsxFile', file);
        
        // 显示进度条
        showProgress();
        
        // 模拟进度
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            updateProgress(progress);
        }, 200);
        
        // 发送请求
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            clearInterval(progressInterval);
            updateProgress(100);
            
            setTimeout(() => {
                if (data.success) {
                    showResult(data);
                } else {
                    showError(data.message);
                }
            }, 500);
        })
        .catch(error => {
            clearInterval(progressInterval);
            showError('上传失败: ' + error.message);
        });
    }
    
    // 显示进度
    function showProgress() {
        uploadArea.style.display = 'none';
        progressArea.style.display = 'block';
        resultArea.style.display = 'none';
        errorArea.style.display = 'none';
    }
    
    // 更新进度
    function updateProgress(percent) {
        progressFill.style.width = percent + '%';
        progressText.textContent = `正在处理文件... ${Math.round(percent)}%`;
    }
    
    // 显示结果
    function showResult(data) {
        progressArea.style.display = 'none';
        resultArea.style.display = 'block';
        errorArea.style.display = 'none';
        
        document.getElementById('resultMessage').textContent = 
            `文件 "${data.fileName}" 转换成功！`;
        
        downloadBtn.onclick = () => {
            window.open(data.downloadUrl, '_blank');
            // 下载后自动返回上传页面
            setTimeout(() => {
                resetUploadPage();
            }, 1000);
        };
    }
    
    // 显示错误
    function showError(message) {
        uploadArea.style.display = 'block';
        progressArea.style.display = 'none';
        resultArea.style.display = 'none';
        errorArea.style.display = 'block';
        
        document.getElementById('errorMessage').textContent = message;
        
        // 3秒后隐藏错误信息
        setTimeout(() => {
            errorArea.style.display = 'none';
        }, 3000);
    }
    
    // 重置上传页面
    function resetUploadPage() {
        const uploadArea = document.getElementById('uploadArea');
        const progressArea = document.getElementById('progressArea');
        const resultArea = document.getElementById('resultArea');
        const errorArea = document.getElementById('errorArea');
        const fileInput = document.getElementById('fileInput');
        
        // 重置所有区域显示状态
        uploadArea.style.display = 'block';
        progressArea.style.display = 'none';
        resultArea.style.display = 'none';
        errorArea.style.display = 'none';
        
        // 清空文件输入
        if (fileInput) {
            fileInput.value = '';
        }
        
        // 重置进度条
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = '0%';
        }
        
        // 显示重置提示
        showResetNotification();
    }
    
    // 显示重置提示
    function showResetNotification() {
        // 创建提示元素
        const notification = document.createElement('div');
        notification.className = 'reset-notification';
        notification.innerHTML = `
            <i class="fas fa-refresh"></i>
            <span>页面已重置，可以继续上传新文件</span>
        `;
        
        // 添加到页面
        document.querySelector('.converter-content').appendChild(notification);
        
        // 3秒后移除提示
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// 显示主页
function showMainPage() {
    location.reload();
}

// 显示即将推出模态框
function showComingSoonModal() {
    showModal('即将推出', '该工具正在开发中，敬请期待！');
}

// 显示关于我们模态框
function showAbout() {
    const aboutContent = `
        <h3>关于 Utils Web Services</h3>
        <p>我们致力于提供简单、实用的在线工具服务，帮助用户提高工作效率。</p>
        <h4>主要特性：</h4>
        <ul>
            <li>简单易用的界面设计</li>
            <li>快速高效的文件处理</li>
            <li>安全可靠的数据处理</li>
            <li>完全免费使用</li>
        </ul>
        <p><strong>版本：</strong> 1.0.0</p>
        <p><strong>许可证：</strong> MIT</p>
    `;
    showModal('关于我们', aboutContent);
}

// 显示帮助模态框
function showHelp() {
    const helpContent = `
        <h3>使用帮助</h3>
        <h4>Excel转CSV工具：</h4>
        <ol>
            <li>点击上传区域或拖拽文件到指定区域</li>
            <li>选择.xlsx格式的Excel文件（最大10MB）</li>
            <li>等待文件转换完成</li>
            <li>点击下载按钮获取CSV文件</li>
        </ol>
        <h4>注意事项：</h4>
        <ul>
            <li>只支持.xlsx格式的Excel文件</li>
            <li>文件大小限制为10MB</li>
            <li>转换后的文件会自动下载</li>
            <li>临时文件会在30分钟后自动清理</li>
        </ul>
    `;
    showModal('使用帮助', helpContent);
}

// 显示联系我们模态框
function showContact() {
    const contactContent = `
        <h3>联系我们</h3>
        <p>如果您在使用过程中遇到任何问题，或有任何建议，请通过以下方式联系我们：</p>
        <div class="contact-info">
            <p><i class="fas fa-envelope"></i> 邮箱：lixian.hn@gmail.com</p>
        </div>
        <p>我们会在24小时内回复您的邮件。</p>
    `;
    showModal('联系我们', contactContent);
}

// 显示模态框
function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <h2>${title}</h2>
        <div class="modal-content-text">${content}</div>
    `;
    
    modal.style.display = 'block';
}

// 关闭模态框
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
