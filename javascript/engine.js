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
    
    this.player = new Player({shmup: this.shmup});
    this.frame = 0;
    
    this.waves = [];
    this.level = levels[0];
    
    this.waves[0] = new Wave({shmup: this.shmup, shipsPerRow: this.level.waves[0].shipsPerRow});
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
        
        for (var i = this.waves.length - 1; i >= 0; i--) {
            if(this.waves[i].enemies.length === 0) {
                this.waves.splice(i, 1);
            }
            else {
                this.checkForCollisions({firstList: this.waves[i].enemies, secondList: this.player.projectiles});
                this.waves[i].draw({canvas: this.shmup.objectCanvas});                  
            }
  
        }
        this.player.draw(); 
        this.frame += 1;
        //console.timeEnd('foo'); 
    }.bind(this), 20); 
};

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
 * Class for the human player
 */
var Player = function(args) {
    this.shmup = args.shmup;
    
    /*------------GET IMAGES--------------- */
    var playerShip = document.getElementById("player-ship");
    this.projectile = document.getElementById("projectile");
    this.ship = new PlayerShip({image: playerShip});
    
    this.projectiles = []; //all of the projectiles the PLAYER has firing on the screen
    this.newProjectiles = []; //new projectiles that will be added on the next frame refresh
    this.cannonOffsetLocations = []; //the location of the cannons relative to the player ship

    this.firing = false; //every frame we check if we are firing
    this.switchCannon({rate: 5, cannonOffsetLocations: [0.5], 
        updateFunction: function() {
            //this.x += Math.sin(this.y / 10) * 15;
            this.y -= 10;
    }});
    
    this.fireFrameOffset = 0; //the frame offset of when we started firing
    
    this.moveSensitivity = 10; //the amount in px to move on each frame update, the higher the more sensitive
    this.x = 100; //start x and y
    this.y = 600;
        
    //how much to move the player by on the next frame
    this.moveX = 0;
    this.moveY = 0;
};

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

/**
 * start firing, meaning on the next frame we start drawing projectiles from the player ship
 * @param args
 */
Player.prototype.fireOn = function(args) {
    if (!this.firing) {
        //this.fireFrameOffset = args.frame % this.rate;
        this.fireFrameOffset = 0;
        this.firing = true;        
    }
};

/**
 * stop firing
 */
Player.prototype.fireOff = function() {
    this.firing = false;
};

/**
 * Add projectiles that the player is firing
 */
Player.prototype.addProjectiles = function() {
    for (var i = 0; i < this.numberOfGuns; i++) {
        this.newProjectiles[i] = new Projectile({
            image: this.projectile, 
            height: this.projectile.height, 
            width: this.projectile.width,
            x: this.x + this.cannonOffsetLocations[i],
            y: this.y,
            updateFunction: this.updateFunction});
    }
    
};

/**
 * Draw all the player projectiles
 * @param args
 */
Player.prototype.drawProjectiles = function(args) {
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

/**
 * switch cannon
 * @param args.cannonOffsetLocations a List of the offset positions of the cannon [0.1, 0.9] are far apart [0.4, 0.6] close together
 * 
 */
Player.prototype.switchCannon = function(args) {
    var locations = args.cannonOffsetLocations;
    this.numberOfGuns = locations.length;
    this.updateFunction = args.updateFunction;
    for (var i = 0; i < this.numberOfGuns; i++) {
        //this.cannonOffsetLocations[i] = (i + 1) * 1 / (this.numberOfGuns + 1); //default
        this.cannonOffsetLocations[i] =  this.ship.width * locations[i];
    }
    this.rate = args.rate;
};

Player.prototype.draw = function(args) {       
    this.updateKeyboardLocation();
    //this.shmup.objectCanvas.clearRect(0, 0, this.shmup.width, this.shmup.height);
    
    /*-------------------DRAW STUFF----------------------------*/
    this.ship.draw({x: this.x, y: this.y, canvas: this.shmup.objectCanvas});
    this.drawProjectiles(args);

};

/**
 * If a projectile is off the screen, remove it completely
 */
Player.prototype.updateKeyboardLocation = function() {
    this.x = this.moveX * this.moveSensitivity + this.x;
    this.y = this.moveY * this.moveSensitivity + this.y;  
   
    /*-------------------Don't go off the canvas------------------*/
    if ((this.x + this.ship.width) > this.shmup.width) {
        this.x = (this.shmup.width - this.ship.width);
    }
    else if (this.x < 0) {
        this.x = 0;
    }
    if ((this.y + this.ship.height) > this.shmup.height) {
        this.y = (this.shmup.height - this.ship.height);
    }
    else if(this.y < 0) {
        this.y = 0;
    }
};

var PlayerShip = function(args) {
    this.image = args.image;
    this.height = this.image.height;
    this.width = this.image.width;
};

PlayerShip.prototype.draw = function(args) {
    this.x = args.x || this.x;
    this.y = args.y || this.y;
    args.canvas.drawImage(this.image, this.x, this.y);
};

/**
 * Super Class for any generic drawn Object that follows a set pattern(ie projectile, enemy ship
 * @param args.updateFunction a callback function to be run every time the object is redrawn (might redo the way this is done too)
 */
var ShmupObject = function(args) {
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
    //this.x = args.x || this.x;
    //this.y = args.y || this.y;
    args.canvas.drawImage(this.image, this.x, this.y);
};

ShmupObject.prototype.collision = function(args) {
    this.destroyed = true;
};

ShmupObject.prototype.isDestroyed = function(args) {
    return this.destroyed;
};

var Projectile = function(args) {
    ShmupObject.call(this, args);
    //this.rate = args.rate; //every x frames fire a shot
};

Projectile.prototype = Object.create(ShmupObject.prototype); //Projectile extends ShmupObject

var Enemy = function(args) {
    ShmupObject.call(this, args);
};

Enemy.prototype = Object.create(ShmupObject.prototype); //Enemy extends Shmup Object

/**
 * A wave of enemy ships, right now all it does is make a line of them
 */
var Wave = function(args) {
    //we need to pass a bunch of arguments to make different kinds of formations of waves
    //what do we want?
    //number of ships per each row, padding
    //if all else fails, allow a list of: (enemies passed in)
    var x, y, startX;
    this.shmup = args.shmup;
    this.enemyShipImage = document.getElementById("enemy-ship");
    this.enemies = [];
    args.padding = args.padding || 50;
    args.vpadding = args.vpadding || 5;
    
    var spacing = (this.shmup.width - 2 * args.padding) / Array.max(args.shipsPerRow);
    //console.log(spacing);
    for(var i = 0; i < args.shipsPerRow.length; i++) {
        startX = this.shmup.width / 2 - ((args.shipsPerRow[i] - 1) / 2) * spacing - (this.enemyShipImage.height / 2);
        for (var j = 0; j < args.shipsPerRow[i]; j++) {
            this.enemies[this.enemies.length] = new Enemy({
                image: this.enemyShipImage, 
                height: this.enemyShipImage.height, 
                width: this.enemyShipImage.width,
                x: startX + j * spacing,
                y: args.vpadding + i * this.enemyShipImage.height,
                updateFunction: function() {
                   this.y += 1;  
                }
            });  
            console.log(startX + j * spacing);
        }
    }
    /*
    for (var i = 50; i < args.shmup.width; i += 50) {
        this.enemies[this.enemies.length] = new Enemy({
            image: this.enemyShipImage, 
            height: this.enemyShipImage.height, 
            width: this.enemyShipImage.width,
            x: i,
            y: -20,
            updateFunction: function() {
               this.y += 1;  
            }
        });  
    } */

};

Wave.prototype.draw = function(args) {
    for (var i = this.enemies.length - 1; i >= 0; i--) {
        if ((this.enemies[i].y + this.enemies[i].height) > this.shmup.height || this.enemies[i].isDestroyed()) {
            this.enemies.splice(i, 1);
        }
        else {
            this.enemies[i].draw({canvas: args.canvas});            
        }
    }
};

