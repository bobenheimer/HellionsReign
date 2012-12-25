//BUG: if an enemy is destroyed and still has projectiles we still collision detect

Array.max = function( array ){
    return Math.max.apply( Math, array );
};

/*
 * shmupApp just stores global variables in a closure (http://stackoverflow.com/questions/111102/how-do-javascript-closures-work)
 */
var shmupApp = function() {
    var obj = document.getElementById('objects').getContext('2d');
    var appHeight = 700;
    var appWidth = 600;
    return {
        objectCanvas: obj,
        height: appHeight,
        width: appWidth
    };
};

/**
 * Engine ties everything together
 */
var Engine = function() {
    this.shmup = shmupApp();
    
    this.player = new Player({shmup: this.shmup, image: document.getElementById("player-ship"), updateFunction: function(){}});
    this.frame = 0;
    
    for (var i = 0; i < levels.length; i++) {
        levels[i].shmup = this.shmup;
    }

    this.level = new Level(levels[0]);
    //this.waves[0] = new Wave({shmup: this.shmup, shipsPerRow: this.level.waves[0].shipsPerRow});
    //this.waves[0] = new Wave({shmup: this.shmup});
    
    /*-----------------ADD HANDLERS FOR KEYPRESSING-----------------*/
    window.onkeydown = function(e) {
        if(e.which > 36 && e.which <= 40) {
            this.player.move({which: e.which});
        }    
        if(e.which === 32) {
            this.player.fireOn();
        }
    }.bind(this);   
    
    window.onkeyup = function(e) {
        if(e.which > 36 && e.which <= 40) {
            this.player.stopMove({which: e.which});
        }
        if(e.which === 32) {
            this.player.fireOff();
        }
    }.bind(this);
};

/**
 * Start the game
 * @param args
 */
Engine.prototype.start = function(args) {
    setInterval(function() {
        //console.time('foo');
        this.shmup.objectCanvas.clearRect(0, 0, this.shmup.width, this.shmup.height);
        

        /*---------------CHECK FOR COLLISIONS ---------------------- */
        for (var i = 0; i < this.level.spawnedWaves.length; i++) {
            this.checkForCollisions({firstList: this.level.spawnedWaves[i].enemies, secondList: this.player.projectiles});
            for (var j = 0; j < this.level.spawnedWaves[i].enemies.length; j++) {
                this.checkForCollisions({firstList: this.level.spawnedWaves[i].enemies[j].projectiles, secondList: [this.player]}); 
            }
        }
        
        this.level.update(); //draw waves of enemies
        if (!this.player.isDestroyed()) {
            this.player.draw();  //draw player
        }

        this.frame += 1;
        //console.timeEnd('foo'); 
    }.bind(this), 20); 
};


//each fiedl must have a width a height, x, y, and a .collision
Engine.prototype.checkForCollisions = function(args) {
    var firstList = args.firstList;
    var secondList = args.secondList;
    for (var i = firstList.length - 1; i >= 0; i--) {
        for (var j = secondList.length - 1; j >= 0; j--) {
            if (this.intersectRect({
                r1: {left: firstList[i].x, right: firstList[i].x + firstList[i].width, top: firstList[i].y, bottom: firstList[i].y + firstList[i].height},
                r2: {left: secondList[j].x, right: secondList[j].x + secondList[j].width, top: secondList[j].y, bottom: secondList[j].y + secondList[j].height}})) {
                    firstList[i].collision();
                    secondList[j].collision();
            }
        }
    }   
};

Engine.prototype.intersectRect = function(args) {
    return !(args.r2.left > args.r1.right || 
            args.r2.right < args.r1.left || 
            args.r2.top > args.r1.bottom ||
            args.r2.bottom < args.r1.top);
};

/**
 * Super Class for any generic drawn Object that follows a set pattern(ie projectile, enemy ship
 * @param args.updateFunction a callback function to be run every time the object is redrawn (might redo the way this is done too)
 */
var ShmupObject = function(args) {
    this.shmup = args.shmup;
    this.image = args.image;
    this.height = this.image.height;
    this.width = this.image.width;
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
    this.projectile = document.getElementById("projectile");
    
    this.projectiles = []; //all of the projectiles the PLAYER has firing on the screen
    this.newProjectiles = []; //new projectiles that will be added on the next frame refresh
    this.cannonOffsetLocations = []; //the location of the cannons relative to the object

    this.firing = false; //every frame we check if we are firing
    this.switchCannon({rate: 40, cannonOffsetLocations: [0.5], 
        ProjectileUpdateFunction: function() {
            //this.x += 1000 * Math.sin(this.y / 10);
            this.y += 5;
        }
    });
    
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

FiringObject.prototype.drawProjectiles = function(args) {
    var i;

    if (this.firing && this.fireFrameOffset % this.rate === 0) {
        this.addProjectiles();
    }
    
    //add new Projectiles to the list
    for (i = 0; i < this.newProjectiles.length; i++) {
        this.projectiles = this.projectiles.concat(this.newProjectiles.splice(0, this.newProjectiles.length));                          
    }
    
    for (i = this.projectiles.length - 1; i >= 0; i--) {
        if (this.projectiles[i].y < 0 || this.projectiles[i].isDestroyed()) {
            this.projectiles.splice(i, 1);
        }
        else {
            this.projectiles[i].draw({canvas: this.shmup.objectCanvas});
        }
    }
    //if there are new projectiles, add them to the list
    /*if (this.newProjectiles.length) {
        for (i = 0; i < this.newProjectiles.length; i++) {
                this.newProjectiles[i].draw({canvas: this.shmup.objectCanvas});                           
        }
        this.projectiles = this.projectiles.concat(this.newProjectiles.splice(0, this.newProjectiles.length));
    }*/
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
        this.newProjectiles[i] = new ShmupObject({
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
    this.shmup.objectCanvas.drawImage(this.image, this.x, this.y);
};

/**
 * Class for the human player
 */
var Player = function(args) {
    FiringObject.call(this, args);
    
    this.switchCannon({rate: 8, cannonOffsetLocations: [0.5], 
        ProjectileUpdateFunction: function() {
            this.x += 5 * Math.sin(this.y / 50);
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
    }
    else if(args.which === 38 && this.moveY !== -1) {
        this.moveY = -1; //up
    }
    else if(args.which === 39 && this.moveX !== 1) {
        this.moveX = 1; //right
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
    }
    else if(args.which === 38 && this.moveY === -1) {
        this.moveY = 0; //up
    }
    else if(args.which === 39 && this.moveX === 1) {
        this.moveX = 0; //right
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


var Enemy = function(args) {
    FiringObject.call(this, args);
};

Enemy.prototype = Object.create(FiringObject.prototype); //Enemy extends Shmup Object

Enemy.prototype.collision = function(args) {
    this.destroyed = true;
    this.firing = false;
};

Enemy.prototype.collision = function(args) {
    this.destroyed = true;
    this.firing = false;
};

/**
 * A wave of enemy ships, right now all it does is make a line of them
 */
var Wave = function(args) {
    //we need to pass a bunch of arguments to make different kinds of formations of waves
    //what do we want?
    //number of ships per each row, padding
    //if all else fails, allow a list of: (enemies passed in)
    var startX, offsetY;
    this.shmup = args.shmup;
    this.enemyShipImage = document.getElementById("enemy-ship");
    this.enemies = [];
    args.padding = args.padding || 50;
    args.vpadding = args.vpadding || 5;
    offsetY = (args.shipsPerRow.length - 1) * args.vpadding + args.shipsPerRow.length * this.enemyShipImage.height;
 
    var longestRow = (Array.max(args.shipsPerRow));
    var spacing = (this.shmup.width - 2 * args.padding) / (longestRow + 1);
    //console.log(args);
    for(var i = 0; i < args.shipsPerRow.length; i++) {
        //startX = this.shmup.width / 2 - ((args.shipsPerRow[i] - 1) / 2) * spacing - (this.enemyShipImage.height / 2);
        startX = args.padding + spacing + ((longestRow - args.shipsPerRow[i]) / 2) * spacing - (this.enemyShipImage.height / 2);
        //console.log(startX); //shuld be 216.67
        for (var j = 0; j < args.shipsPerRow[i]; j++) {
            this.enemies[this.enemies.length] = new Enemy({
                shmup: this.shmup,
                image: this.enemyShipImage, 
                height: this.enemyShipImage.height, 
                width: this.enemyShipImage.width,
                x: startX + j * spacing,
                y: args.vpadding + i * this.enemyShipImage.height - offsetY,
                updateFunction: function() {
                   this.y += 1;
                   //this.x += Math.floor(Math.random() * 2);
                }
            });  
            //console.log(startX + j * spacing);
        }
    }

};

Wave.prototype.draw = function(args) {
    for (var i = this.enemies.length - 1; i >= 0; i--) {
        if (this.enemies[i].y > this.shmup.height) {
            this.enemies.splice(i, 1);
        }
        else if(this.enemies[i].isDestroyed()) {
            if(this.enemies[i].projectiles.length !== 0) {
                this.enemies[i].drawProjectiles();
            }
            else {
                this.enemies.splice(i, 1);
            }
        }
        else {
            if (Math.floor(Math.random() * 11900) + 1 == 3) {
                this.enemies[i].fireOn();
            }
            this.enemies[i].draw({canvas: args.canvas});   
        }
        //if the enemy is below the screen, delete it
        //else if the enemy is destroyed, 
            //if it still has projectiles, don't draw it, but draw the projectiles
            //else then delete it
        //else just draw it
    }
};

var Level = function(args) {
    this.shmup = args.shmup;
    this.waves = [];
    this.spawnedWaves = [];
    this.lastWaveFrame = 0;
    this.nextWaveIndex = 0;
    for (var i = 0; i < args.waves.length; i++) {
        this.waves[i] = args.waves[i];
    }

};

Level.prototype.update = function(args) {
	if(this.waves[this.nextWaveIndex]) {
		if(this.waves[this.nextWaveIndex].waitForPreviousSpawn && this.spawnedWaves.length === 0) {
			this.lastWaveFrame = 0;
			this.waves[this.nextWaveIndex].waitForPreviousSpawn = false;
		}
		if (!this.waves[this.nextWaveIndex].waitForPreviousSpawn && this.lastWaveFrame === this.waves[this.nextWaveIndex].spawnTime) {
	        this.lastWaveFrame = 0;
	        this.spawnedWaves[this.spawnedWaves.length] = 
	            new Wave({
	                shmup: this.shmup, 
	                shipsPerRow: this.waves[this.nextWaveIndex].shipsPerRow
	                });;
	        this.nextWaveIndex++;
		}
	}
	else {
		//level is over almost
	}
    //check if we need to spawn new waves
    //check if we need to delete waves
    //console.log(this.waves[this.nextWaveIndex]);
    
    for (var i = this.spawnedWaves.length - 1; i >= 0; i--) {
        if(this.spawnedWaves[i].enemies.length === 0) {
            this.spawnedWaves.splice(i, 1);
        }
        else {
            this.spawnedWaves[i].draw({canvas: this.shmup.objectCanvas});                  
        }

    }
	this.lastWaveFrame++;
};


