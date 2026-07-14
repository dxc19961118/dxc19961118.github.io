<!doctype html><html lang="en"><head><!-- hexo injector head_begin start --><meta name="description" content="site_meta"></meta><!-- hexo injector head_begin end --><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="/favicon.ico">
<script>
// 自动跳转到独立应用页面
(function() {
  var redirectMap = {
    '/page/claude-code-prompt': '/apps/claude-code-prompt/index.html',
    '/page/lithos-hero': '/apps/lithos-hero/index.html',
    '/page/vanguard': '/apps/vanguard/index.html'
  };

  function checkAndRedirect() {
    var path = window.location.pathname;
    // 去掉尾部斜杠后再匹配
    var normalizedPath = path.replace(/\/$/, '');
    if (redirectMap[normalizedPath]) {
      window.location.href = redirectMap[normalizedPath];
    }
  }

  // 初始检查
  checkAndRedirect();

  // 监听 URL 变化（Vue Router 导航）
  window.addEventListener('popstate', checkAndRedirect);

  // 定期检查 URL 变化（防止 Vue Router 不使用 popstate）
  var lastPath = window.location.pathname;
  setInterval(function() {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      checkAndRedirect();
    }
  }, 100);
})();
</script>
<script type="module" crossorigin src="/static/js/index_prod-7a7a95b2.js"></script><link rel="stylesheet" href="/static/css/index_prod-477843f6.css"><!-- hexo injector head_end start --><script rel="prefetch" async src="https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script><script rel="preload" src="https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/prism/1.29.0/components/prism-core.js" data-manual></script><script rel="preload" src="https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.js"></script><script rel="preload" src="https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/prism/1.29.0/plugins/toolbar/prism-toolbar.min.js"></script><script rel="preload" src="https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/prism/1.29.0/plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js"></script><script rel="preload" src="https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js"></script><script rel="preload" src="https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/lodash.js/4.17.21/lodash.min.js"></script><link rel="stylesheet" href="https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/prism/1.29.0/themes/prism.min.css"/><link rel="stylesheet" href="https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/prism/1.29.0/plugins/toolbar/prism-toolbar.min.css"/><link rel="stylesheet" href="https://fonts.loli.net/css?family=Rubik" /><!-- hexo injector head_end end --><meta name="generator" content="Hexo 6.3.0"><link rel="alternate" href="/atom.xml" title="Hexo For Dxc" type="application/atom+xml">
</head><body id="body-container"><noscript><strong>We're sorry but this app doesn't work properly without JavaScript enabled. Please enable it to continue.</strong></noscript><div id="app"></div><!-- hexo injector body_end start -->
<style>
.click-effect {
  position: fixed;
  pointer-events: none;
  z-index: 9998;
  animation: clickEffectAnim 0.8s ease-out forwards;
}

@keyframes clickEffectAnim {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -150%) scale(1.5);
    opacity: 0;
  }
}

.click-particle {
  position: fixed;
  pointer-events: none;
  z-index: 9998;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: particleBurst 0.6s ease-out forwards;
}

@keyframes particleBurst {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>

<script>
(function() {
  // 特效类型：'heart' | 'star' | 'firework' | 'mixed'
  const EFFECT_TYPE = 'mixed';

  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];

  // 爱心SVG
  const heartSVG = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  // 星星SVG
  const starSVG = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';

  function createClickEffect(x, y) {
    const type = EFFECT_TYPE === 'mixed'
      ? ['heart', 'star', 'firework'][Math.floor(Math.random() * 3)]
      : EFFECT_TYPE;

    if (type === 'firework') {
      createFirework(x, y);
    } else {
      createIcon(x, y, type);
    }
  }

  function createIcon(x, y, type) {
    const el = document.createElement('div');
    el.className = 'click-effect';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.color = colors[Math.floor(Math.random() * colors.length)];
    el.innerHTML = type === 'heart' ? heartSVG : starSVG;
    document.body.appendChild(el);

    setTimeout(() => el.remove(), 800);
  }

  function createFirework(x, y) {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'click-particle';
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

      const angle = (Math.PI * 2 / particleCount) * i;
      const distance = 30 + Math.random() * 20;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      particle.style.animation = 'none';
      document.body.appendChild(particle);

      // 动画
      particle.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + tx + 'px), calc(-50% + ' + ty + 'px)) scale(0)', opacity: 0 }
      ], {
        duration: 600,
        easing: 'ease-out'
      });

      setTimeout(() => particle.remove(), 600);
    }
  }

  document.addEventListener('click', function(e) {
    createClickEffect(e.clientX, e.clientY);
  });
})();

// 隐藏友链页面的"随机访问"按钮
(function() {
  function hideRandomBtn() {
    var links = document.querySelectorAll('.link-box-btn-group a');
    for (var i = 0; i < links.length; i++) {
      if (links[i].textContent.trim() === '随机访问') {
        links[i].style.display = 'none';
      }
    }
  }
  // 页面加载后执行
  if (document.readyState === 'complete') {
    setTimeout(hideRandomBtn, 800);
  } else {
    window.addEventListener('load', function() {
      setTimeout(hideRandomBtn, 800);
    });
  }
  // MutationObserver 监听 DOM 变化
  var observer = new MutationObserver(function() {
    hideRandomBtn();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(function() { observer.disconnect(); }, 6000);
})();
</script>
<script>
(function() {
  function hideRandomBtn() {
    var links = document.querySelectorAll(".link-box-btn-group a");
    for (var i = 0; i < links.length; i++) {
      if (links[i].textContent.trim() === "\u968f\u673a\u8bbf\u95ee") {
        links[i].style.display = "none";
      }
    }
  }
  if (document.readyState === "complete") {
    setTimeout(hideRandomBtn, 800);
  } else {
    window.addEventListener("load", function() { setTimeout(hideRandomBtn, 800); });
  }
  var observer = new MutationObserver(function() { hideRandomBtn(); });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(function() { observer.disconnect(); }, 6000);
})();
</script>
<style>
#particleCanvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
}
</style>

<canvas id="particleCanvas"></canvas>

<script>
(function() {
  // 配置
  const CONFIG = {
    particleCount: 50,        // 粒子数量
    maxSize: 4,               // 最大尺寸
    minSize: 1,               // 最小尺寸
    speed: 0.5,               // 移动速度
    opacity: 0.5,             // 透明度
    color: '#667eea',         // 粒子颜色
    connectDistance: 120,     // 连线距离
    connectOpacity: 0.2,      // 连线透明度
    mouseRadius: 100,         // 鼠标影响范围
    mouseForce: 0.02          // 鼠标推力
  };

  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');

  let width, height;
  let particles = [];
  let mouse = { x: -1000, y: -1000 };

  // 调整画布大小
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  // 粒子类
  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
      this.speedX = (Math.random() - 0.5) * CONFIG.speed;
      this.speedY = (Math.random() - 0.5) * CONFIG.speed;
      this.opacity = 0.3 + Math.random() * CONFIG.opacity;
    }

    update() {
      // 鼠标影响
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < CONFIG.mouseRadius) {
        const force = (CONFIG.mouseRadius - distance) / CONFIG.mouseRadius;
        this.speedX -= dx * force * CONFIG.mouseForce;
        this.speedY -= dy * force * CONFIG.mouseForce;
      }

      // 限制速度
      const maxSpeed = CONFIG.speed * 2;
      const currentSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
      if (currentSpeed > maxSpeed) {
        this.speedX = (this.speedX / currentSpeed) * maxSpeed;
        this.speedY = (this.speedY / currentSpeed) * maxSpeed;
      }

      // 移动
      this.x += this.speedX;
      this.y += this.speedY;

      // 边界处理
      if (this.x < 0 || this.x > width) this.speedX *= -1;
      if (this.y < 0 || this.y > height) this.speedY *= -1;

      // 确保在范围内
      this.x = Math.max(0, Math.min(width, this.x));
      this.y = Math.max(0, Math.min(height, this.y));
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.color;
      ctx.globalAlpha = this.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // 初始化粒子
  function initParticles() {
    particles = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      particles.push(new Particle());
    }
  }

  // 绘制连线
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CONFIG.connectDistance) {
          const opacity = (1 - distance / CONFIG.connectDistance) * CONFIG.connectOpacity;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = CONFIG.color;
          ctx.globalAlpha = opacity;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  // 动画循环
  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    drawConnections();

    requestAnimationFrame(animate);
  }

  // 事件监听
  window.addEventListener('resize', () => {
    resize();
  });

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // 初始化
  resize();
  initParticles();
  animate();
})();
</script>
<!-- hexo injector body_end end --></body></html>