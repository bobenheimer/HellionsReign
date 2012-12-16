
var schmupApp = function() {
    var obj = document.getElementById('objects').getContext('2d');
    var appHeight = 700;
    var appWidth = 600;
    return {
        objectCanvas: obj,
        height: appHeight,
        width: appWidth
    };
};


var Test = function() {
    this.schmup = schmupApp();
    this.moveSensitivity = 15; //1px
    this.ship = new Ship();
    this.x = 100;
    this.y = 600;
    
    
    this.moves = {
            37: false, //move left
            38: false, //move up
            39: false, //move right
            40: false //move down
        };
    
    window.onkeydown = function(e) {
        if(e.which > 36 && e.which <= 40) {
            this.moves[e.which] = true;
        }        
    }.bind(this);   
    
    window.onkeyup = function(e) {
        if(e.which > 36 && e.which <= 40) {
            this.moves[e.which] = false;
        }
    }.bind(this);
};

Test.prototype.draw = function() {
    setInterval(function() {
        this.updateKeyboardLocation();
        this.ship.draw({x: this.x, y: this.y, canvas: this.schmup.objectCanvas});
    }.bind(this), 33); 

};

Test.prototype.updateKeyboardLocation = function() {
    if(this.moves[38]) { //move up
        this.y -= this.moveSensitivity;
    }
    if(this.moves[40]) { //move down
        this.y += this.moveSensitivity;
    }
    if(this.moves[37]) { //move left
        this.x -= this.moveSensitivity;
    }
    if(this.moves[39]) { //move right
        this.x += this.moveSensitivity;
    } 
    if ((this.x + this.ship.width) > this.schmup.width) {
        this.x = (this.schmup.width - this.ship.width);
    }
    else if (this.x < 0) {
        this.x = 0;
    }
    if ((this.y + this.ship.height) > this.schmup.height) {
        this.y = (this.schmup.height - this.ship.height);
    }
    else if(this.y < 0) {
        this.y = 0;
    }
};

var Ship = function() {
    this.schmup = schmupApp();
    this.img = new Image();
    this.img.src = 'images/ship.png';

    this.img.onload = function() {
        this.width = this.img.width;
        this.height = this.img.height;
        //this.schmup.objectCanvas.drawImage(this.img, 100, 600);
    }.bind(this);
};

Ship.prototype.draw = function(args) {
    args.canvas.clearRect(0, 0, this.schmup.width, this.schmup.height);
    args.canvas.drawImage(this.img, args.x, args.y);  
};