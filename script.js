const images = {
    灯: '高松灯.jpg',
    立希: '椎名立希.jpg',
    素世: '长崎素世.jpg',
    爱音: '千早爱音.jpg',
    楽奈: '要乐奈.jpg'
};

class Ball {
    constructor(x, y, imageSrc) {
        this.x = x;
        this.y = y;
        this.radius = 60;
        this.velocityX = (Math.random() - 0.5) * 12;
        this.velocityY = (Math.random() - 0.5) * 12;
        this.image = new Image();
        this.image.src = imageSrc;
        this.image.onload = () => this.loaded = true;
        this.loaded = false;
    }

    checkCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + other.radius;
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

let balls = [];
let gameStarted = false;

function initGame() {
    resizeCanvas();
    
    // 初始化音频播放
    const musicFiles = [
        'music/haruhikage.wav',
        'music/hitoshizuku.wav',
        'music/maiyoihoshinouta.wav',
        'music/shiruetodance.wav'
    ];
    const bgm = document.getElementById('bgm');
    const startButton = document.getElementById('startButton');
    
    // 随机选择音乐
    bgm.src = musicFiles[Math.floor(Math.random() * musicFiles.length)];
    
    // 添加按钮点击事件
    startButton.addEventListener('click', () => {
        bgm.play();
        startButton.style.display = 'none';
    });

    // 初始化五个角色球
    Object.entries(images).forEach(([name, src], index) => {
        const x = 200 + index * 150;
        const y = canvas.height/2;
        balls.push(new Ball(x, y, src));
    });

    // 添加鼠标事件监听
    let selectedBall = null;
    
    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        balls.forEach(ball => {
            if (Math.hypot(x - ball.x, y - ball.y) < ball.radius) {
                selectedBall = ball;
                ball.velocityX = 0;
                ball.velocityY = 0;
            }
        });
    });

    canvas.addEventListener('mousemove', e => {
        if (selectedBall) {
            const rect = canvas.getBoundingClientRect();
            selectedBall.x = e.clientX - rect.left;
            selectedBall.y = e.clientY - rect.top;
        }
    });

    canvas.addEventListener('mouseup', () => {
        selectedBall = null;
    });

    // 启动游戏循环
    gameStarted = true;
    requestAnimationFrame(draw);
}

function draw() {
    if (!gameStarted) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 物理模拟
    balls.forEach(ball => {
        if (ball.loaded) {
            // 速度衰减
            ball.velocityX *= 1;
            ball.velocityY *= 1;

            // 边界碰撞
            if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) {
                ball.velocityX *= -1;
            }
            if (ball.y < ball.radius || ball.y > canvas.height - ball.radius) {
                ball.velocityY *= -1;
            }

            // 更新位置
            ball.x += ball.velocityX;
            ball.y += ball.velocityY;

            // 绘制角色
            ctx.save();
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(ball.image, ball.x - ball.radius, ball.y - ball.radius, ball.radius*2, ball.radius*2);
            ctx.restore();
        }
    });

    // 碰撞检测
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            if (balls[i].checkCollision(balls[j])) {
                // 完善碰撞物理
                const dx = balls[i].x - balls[j].x;
                const dy = balls[i].y - balls[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const nx = dx / distance;
                const ny = dy / distance;
                
                // 基于动量守恒的碰撞响应
                const mass = 1; // 假设质量相同
                const dvx = balls[i].velocityX - balls[j].velocityX;
                const dvy = balls[i].velocityY - balls[j].velocityY;
                const dotProduct = dvx * nx + dvy * ny;
                const impulse = (2 * dotProduct) / (mass + mass);
                
                // 添加最小速度阈值
                const minSpeed = 0.1;

                // 应用冲量并保持最小速度
                balls[i].velocityX -= impulse * mass * nx;
                balls[i].velocityY -= impulse * mass * ny;
                balls[j].velocityX += impulse * mass * nx;
                balls[j].velocityY += impulse * mass * ny;
                
                // 防止完全静止
                if (Math.abs(balls[i].velocityX) < minSpeed) balls[i].velocityX = 0;
                if (Math.abs(balls[i].velocityY) < minSpeed) balls[i].velocityY = 0;
                if (Math.abs(balls[j].velocityX) < minSpeed) balls[j].velocityX = 0;
                if (Math.abs(balls[j].velocityY) < minSpeed) balls[j].velocityY = 0;
            }
        }
    }

    requestAnimationFrame(draw);
}

// 等待所有图片加载完成
const loadPromises = Object.values(images).map(src => {
    return new Promise(resolve => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
    });
});

Promise.all(loadPromises)
    .then(initGame)
    .catch(error => console.error('图片加载失败:', error));

// 窗口大小变化时重置
window.addEventListener('resize', initGame);