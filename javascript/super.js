/**
 * Super Class for any generic drawn Object that follows a set pattern(ie projectile, enemy ship
 * @param args.updateFunction a callback function to be run every time the object is redrawn (might redo the way this is done too)
 */
var ShmupObject = function(args) {
    this.shmup = args.shmup;
    this.image = args.image;
    this.height = this.image.height;
    this.width = this.image.width;
    this.health = args.health || 1;
    this.y = args.y;
    this.x = args.x;
    this.updateFunction = args.updateFunction.bind(this);
    this.destroyed = false;
};

ShmupObject.prototype.draw = function(args) {
    this.updateFunction();
    args.canvas.drawImage(this.image, this.x, this.y);
};

ShmupObject.prototype.collision = function(args) {
    this.destroyed = true;
};

ShmupObject.prototype.isDestroyed = function(args) {
    return this.destroyed;
};

var FiringObject = function(args) {
    ShmupObject.call(this, args);
    
    /*------------GET IMAGES--------------- */
    this.projectile = document.getElementById("enemybullet");
    
    this.projectiles = []; //all of the projectiles the object has firing on the screen
    this.cannonOffsetLocations = []; //the location of the cannons relative to the object

    this.firing = false; //every frame we check if we are firing
    this.switchCannon({rate: 40, cannonOffsetLocations: [0.5], 
        ProjectileUpdateFunction: function() {
            //this.x += 1000 * Math.sin(this.y / 10);
            this.y += 5;
        }
    });
    this.exploding = false;
    this.explodingIndex = 0;
    this.fireFrameOffset = 0; //the frame offset of when we started firing

};

FiringObject.prototype = Object.create(ShmupObject.prototype); 

FiringObject.prototype.fireOff = function(args) {
    this.firing = false;
};

FiringObject.prototype.fireOn = function(args) {
    if (!this.firing && !this.destroyed) {
        this.fireFrameOffset = 0;
        this.firing = true;        
    }
};

FiringObject.prototype.drawProjectiles = function() {
    var i;

    if (this.firing && this.fireFrameOffset % this.rate === 0) {
        this.addProjectiles();
    }

    
    for (i = this.projectiles.length - 1; i >= 0; i--) {
        if (this.projectiles[i].y < 0 || this.projectiles[i].isDestroyed()) {
            this.projectiles.splice(i, 1);
        }
        else {
            this.projectiles[i].draw({canvas: this.shmup.bulletCanvas});
        }
    }

    this.fireFrameOffset++;
};

FiringObject.prototype.switchCannon = function(args) {
    var locations = args.cannonOffsetLocations;
    this.numberOfGuns = locations.length;
    this.ProjectileUpdateFunction = args.ProjectileUpdateFunction;
    for (var i = 0; i < this.numberOfGuns; i++) {
        //this.cannonOffsetLocations[i] = (i + 1) * 1 / (this.numberOfGuns + 1); //default
        this.cannonOffsetLocations[i] =  this.width * locations[i];
    }
    this.rate = args.rate;
};

FiringObject.prototype.addProjectiles = function() {
    for (var i = 0; i < this.numberOfGuns; i++) {
        this.projectiles[this.projectiles.length] = new ShmupObject({
            image: this.projectile, 
            height: this.projectile.height, 
            width: this.projectile.width,
            x: this.x + this.cannonOffsetLocations[i],
            y: this.y,
            updateFunction: this.ProjectileUpdateFunction});
    }
    
};

FiringObject.prototype.draw = function(args) {
    this.updateFunction();
    this.drawProjectiles();
    if (this.exploding) {
        if (this.explodingIndex < this.shmup.enemyExplosions.length) {           
            this.shmup.bulletCanvas.drawImage(this.shmup.enemyExplosions[this.explodingIndex++], this.x, this.y); 
        }
        else {
            this.destroyed = true;
        }
    }
    else {
        this.shmup.bulletCanvas.drawImage(this.image, this.x, this.y); 
    }
};


FiringObject.prototype.collision = function(args) {
    this.exploding = true;
};
