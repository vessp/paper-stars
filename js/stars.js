
// Adapted from Flocking Processing example by Daniel Schiffman:
// http://processing.org/learning/topics/flocking.html

var Star = Base.extend({
  initialize: function(position, maxSpeed, maxForce) {
    var strength = Math.random() * 0.5;
    this.acceleration = new Point();
    
    this.vector = view.center.clone() - position.clone()
    this.vector.length = 1
    // new Point(Math.random() * 0.3 + 0.35, Math.random() * 0.2 - 2);


    this.position = position.clone();
    this.radius = 5;
    this.maxSpeed = maxSpeed + strength;
    this.maxForce = maxForce + strength;
    this.amount = strength * 10 + 10;
    this.count = 0;
    this.birthInstant = Date.now()
    this.lifetime = 10000
    this.isAlive = true
    this.lifeState = 0 //0,1,2,3

    this.r = parseInt(Math.random()*255)
    this.g = parseInt(Math.random()*255)
    this.b = parseInt(Math.random()*255)
    this.createItems();

  },

  run: function(stars, holes) {
    if(!this.isAlive)
      return

    this.lastLoc = this.position.clone();
    if (!groupTogether) {
      // this.flock(stars);
      // this.gravitate(stars, hole)
    } else {
      this.align(stars);
    }
    this.borders();
    this.update();
    // this.calculateTail();
    this.moveHead();

    this.isAlive = Date.now() - this.birthInstant <= this.lifetime

    if(!this.isAlive) {
      this.head.remove()
    }

    var mouseDistance = null
    if(mouseHole)
      mouseDistance = (mouseHole.position - this.position).length

    if(mouseDistance != null && mouseDistance < 300) {
      var ratio = (300-mouseDistance)/300
      var r = this.r + (255-this.r)*ratio
      var g = this.g + (255-this.g)*ratio
      var b = this.b + (255-this.b)*ratio
      this.head.fillColor = 'rgb(' + r + ',' + g + ',' + b + ')'
      this.head.shadowBlur = 10
    }
    else {
      this.head.fillColor = 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')'
      this.head.shadowBlur = 0
    }
    

    return this.isAlive
  },

  // calculateTail: function() {
  //   var segments = this.path.segments,
  //     shortSegments = this.shortPath.segments;
  //   var speed = this.vector.length;
  //   var pieceLength = 5 + speed / 3;
  //   var point = this.position;
  //   segments[0].point = shortSegments[0].point = point;
  //   // Chain goes the other way than the movement
  //   var lastVector = -this.vector;
  //   for (var i = 1; i < this.amount; i++) {
  //     var vector = segments[i].point - point;
  //     this.count += speed * 10;
  //     var wave = Math.sin((this.count + i * 3) / 300);
  //     var sway = lastVector.rotate(90).normalize(wave);
  //     point += lastVector.normalize(pieceLength) + sway;
  //     segments[i].point = point;
  //     if (i < 3)
  //       shortSegments[i].point = point;
  //     lastVector = vector;
  //   }
  //   this.path.smooth();
  // },

  createItems: function() {
    this.head = new Shape.Ellipse({
      center: [0, 0],
      size: new Point(this.radius),
      fillColor: 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')',
      shadowColor: 'white',
      shadowBlur: 0
    });

    // this.path = new Path({
    //   strokeColor: 'red',
    //   strokeWidth: 2,
    //   strokeCap: 'round'
    // });
    // for (var i = 0; i < this.amount; i++)
    //   this.path.add(new Point());

    // this.shortPath = new Path({
    //   strokeColor: 'yellow',
    //   strokeWidth: 4,
    //   strokeCap: 'round'
    // });
    // for (var i = 0; i < Math.min(3, this.amount); i++)
    //   this.shortPath.add(new Point());
  },

  moveHead: function() {
    this.head.position = this.position;
    this.head.rotation = this.vector.angle;
  },

  gravitate: function(stars, hole) {
    var holeDisplacement = hole.position - this.position
    var pullMagnitude = hole.intensity / Math.pow(holeDisplacement.length, 2)
    
    var pullVector = holeDisplacement.clone()
    pullVector.length = pullMagnitude

    // console.log(distanceToHole)

    this.acceleration += pullVector//new Point(0.0, 0.1);
  },

  // We accumulate a new acceleration each time based on three rules
  flock: function(boids) {
    var separation = this.separate(boids) * 3;
    var alignment = this.align(boids);
    var cohesion = this.cohesion(boids);
    this.acceleration += separation + alignment + cohesion;
  },

  update: function() {
    // Update velocity
    this.vector += this.acceleration;
    // Limit speed (vector#limit?)
    this.vector.length = Math.min(this.maxSpeed, this.vector.length);
    this.position += this.vector;
    // Reset acceleration to 0 each cycle
    this.acceleration = new Point();
  },

  seek: function(target) {
    this.acceleration += this.steer(target, false);
  },

  arrive: function(target) {
    this.acceleration += this.steer(target, true);
  },

  borders: function() {
    var vector = new Point();
    var position = this.position;
    var radius = this.radius;
    var size = view.size;
    // if (position.x < -radius) vector.x = size.width + radius;
    // if (position.y < -radius) vector.y = size.height + radius;
    // if (position.x > size.width + radius) vector.x = -size.width -radius;
    // if (position.y > size.height + radius) vector.y = -size.height -radius;
    // if (!vector.isZero()) {
    //   this.position += vector;
    //   // var segments = this.path.segments;
    //   // for (var i = 0; i < this.amount; i++) {
    //   //   segments[i].point += vector;
    //   // }
    // }

    if(position.x - radius < 0) position.x = radius
    if(position.x + radius > view.size.width) position.x = view.size.width - radius
    if(position.y - radius < 0) position.y = radius
    if(position.y + radius > view.size.height) position.y = view.size.height - radius

  },

  // A method that calculates a steering vector towards a target
  // Takes a second argument, if true, it slows down as it approaches
  // the target
  steer: function(target, slowdown) {
    var steer,
      desired = target - this.position;
    var distance = desired.length;
    // Two options for desired vector magnitude
    // (1 -- based on distance, 2 -- maxSpeed)
    if (slowdown && distance < 100) {
      // This damping is somewhat arbitrary:
      desired.length = this.maxSpeed * (distance / 100);
    } else {
      desired.length = this.maxSpeed;
    }
    steer = desired - this.vector;
    steer.length = Math.min(this.maxForce, steer.length);
    return steer;
  },

  separate: function(boids) {
    var desiredSeperation = 60;
    var steer = new Point();
    var count = 0;
    // For every boid in the system, check if it's too close
    for (var i = 0, l = boids.length; i < l; i++) {
      var other = boids[i];
      var vector = this.position - other.position;
      var distance = vector.length;
      if (distance > 0 && distance < desiredSeperation) {
        // Calculate vector pointing away from neighbor
        steer += vector.normalize(1 / distance);
        count++;
      }
    }
    // Average -- divide by how many
    if (count > 0)
      steer /= count;
    if (!steer.isZero()) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.length = this.maxSpeed;
      steer -= this.vector;
      steer.length = Math.min(steer.length, this.maxForce);
    }
    return steer;
  },

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  align: function(boids) {
    var neighborDist = 25;
    var steer = new Point();
    var count = 0;
    for (var i = 0, l = boids.length; i < l; i++) {
      var other = boids[i];
      var distance = this.position.getDistance(other.position);
      if (distance > 0 && distance < neighborDist) {
        steer += other.vector;
        count++;
      }
    }

    if (count > 0)
      steer /= count;
    if (!steer.isZero()) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.length = this.maxSpeed;
      steer -= this.vector;
      steer.length = Math.min(steer.length, this.maxForce);
    }
    return steer;
  },

  // Cohesion
  // For the average location (i.e. center) of all nearby boids,
  // calculate steering vector towards that location
  cohesion: function(boids) {
    var neighborDist = 100;
    var sum = new Point();
    var count = 0;
    for (var i = 0, l = boids.length; i < l; i++) {
      var other = boids[i];
      var distance = this.position.getDistance(other.position);
      if (distance > 0 && distance < neighborDist) {
        sum += other.position; // Add location
        count++;
      }
    }
    if (count > 0) {
      sum /= count;
      // Steer towards the location
      return this.steer(sum, false);
    }
    return sum;
  },

  destroy: function() {
    this.head.remove()
    this.isAlive = false
    // stars.splice(stars.indexOf(this), 1)
  }


});

var Hole = Base.extend({

  initialize: function(position, immensity, doDraw) {
    this.position = position
    this.immensity = immensity
    this.size = Math.random()*10+20
    this.dSize = Math.random()*20+10

    if(doDraw)
      this.shape = new Shape.Ellipse({
        center: this.position.clone(),
        size: [30, 30],
        fillColor: 'rgb(0,0,0)',
        shadowColor: 'rgb(255,255,255)',
        shadowBlur: 20
      })

    this.cycle = Math.random()
    this.dCycle = 0.01
  },

  run: function(stars, holes) {
    if(this.cycle >= 1)
      this.dCycle = -0.01
    else if(this.cycle <= 0)
      this.dCycle = 0.01
    this.cycle += this.dCycle

    for(var i=0; i<stars.length; i++)
      this.influence(stars[i])

    if(this.shape) {
      this.shape.size = new Point(this.size+this.cycle*this.dSize)
      this.shape.shadowColor = 'rgb(' + 255 + ',' + 255*this.cycle + ',' + 255*this.cycle + ')'
      this.shape.shadowBlur = this.cycle * 30 + 30
    }
  },

  influence: function(star) {
    var displacement = this.position - star.position
    var forceMagnitude = (this.cycle * 2*this.immensity + 0.5*this.immensity) / Math.pow(displacement.length, 2)
    
    var pullVector = displacement.clone()
    pullVector.length = influenceSign*forceMagnitude

    // console.log(this.position)
    // console.log(influenceSign)
    star.acceleration += pullVector
  },

})

var Field = Base.extend({

  initialize: function(startPoint, endPoint) {
    this.edit(startPoint, endPoint)
    this.cycle = Math.random()
    this.dCycle = 0.01
  },

  edit: function(startPoint, endPoint) {
    this.startPoint = startPoint
    this.endPoint = endPoint

    // var perpVector = new Point(this.startPoint.y, this.startPoint.x)
    // perpVector.length = 10
    // var fromPoint = this.startPoint + perpVector
    // var toPoint = this.endPoint + perpVector*-1

    if(this.shape)
      this.shape.remove()
    this.shape = new Shape.Rectangle({
        center: this.startPoint + (this.endPoint - this.startPoint) * 0.5,
        size: [(endPoint-startPoint).length, 30],
        // from: fromPoint,
        // to: toPoint,
        rotation: (endPoint - startPoint).angle,
        // strokeColor: 'white',
        fillColor: new Color(0,0,1, 0.7),
    });
  },

  run: function(stars, holes) {
    if(this.cycle >= 1)
      this.dCycle = -0.01
    else if(this.cycle <= 0)
      this.dCycle = 0.01
    this.cycle += this.dCycle

    for(var i=0; i<stars.length; i++)
      this.influence(stars[i])

    // if(this.shape) {
    //   this.shape.size = new Point(this.size+this.cycle*this.dSize)
    //   this.shape.shadowColor = 'rgb(' + 255 + ',' + 255*this.cycle + ',' + 255*this.cycle + ')'
    //   this.shape.shadowBlur = this.cycle * 30 + 30
    // }
  },

  influence: function(star) {
    if(this.shape.contains(star.position)) {
      var fieldForce = this.endPoint - this.startPoint
      fieldForce.length = 0.03
      star.acceleration += fieldForce
    }
  },
})

var Pit = Hole.extend({


  // influence: function(star) {
  //   super.influence(star)
  // },

})

var Goal = Base.extend({

  initialize: function(center, radius) {
    this.position = center
    this.radius = radius

    this.shape = new Shape.Ellipse({
      center: center.clone(),
      size: [radius*2, radius*2],
      fillColor: new Color(0.8, 0.2, 0.2, 0.7),
    })
  },

  run: function(stars, holes) {
    for(var i=0; i<stars.length; i++)
      this.influence(stars[i])
  },

  influence: function(star) {
    if(star.isAlive && this.shape.contains(star.position)) {
      star.head.remove()
      star.isAlive = false
      score++
      console.log(score)
    }
  }

})


//START----------------------------
var heartPath = new Path('M514.69629,624.70313c-7.10205,-27.02441 -17.2373,-52.39453 -30.40576,-76.10059c-13.17383,-23.70703 -38.65137,-60.52246 -76.44434,-110.45801c-27.71631,-36.64355 -44.78174,-59.89355 -51.19189,-69.74414c-10.5376,-16.02979 -18.15527,-30.74951 -22.84717,-44.14893c-4.69727,-13.39893 -7.04297,-26.97021 -7.04297,-40.71289c0,-25.42432 8.47119,-46.72559 25.42383,-63.90381c16.94775,-17.17871 37.90527,-25.76758 62.87354,-25.76758c25.19287,0 47.06885,8.93262 65.62158,26.79834c13.96826,13.28662 25.30615,33.10059 34.01318,59.4375c7.55859,-25.88037 18.20898,-45.57666 31.95215,-59.09424c19.00879,-18.32178 40.99707,-27.48535 65.96484,-27.48535c24.7373,0 45.69531,8.53564 62.87305,25.5957c17.17871,17.06592 25.76855,37.39551 25.76855,60.98389c0,20.61377 -5.04102,42.08691 -15.11719,64.41895c-10.08203,22.33203 -29.54687,51.59521 -58.40723,87.78271c-37.56738,47.41211 -64.93457,86.35352 -82.11328,116.8125c-13.51758,24.0498 -23.82422,49.24902 -30.9209,75.58594z');

var stars = []
var holes = []
var fields = []
var pits = []
var goals = []
var mouseHole = null
var groupTogether = false;
var influenceSign = 1

window.view = view
window.Point = Point
window.Shape = Shape
window.PointText = PointText

function randomSpawn(edgeSpacing) {
  return new Point(
    edgeSpacing + Math.random() * (view.size.width - edgeSpacing*2), 
    edgeSpacing + Math.random() * (view.size.height - edgeSpacing*2)
  )
}

start()
function start() {
  var immensity = 1000

  // holes.push( new Hole(
  //   new Point(view.size.width*(1/3), view.center.y), 
  //   immensity, true)
  // )
  // holes.push( new Hole(
  //   new Point(view.size.width*(2/3), view.center.y),
  //   immensity, true)
  // )
  // holes.push( new Hole(
  //   new Point(view.center.x, view.size.height*(26.5/100)),
  //   immensity, true)
  // )
  // holes.push( new Hole(
  //   new Point(view.center.x, view.size.height*(9/10)),
  //   immensity, true)
  // )

  pits.push( new Pit(
    // new Point(200, 400), 
    randomSpawn(50),
    800, true)
  )

  pits.push( new Pit(
    // new Point(view.size.width*(1/3), view.center.y),
    randomSpawn(50), 
    800, true)
  )

  goals.push(new Goal(
    // new Point(200, 200),
    randomSpawn(50),
    30
  ))

  // var goalShape = new Shape.Ellipse({
  //   center: goal.position.clone(),
  //   size: [goal.radius*2, goal.radius*2],
  //   fillColor: new Color(0.8, 0.2, 0.2, 0.7),
  //   // shadowColor: 'rgb(255,255,255)',
  //   // shadowBlur: 20
  // })

  // new PointText({
  //   point: new Point(300,300),
  //   text: 'asdf',
  //   color: '#ff0',
  //   size: 20,
  // })

  setInterval(sprayBottomLeft, 2000)
  sprayBottomLeft()

  setInterval(sprayTopRight, 2000)
  sprayTopRight()
  

  function sprayBottomLeft() {
    doSpray(40, view.size.height-40)
  }

  function sprayTopRight() {
    doSpray(view.size.width-40, 40)
  }
}

function doSpray(fireX, fireY) {
  var sprayHandle = setInterval(function() {
    fireStar(fireX, fireY)
  }, 50)
  setTimeout(function() {
    clearInterval(sprayHandle)
  }, 1000)
}

function fireStar(x, y) {
  var position = new Point(x, y)//Point.random() * view.size;
  stars.push(new Star(position, 10, 0.05));
}
//---------------------------------

var score = 0

function onFrame(event) {
  // console.log('numStars', stars.length)
  for(var i=0; i<holes.length; i++) {
    holes[i].run(stars, holes)
  }

  for(var i=0; i<fields.length; i++) {
    fields[i].run(stars, holes)
  }

  for(var i=0; i<pits.length; i++) {
    pits[i].run(stars, holes)
  }

  for(var i=0; i<goals.length; i++) {
    goals[i].run(stars, holes)
  }

  if(mouseHole)
    mouseHole.run(stars, holes)

  for (var i = 0, l = stars.length; i < l; i++) {
    if (groupTogether) {
      var length = ((i + event.count / 30) % l) / l * heartPath.length;
      var point = heartPath.getPointAt(length);
      if (point)
        stars[i].arrive(point);
    }
    var isAlive = stars[i].run(stars, holes);
    // console.log(isAlive)
    if(!isAlive) {
      stars.splice(i, 1)
      l--
      i--
    }
  }

  // hole.size +=1
}





// $(window).on('resize', onResize)
// Reposition the heart path whenever the window is resized:
function onResize(event) {
  heartPath.fitBounds(view.bounds);
  heartPath.scale(0.8);
}

function onKeyDown(event) {
  // console.log('key down')
  if (event.key == 'space') {
    var layer = project.activeLayer
    layer.selected = !layer.selected
    return false
  }
  else if (event.key == 'a') {
    groupTogether = !groupTogether
    return false
  }
  else if (event.key == 'r') {
    influenceSign *= -1
    return false
  }
}

var editingField = null

function onMouseDown(event) {
  console.log('onMouseDown', event.lastPoint)
  // mouseHole = new Hole(event.point, 800, false)
  editingField = new Field(event.point, event.point)
  fields.push(editingField)
}

function onMouseUp(event) {
  // console.log('onMouseUp', event)
  // mouseHole = null
  // new Field(event.downPoint, event.point)
  if(editingField)
    editingField.edit(event.downPoint, event.point)
  editingField = null
}

function onMouseMove(event) {
  if(editingField)
    editingField.edit(event.downPoint, event.point)
  // console.log(event.point)
  if(mouseHole)
    mouseHole = new Hole(event.point, 800, false)
}