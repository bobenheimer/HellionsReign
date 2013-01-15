/**
 * Class for the human player
 */
var Player = function(args) {
    FiringObject.call(this, args);
    
    this.switchCannon({rate: 8, cannonOffsetLocations: [0.5], 
        ProjectileUpdateFunction: function() {
            //this.x += 5 * Math.sin(this.y / 50);
            this.y -= 10;
    }});
        
    this.moveSensitivity = 10; //the amount in px to move on each frame update, the higher the more sensitive
    this.x = this.shmup.width / 2  - this.width / 2; //start x and y
    this.y = this.shmup.height - this.height;
        
    //how much to move the player by on the next frame
    this.moveX = 0;
    this.moveY = 0;
};

Player.prototype = Object.create(FiringObject.prototype);

/**
 * Move the player with the keycode as input
 */
Player.prototype.move = function(args) {
    if(args.which === 37 && this.moveX !== -1) {
        this.moveX = -1; //left
        this.image = playerleft;
    }
    else if(args.which === 38 && this.moveY !== -1) {
        this.moveY = -1; //up
    }
    else if(args.which === 39 && this.moveX !== 1) {
        this.moveX = 1; //right
        this.image = playerright;
    }
    else if(args.which === 40 && this.moveY !== 1) {
        this.moveY = 1; //down
    }
};

/**
 * Stopmoving the player with the keycode as input
 */
Player.prototype.stopMove = function(args) {
    if(args.which === 37 && this.moveX === -1) {
        this.moveX = 0; //left
        this.image = document.getElementById("player-ship");
    }
    else if(args.which === 38 && this.moveY === -1) {
        this.moveY = 0; //up
    }
    else if(args.which === 39 && this.moveX === 1) {
        this.moveX = 0; //right
        this.image = document.getElementById("player-ship");
    }
    else if(args.which === 40 && this.moveY === 1) {
        this.moveY = 0; //down
    }

};

Player.prototype.draw = function(args) {       
    this.updateKeyboardLocation();
    
    /*-------------------DRAW STUFF----------------------------*/
    this.shmup.objectCanvas.drawImage(this.image, this.x, this.y);
    this.drawProjectiles(args);

};

/**
 * If a projectile is off the screen, remove it completely
 */
Player.prototype.updateKeyboardLocation = function() {
    this.x = this.moveX * this.moveSensitivity + this.x;
    this.y = this.moveY * this.moveSensitivity + this.y;  
   
    /*-------------------Don't go off the canvas------------------*/
    if ((this.x + this.width) > this.shmup.width) {
        this.x = (this.shmup.width - this.width);
    }
    else if (this.x < 0) {
        this.x = 0;
    }
    if ((this.y + this.height) > this.shmup.height) {
        this.y = (this.shmup.height - this.height);
    }
    else if(this.y < 0) {
        this.y = 0;
    }
};

Player.prototype.collision = function() {
    if(--this.health === 0) {
        this.destroyed = true;
    }
};