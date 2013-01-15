var Enemy = function(args) {
    FiringObject.call(this, args);
    this.fireProbability = args.fireProbability || 4;
};

Enemy.prototype = Object.create(FiringObject.prototype); //Enemy extends Shmup Object

Enemy.prototype.collision = function(args) {
    this.exploding = true;
    //this.destroyed = true;
    this.firing = false;
};

Enemy.prototype.drawProjectiles = function() {
    var i;

    if (this.fireFrameOffset % this.rate === 0 && this.firing) {
        if (Math.floor(Math.random() * 2) + 1 == 2) {
            this.fireOff();
        }
        else {
            this.addProjectiles();
        }

    }
    else if (this.fireFrameOffset % this.rate === 0 && Math.floor(Math.random() * 6) + 1 == 3) {
        this.fireOn();
        this.addProjectiles();
    }
       
    
    for (i = this.projectiles.length - 1; i >= 0; i--) {
        if (this.projectiles[i].y > this.shmup.height || this.projectiles[i].isDestroyed()) {
            this.projectiles.splice(i, 1);
        }
        else {
            this.projectiles[i].draw({canvas: this.shmup.bulletCanvas});
        }
    }

    this.fireFrameOffset++;
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
    this.destroyedEnemies = [];
    args.padding = args.padding || 0;
    args.vpadding = args.vpadding || 5;
    offsetY = (args.shipsPerRow.length - 1) * args.vpadding + args.shipsPerRow.length * this.enemyShipImage.height;
 
    var longestRow = (Array.max(args.shipsPerRow));
    var spacing = (this.shmup.width - 2 * args.padding) / (longestRow + 1);
    for(var i = 0; i < args.shipsPerRow.length; i++) {
        //startX = this.shmup.width / 2 - ((args.shipsPerRow[i] - 1) / 2) * spacing - (this.enemyShipImage.height / 2);
        startX = args.padding + spacing + ((longestRow - args.shipsPerRow[i]) / 2) * spacing - (this.enemyShipImage.height / 2);
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
                   //this.x += 1;
                   //this.x += Math.floor(Math.random() * 2);
                }
            });  
        }
    }

};

Wave.prototype.draw = function(args) {
    var i;
    for (i = this.enemies.length - 1; i >= 0; i--) {
        if (this.enemies[i].y > this.shmup.height) {
            this.enemies.splice(i, 1);
        }
        else if(this.enemies[i].isDestroyed()) {
            this.destroyedEnemies = this.destroyedEnemies.concat(this.enemies.splice(i, 1));
            //add to destroyed enemies
            /*if(this.enemies[i].projectiles.length !== 0) {
                this.enemies[i].drawProjectiles();
            }
            else {
                this.enemies.splice(i, 1);
            }*/
        }
        else {
            /** if (Math.floor(Math.random() * 900) + 1 == 3) {
                this.enemies[i].fireOn();
            }*/
            this.enemies[i].draw({canvas: args.canvas});   
        }
        //if the enemy is below the screen, delete it
        //else if the enemy is destroyed, 
            //if it still has projectiles, don't draw it, but draw the projectiles
            //else then delete it
        //else just draw it
    }
    //if (this.destroyedEnemies.length)
        //console.log(this.destroyedEnemies[0].projectiles.length);
    
    for (i = this.destroyedEnemies.length - 1; i >= 0; i--) {
        if(this.destroyedEnemies[i].projectiles.length === 0) {
            this.destroyedEnemies.splice(i, 1);
        }
        else {
            this.destroyedEnemies[i].drawProjectiles();
        }
    }
    //console.log(this.destroyedEnemies);
    
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
        if(this.spawnedWaves[i].enemies.length === 0 && this.spawnedWaves[i].destroyedEnemies.length === 0) {
            this.spawnedWaves.splice(i, 1);
        }
        else {
            this.spawnedWaves[i].draw({canvas: this.shmup.objectCanvas});                  
        }

    }
    this.lastWaveFrame++;
};