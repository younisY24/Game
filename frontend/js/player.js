export default class Player {
    constructor(gameWidth, gameHeight) {
        this.width = 50;
        this.height = 80;
        this.x = 100;
        this.y = gameHeight - 80 - this.height;
        this.velocityY = 0;
        this.isJumping = false;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.isFrozen = false;
    }

    jump() {
        if (!this.isJumping && !this.isFrozen) {
            this.velocityY = -20;
            this.isJumping = true;
            document.querySelector('.player').classList.add('jump');
            setTimeout(() => {
                document.querySelector('.player').classList.remove('jump');
            }, 500);
        }
    }

    update() {
        if (this.isFrozen) return;
        
        // تحديث الوضعية الرأسية
        this.y += this.velocityY;
        this.velocityY += 1; // الجاذبية
        
        // التحقق من الارتطام بالأرض
        if (this.y > this.gameHeight - 80 - this.height) {
            this.y = this.gameHeight - 80 - this.height;
            this.isJumping = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#4361ee';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // العينين
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 10, this.y + 15, 10, 10);
        ctx.fillRect(this.x + 30, this.y + 15, 10, 10);
    }

    reset() {
        this.y = this.gameHeight - 80 - this.height;
        this.velocityY = 0;
        this.isJumping = false;
        this.isFrozen = false;
    }
}
