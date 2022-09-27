// Coding Challenge 130.3: Drawing with Fourier Transform and Epicycles
// Daniel Shiffman
// https://thecodingtrain.com/CodingChallenges/130.1-fourier-transform-drawing.html
// https://thecodingtrain.com/CodingChallenges/130.2-fourier-transform-drawing.html
// https://thecodingtrain.com/CodingChallenges/130.3-fourier-transform-drawing.html
// https://youtu.be/7_vKzcgpfvU

const USER = 0
const FOURIER = 1

let x = []
let fourierX
window.time = 0
window.drawLine = true
window.stop = false
let path = []
let drawing = []
let state = -1

// defaultCanvas0

window.onmousedown = function (e) {
  // console.log('ahoj', e.which)
  // left click
  // state = FOURIER

  if (e.which === 1) {
    state = USER
    drawing = []
    x = []
    time = 0
    path = []
  }
}

function mousePressed(e) {
  // state = USER
  // drawing = []
  // x = []
  // time = 0
  // path = []
}

function mouseReleased() {
  state = FOURIER
  const skip = 1
  drawing = window.finalPoints
  console.log(drawing.map(({ x, y }) => ({ x, y })))

  for (let i = 0; i < drawing.length; i += skip) {
    x.push(new Complex(drawing[i].x, drawing[i].y))
  }
  fourierX = dft(x)

  fourierX.sort((a, b) => b.amp - a.amp)
}

function setup() {
  // 4K
  // 2,160 pixels tall and 3,840
  // ratio 91/61
  const height = 3840
  const ratio = 61 / 91

  // createCanvas(height * ratio, height)
  // createCanvas(height * ratio, height)
  createCanvas(windowWidth, windowHeight)

  mouseReleased()
  background(0)
  fill(255)
  textAlign(CENTER)
  textSize(64)
  text('Draw Something!', width / 2, height / 2)
}

const MAX_CIRCLES_COUNT = Infinity
function epicycles(x, y, rotation, fourier) {
  for (let i = 0; i < Math.min(fourier.length, MAX_CIRCLES_COUNT); i++) {
    let prevx = x
    let prevy = y
    let freq = fourier[i].freq
    let radius = fourier[i].amp
    let phase = fourier[i].phase
    x += radius * cos(freq * time + phase + rotation)
    y += radius * sin(freq * time + phase + rotation)

    // stroke(255, 100)
    if (Math.abs(freq) === freq) {
      stroke(255, 0, 255)
    } else {
      stroke(100, 0, 100)
    }
    noFill()
    // console.log(freq)
    // const width = (1 / Math.abs(freq)) * 30
    const width = Math.max(4, (1 / Math.abs(freq)) * 30)
    strokeWeight(width)
    ellipse(prevx, prevy, radius * 2)
    // stroke(0, 0, 255)
    ellipse(x, y, 2)
    stroke(255)
    // line(prevx, prevy, x, y);
  }
  return createVector(x, y)
}

function draw() {
  if (state === USER) {
    background(0)
    let point = createVector(mouseX - width / 2, mouseY - height / 2)
    drawing.push(point)
    stroke(255)
    noFill()
    beginShape()
    for (let v of drawing) {
      vertex(v.x + width / 2, v.y + height / 2)
    }
    endShape()
  } else if (state === FOURIER) {
    background(0)
    let v = epicycles(width / 2, height / 2, 0, fourierX)
    path.unshift(v)
    beginShape()
    noFill()
    strokeWeight(4)
    stroke(255, 50, 0)
    for (let i = 0; i < path.length; i++) {
      if (window.drawLine) {
        vertex(path[i].x, path[i].y)
      }
    }
    endShape()

    const dt = TWO_PI / fourierX.length
    const SLOW = 1
    if (window.stop === true) return

    time += dt * SLOW

    if (time > TWO_PI) {
      time = 0
      path = []
    }
  }
}

window.s = () => (window.stop = true)
window.p = () => (window.stop = false)
