var options = {
  startingHue: 120,
  clickLimiter: 0,
  timerInterval: 120,
  showTargets: true,
  rocketSpeed: 2.9,
  rocketAcceleration: 1.07,
  particleFriction: 0.95,
  particleGravity: 1,
  particleMinCount: 25,
  particleMaxCount: 40,
  particleMinRadius: 1,
  particleMaxRadius: 2
};

// Local variables
var fireworks = [];
var particles = [];
var mouse = { x: 0, y: 0 };
var currentHue = options.startingHue;
var clickLimiterTick = 0;
var timerTick = 0;

const sound = {
    init() {
        const savedSound = localStorage.getItem('sound') || 'off';
        this.enabled = savedSound === 'on';
        this.updateIcon(savedSound);
        
        // Initialize audio if sound is enabled
        if (this.enabled && !audioEnabled) {
            initAudio();
        }
    },
    
    toggle() {
        this.enabled = !this.enabled;
        const newState = this.enabled ? 'on' : 'off';
        localStorage.setItem('sound', newState);
        this.updateIcon(newState);
        
        // Initialize or disable audio
        if (this.enabled && !audioEnabled) {
            initAudio();
        } else if (!this.enabled) {
            audioEnabled = false;
        }
    },
    
    updateIcon(state) {
        const toggle = document.querySelector('#sound-toggle');
        if (toggle) toggle.textContent = state === 'on' ? '🔊' : '🔇';
    }
};

// Animation control
// Animation control
const animation = {
    init() {
        const savedAnimation = localStorage.getItem('animation') || 'on';
        this.enabled = savedAnimation === 'on';
        this.updateIcon(savedAnimation);
    },
    
    toggle() {
        this.enabled = !this.enabled;
        const newState = this.enabled ? 'on' : 'off';
        localStorage.setItem('animation', newState);
        this.updateIcon(newState);
        
        if (!this.enabled) {
            // Animation turned OFF - also turn off sound and clear canvas
            canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
            fireworks.length = 0;
            particles.length = 0;
            
            // Store current sound state before disabling
            const currentSoundState = sound.enabled ? 'on' : 'off';
            localStorage.setItem('soundBeforeAnimation', currentSoundState);
            
            // Disable sound
            sound.enabled = false;
            audioEnabled = false;
            sound.updateIcon('off');
            
        } else {
            // Animation turned ON - restore previous sound state
            const previousSoundState = localStorage.getItem('soundBeforeAnimation') || localStorage.getItem('sound') || 'off';
            
            if (previousSoundState === 'on') {
                sound.enabled = true;
                localStorage.setItem('sound', 'on');
                sound.updateIcon('on');
                
                // Initialize audio if needed
                if (!audioEnabled) {
                    initAudio();
                }
            }
        }
    },
    
    updateIcon(state) {
        const toggle = document.querySelector('#animation-toggle');
        if (toggle) toggle.textContent = state === 'on' ? '🔥' : '❄️';
    }
};

// Global toggle functions
window.toggleSound = sound.toggle.bind(sound);
window.toggleCanvas = animation.toggle.bind(animation);
// Helper functions
window.requestAnimFrame = (() =>
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  function (callback) {
    window.setTimeout(callback, 1000 / 60);
  }
)();

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function calculateDistance(p1x, p1y, p2x, p2y) {
  var xDistance = p1x - p2x;
  var yDistance = p1y - p2y;
  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

// Setup canvas
var canvas = document.getElementById('canvas');
var canvasCtx = canvas.getContext('2d');
var canvasWidth = window.innerWidth;
var canvasHeight = window.innerHeight;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Resize canvas
window.addEventListener('resize', () => {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
});

// Firework class
function Firework(sx, sy, tx, ty) {
  this.x = this.sx = sx;
  this.y = this.sy = sy;
  this.tx = tx;
  this.ty = ty;

  this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
  this.distanceTraveled = 0;

  this.coordinates = [];
  this.coordinateCount = 3;

  while (this.coordinateCount--) {
    this.coordinates.push([this.x, this.y]);
  }

  this.angle = Math.atan2(ty - sy, tx - sx);
  this.speed = options.rocketSpeed;
  this.acceleration = options.rocketAcceleration;
  this.brightness = random(50, 80);
  this.hue = currentHue;
  this.targetRadius = 1;
  this.targetDirection = false;
}

Firework.prototype.update = function (index) {
  this.coordinates.pop();
  this.coordinates.unshift([this.x, this.y]);

  if (!this.targetDirection) {
    if (this.targetRadius < 8) this.targetRadius += 0.15;
    else this.targetDirection = true;
  } else {
    if (this.targetRadius > 1) this.targetRadius -= 0.15;
    else this.targetDirection = false;
  }

  this.speed *= this.acceleration;

  var vx = Math.cos(this.angle) * this.speed;
  var vy = Math.sin(this.angle) * this.speed;
  this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);

  if (this.distanceTraveled >= this.distanceToTarget) {
    createParticles(this.tx, this.ty);
    fireworks.splice(index, 1);
  } else {
    this.x += vx;
    this.y += vy;
  }
};

Firework.prototype.draw = function () {
  var lastCoordinate = this.coordinates[this.coordinates.length - 1];

  canvasCtx.beginPath();
  canvasCtx.moveTo(lastCoordinate[0], lastCoordinate[1]);
  canvasCtx.lineTo(this.x, this.y);
  canvasCtx.strokeStyle = 'hsl(' + this.hue + ',100%,' + this.brightness + '%)';
  canvasCtx.stroke();

  if (options.showTargets) {
    canvasCtx.beginPath();
    canvasCtx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
    canvasCtx.stroke();
  }
};

// Particle class
function Particle(x, y) {
  this.x = x;
  this.y = y;

  this.coordinates = [];
  this.coordinateCount = 5;

  while (this.coordinateCount--) {
    this.coordinates.push([this.x, this.y]);
  }

  this.angle = random(0, Math.PI * 2);
  this.speed = random(1, 10);
  this.friction = options.particleFriction;
  this.gravity = options.particleGravity;
  this.hue = random(currentHue - 20, currentHue + 20);
  this.brightness = random(50, 80);
  this.alpha = 1;
  this.decay = random(0.01, 0.03);
}

Particle.prototype.update = function (index) {
  this.coordinates.pop();
  this.coordinates.unshift([this.x, this.y]);

  this.speed *= this.friction;
  this.x += Math.cos(this.angle) * this.speed;
  this.y += Math.sin(this.angle) * this.speed + this.gravity;

  this.alpha -= this.decay;
  if (this.alpha <= 0) {
    particles.splice(index, 1);
  }
};

Particle.prototype.draw = function () {
  var radius = Math.round(random(options.particleMinRadius, options.particleMaxRadius));
  var gradient = canvasCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius);
  gradient.addColorStop(0.1, 'hsla(' + this.hue + ',100%,' + this.brightness + '%,' + this.alpha + ')');

  canvasCtx.beginPath();
  canvasCtx.fillStyle = gradient;
  canvasCtx.arc(this.x, this.y, radius, 0, Math.PI * 2, false);
  canvasCtx.fill();
};

// Audio context for sound effects
var launchSound;
var explosionSound;
var audioEnabled = false;

function initAudio() {
  try {
    launchSound = new Audio('/assets/shot.mp3'); // Try adding "./"
    launchSound.preload = 'auto';
    launchSound.volume = 0.3;

    // Create metal impact sound  
    explosionSound = new Audio('/assets/hit.mp3'); // Try adding "./"
    explosionSound.preload = 'auto';
    explosionSound.volume = 0.4;

    audioEnabled = true;
  } catch (e) {
    console.log('Audio not supported');
  }
}

document.addEventListener('click', function enableAudio() {
  if (!audioEnabled) {
    initAudio();
  }
}, { once: false });

// Sound effect functions
function playLaunchSound() {
  if (!sound.enabled || !audioEnabled || !launchSound) return;
  
  try {
    launchSound.currentTime = 0;
    launchSound.play().catch(e => console.log('Launch sound failed:', e));
  } catch (e) {
    console.log('Launch sound not available');
  }
}

// Modify playExplosionSound function
function playExplosionSound() {
  if (!sound.enabled || !audioEnabled || !explosionSound) return;
  
  try {
    explosionSound.currentTime = 0;
    explosionSound.play().catch(e => console.log('Explosion sound failed:', e));
  } catch (e) {
    console.log('Explosion sound not available');
  }
}

function createParticles(x, y) {
  var count = Math.round(random(options.particleMinCount, options.particleMaxCount));
  while (count--) {
    particles.push(new Particle(x, y));
  }

  // Play explosion sound when particles are created
  playExplosionSound();
}

// Mouse tracking
canvas.addEventListener('mousemove', function (e) {
  mouse.x = e.pageX - canvas.offsetLeft;
  mouse.y = e.pageY - canvas.offsetTop;
});


// Also handle clicks anywhere on the page, not just canvas
document.addEventListener('click', function (e) {
  // Calculate position relative to canvas
  var rect = canvas.getBoundingClientRect();
  var targetX = e.clientX - rect.left;
  var targetY = e.clientY - rect.top;

  fireworks.push(new Firework(random(canvasWidth * 0.25, canvasWidth * 0.75), canvasHeight, targetX, targetY));
  playLaunchSound();
});

// Main loop
function gameLoop() {
    requestAnimFrame(gameLoop);

    // Only animate if animation is enabled
    if (!animation.enabled) return;

    currentHue += 0.5;

    // Rest of your existing gameLoop code...
    // Fade trail effect
    canvasCtx.globalCompositeOperation = 'destination-out';
    canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    canvasCtx.globalCompositeOperation = 'lighter';

    // Update and draw fireworks
    var i = fireworks.length;
    while (i--) {
        fireworks[i].draw();
        fireworks[i].update(i);
    }

    // Update and draw particles
    var j = particles.length;
    while (j--) {
        particles[j].draw();
        particles[j].update(j);
    }

    // Auto-launch fireworks
    if (timerTick >= options.timerInterval) {
        fireworks.push(new Firework(
            random(canvasWidth * 0.25, canvasWidth * 0.75),
            canvasHeight,
            random(canvasWidth * 0.25, canvasWidth * 0.75),
            random(0, canvasHeight / 2)
        ));
        playLaunchSound();
        timerTick = 0;
    } else {
        timerTick++;
    }
}

window.onload = function() {
    sound.init();
    animation.init();
    gameLoop();
};