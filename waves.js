var hscale = 1
var points = 1500;
var numWaves = 30;
var spikes = 500;
var arr = [];
var colors = [];
function setup() {

  var cnv = createCanvas(windowWidth, hscale*windowHeight);
  frameRate(24);
  cnv.position(0,0 * windowHeight);
  points = windowWidth;  
 numWaves = hscale*windowHeight / 8;
 for(var i = 0; i < spikes; i++) {
  arr.push(Math.random());
}
colors = [
  color(239, 58, 71)];
}
 var t = 0; 
var change = 1;
  
function draw() {
  clear()
  background('rgba(255,255,255,0)');
  for (var l = 0; l < numWaves; l++) {
    stroke(colors[0]);
    strokeWeight(.5);
    beginShape(POINTS);
    for (var x = -10; x <= points; x += 8) {
      // Big
      var freq1 = 0.8;
      var amp1 = 4; 
      var phase1 = t * (0.7 + l * 0.15) + l * 2;
      //Small
      var freq2 = 2;
      var amp2 = 2  ;//10*Math.random();
      var phase2 = t * (0.3 + l * 0.6) + l * 5;
      var y = 8*( l + 1) + 
      amp1 * Math.sin(Math.PI/180* (freq1 * x + phase1)) +
      amp2 * Math.cos(Math.PI/180*(freq2 * x + phase2));
      
      vertex(x, y + 2*arr[Math.abs((x + l*3) % spikes)]);
    }
    endShape();
  }
  t += change;
  if(Math.abs(t) > 1000) {
      change = -1*change;
  }
  arr[Math.abs(Math.floor(Math.random()*spikes) % spikes)] = Math.random();
 
}
function windowResized() {
  cnv = resizeCanvas(windowWidth, hscale*windowHeight);
  numWaves = hscale*windowHeight / 10;
  points = windowWidth;
}