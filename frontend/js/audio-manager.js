const sounds = {
    background: new Audio('assets/sounds/background.mp3'),
    jump: new Audio('assets/sounds/jump.mp3'),
    powerup: new Audio('assets/sounds/powerup.mp3'),
    crash: new Audio('assets/sounds/crash.mp3'),
    continue: new Audio('assets/sounds/continue.mp3')
};

export function playBackgroundMusic() {
    sounds.background.loop = true;
    sounds.background.volume = 0.3;
    sounds.background.play().catch(e => console.log("User must interact first"));
}

export function playSound(type) {
    if (sounds[type]) {
        sounds[type].currentTime = 0;
        sounds[type].play().catch(e => console.log("Audio play failed"));
    }
}
