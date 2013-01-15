Array.max = function( array ){
    return Math.max.apply( Math, array );
};

/*
 * shmupApp just stores global variables in a closure (http://stackoverflow.com/questions/111102/how-do-javascript-closures-work)
 */
var shmupApp = function() {
    var obj = document.getElementById('objects').getContext('2d');
    var bullets = document.getElementById('bulletCanvas').getContext('2d');
    var hud = document.getElementById('hud').getContext('2d');
    var appHeight = 700;
    var appWidth = 600;
    var enemyExplosions =  document.getElementById('enemy-explosions').getElementsByTagName("img");
    return {
        objectCanvas: obj,
        bulletCanvas: bullets,
        height: appHeight,
        width: appWidth,
        hudCanvas: hud,
        enemyExplosions: enemyExplosions
    };
};

/**
 * Engine ties everything together
 */
var Engine = function() {
    this.shmup = shmupApp();
    this.player = new Player({shmup: this.shmup, image: document.getElementById("player-ship"), updateFunction: function(){}, health: 600});
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
        this.shmup.bulletCanvas.clearRect(0, 0, this.shmup.width, this.shmup.height);
        var i,j;
        
        /*---------------CHECK FOR COLLISIONS ---------------------- */
        for (i = 0; i < this.level.spawnedWaves.length; i++) {
            if (!this.player.isDestroyed()) {
                this.checkForCollisions({firstList: this.level.spawnedWaves[i].enemies, secondList: this.player.projectiles});
                this.checkForCollisions({firstList: this.level.spawnedWaves[i].enemies, secondList: [this.player]});
                for (j = 0; j < this.level.spawnedWaves[i].enemies.length; j++) {
                    this.checkForCollisions({firstList: this.level.spawnedWaves[i].enemies[j].projectiles, secondList: [this.player]}); 
                }
                for (j = 0; j < this.level.spawnedWaves[i].destroyedEnemies.length; j++) {
                    this.checkForCollisions({firstList: this.level.spawnedWaves[i].destroyedEnemies[j].projectiles, secondList: [this.player]});
                }
            }
        }
        
        this.level.update(); //draw waves of enemies
        if (!this.player.isDestroyed()) {
            this.player.draw();  //draw player
        }
        else {
            this.shmup.hudCanvas.font = 'italic 40px Calibri';
            this.shmup.hudCanvas.fillText("YOU LOSE!!!", 10, 50);
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
