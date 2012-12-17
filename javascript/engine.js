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

var Engine = function() {
    this.player = new Player();
    this.frame = 0;
    
    /*-----------------ADD HANDLERS-----------------*/
    window.onkeydown = function(e) {
        if(e.which > 36 && e.which <= 40) {
            this.player.move({which: e.which});
        }    
        if(e.which === 32) {
            this.player.fireOn({frame: this.frame});
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

Engine.prototype.start = function(args) {
    setInterval(function() {
        //console.time('foo');
        this.player.draw({frame: this.frame}); 
        this.frame += 1;
        //console.timeEnd('foo'); 
    }.bind(this), 33); 
};

var Player = function() {
    this.shmup = shmupApp();
    
    /*------------GET IMAGES--------------- */
    var playerShip = document.getElementById("player-ship");
    this.projectile = document.getElementById("projectile");
    this.ship = new Ship({image: playerShip});
    
    this.projectiles = [];
    this.newProjectiles = [];

    this.firing = false;
    this.cannon = new Cannon({rate: 5, speed: 20});
    this.fireFrameOffset = 0; //the frame we start firing at
    
    this.moveSensitivity = 10; //the amount in px to move on each frame update
    this.x = 100; //start x and y
    this.y = 600;
        
    this.moveX = 0;
    this.moveY = 0;
};

Player.prototype.move = function(args) {
    if(args.which === 37 && this.moveX !== -1) {
        this.moveX = -1;
    }
    else if(args.which === 38 && this.moveY !== -1) {
        this.moveY = -1;
    }
    else if(args.which === 39 && this.moveX !== 1) {
        this.moveX = 1;
    }
    else if(args.which === 40 && this.moveY !== 1) {
        this.moveY = 1;
    }
};

Player.prototype.stopMove = function(args) {
    if(args.which === 37 && this.moveX === -1) {
        this.moveX = 0;
    }
    else if(args.which === 38 && this.moveY === -1) {
        this.moveY = 0;
    }
    else if(args.which === 39 && this.moveX === 1) {
        this.moveX = 0;
    }
    else if(args.which === 40 && this.moveY === 1) {
        this.moveY = 0;
    }

};

Player.prototype.fireOn = function(args) {
    if (!this.firing) {
        this.fireFrameOffset = args.frame % this.cannon.rate;
        this.firing = true;        
    }
};

Player.prototype.fireOff = function() {
    this.firing = false;
};

Player.prototype.addProjectiles = function() {
    this.newProjectiles[0] = new Projectile({image: this.projectile, 
                                             height: this.projectile.height, 
                                             width: this.projectile.width,
                                             rate: this.cannon.rate,
                                             speed: this.cannon.speed});
};

Player.prototype.drawProjectiles = function(args) {
    var i;

    if (this.firing && args.frame % this.cannon.rate === this.fireFrameOffset) {
        this.addProjectiles();
    }
    
    for (i = this.projectiles.length - 1; i >= 0; i--) {
        this.projectiles[i].draw({x: this.projectiles[i].x, 
                                  y: this.projectiles[i].y - this.projectiles[i].speed, 
                                  canvas: this.shmup.objectCanvas});
        if (this.projectiles[i].y < 0) {
            this.projectiles.splice(i, 1);
        }
    }
    //if there are new projectiles, add them to the list
    if (this.newProjectiles.length) {
        for (i = 0; i < this.newProjectiles.length; i++) {
                this.newProjectiles[i].draw({
                    x: this.ship.x + this.ship.width / 2, 
                    y: this.ship.y - this.newProjectiles[i].height, 
                    canvas: this.shmup.objectCanvas});                           
        }
        this.projectiles = this.projectiles.concat(this.newProjectiles.splice(0, this.newProjectiles.length));
    }
    console.log(this.projectiles);

};

Player.prototype.draw = function(args) {       
    this.updateKeyboardLocation();
    this.shmup.objectCanvas.clearRect(0, 0, this.shmup.width, this.shmup.height);
    
    /*-------------------DRAW STUFF----------------------------*/
    this.ship.draw({x: this.x, y: this.y, canvas: this.shmup.objectCanvas});
    this.drawProjectiles(args);

};

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

var ShmupObject = function(args) {
    this.image = args.image;
    this.height = this.image.height;
    this.width = this.image.width;
};


ShmupObject.prototype.draw = function(args) {
    args.canvas.drawImage(this.image, args.x, args.y);
    this.x = args.x;
    this.y = args.y;
};

var Ship = function(args) {
    ShmupObject.call(this, args);
    this.cannon = [];
};

Ship.prototype = Object.create(ShmupObject.prototype);

var Projectile = function(args) {
    ShmupObject.call(this, args);
    this.speed = args.speed;
    this.rate = args.rate; //every x frames fire a shot
};

Projectile.prototype = Object.create(ShmupObject.prototype);

var Cannon = function(args) {
    this.rate = args.rate || 10;
    this.speed = args.speed || 20;
};
