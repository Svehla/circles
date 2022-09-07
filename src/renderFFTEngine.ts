type Point = {
  x: number
  y: number
}

// --------------------------- canvas utils ---------------------------
const drawLine = (point1: Point, point2: Point, { color = 'black', width = 2 } = {}) => {
  ctx.beginPath()
  ctx.moveTo(point1.x, point1.y)
  ctx.lineTo(point2.x, point2.y)
  ctx.lineWidth = width
  ctx.strokeStyle = color
  ctx.stroke()
}

const drawRect = (point: Point, width: number, height: number, { color = 'black' } = {}) => {
  ctx.beginPath()
  ctx.rect(point.x, point.y, width, height)
  ctx.fillStyle = color
  ctx.fill()
}

const drawPoint = (point: Point, { color = 'black', size = 2 } = {}) => {
  drawRect(point, size, size, { color })
  // const _size = size === 1 ? 2 : size
  // // if (size > 1) {
  // // ctx.fillStyle = color
  // ctx.rect(point.x, point.y, _size, _size)
  // ctx.strokeStyle = color
  // // ctx.fill()
  // ctx.stroke()
  // } else {
  //   drawLine(point, { x: point.x + size, y: point.y + size }, { color, width: 1 })
  // }
}

const drawCircle = (center: Point, radius: number, { color = 'black', width = 2 } = {}) => {
  ctx.beginPath()
  ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}

const view = {
  width: window.innerWidth,
  height: window.innerHeight,
}

const clearCanvas = () => ctx.clearRect(0, 0, view.width, view.height)

var c = document.getElementById('myCanvas2')!

const setCanvasSize = () => {
  // @ts-expect-error
  c.width = view.width
  // @ts-expect-error
  c.height = view.height
}

// @ts-expect-error
var ctx = c.getContext('2d')

let timeMs = Date.now()
let startTimeMs = Date.now()
// little abstraction to enable stop and continue the animation
let stopProgrammeTime = 0
const fps = 33

const normalizeIntoInterval = (val: number, max: number, min: number) => (val - min) / (max - min)

let endPoints = [] as Point[]

type FourierCircle = {
  radius: number
  rotationPerSecond: number
  touchPointAngle: number
}

const drawFourierCircle = (time: number, startPoint: Point, meta: FourierCircle) => {
  drawCircle(startPoint, meta.radius, { color: '#BBF' })

  // draw rotating point on Line
  const percentageAngle = normalizeIntoInterval(
    time % (meta.rotationPerSecond * 1_000),
    meta.rotationPerSecond * 1_000,
    0
  )

  // minus sign to clockwise rotation
  const angleRad = percentageAngle * (2 * Math.PI) + meta.touchPointAngle + Math.PI / 2
  const endPoint = {
    x: startPoint.x + Math.sin(angleRad) * meta.radius,
    y: startPoint.y + Math.cos(angleRad) * meta.radius,
  }

  drawLine(startPoint, endPoint, { color: '#66F' })
  return endPoint
}

const renderFourierCircles = (time: number, startPoint: Point, fftCircles: FourierCircle[]) => {
  const [firstCircle, ...restCircles] = fftCircles
  let lastEndpoint = drawFourierCircle(time, startPoint, firstCircle)

  restCircles.forEach(c => {
    const newEndPoint = drawFourierCircle(time, lastEndpoint, c)
    lastEndpoint = newEndPoint
  })

  return lastEndpoint
}

const renderFourier2Circles = (
  time: number,
  fftCirclesX: FourierCircle[],
  fftCirclesY: FourierCircle[]
) => {
  const endPointY = renderFourierCircles(
    time,
    {
      x: view.width / 2 - 500,
      y: view.height / 2,
    },
    fftCirclesY
  )

  const endPointX = renderFourierCircles(
    time,
    {
      x: view.width / 2,
      y: view.height / 2 - 400,
    },
    fftCirclesX
  )

  const drawPoint = {
    x: endPointX.x,
    y: endPointY.y,
  }

  endPoints = [drawPoint, ...endPoints]

  drawLine(endPointY, drawPoint, { color: '#555' })
  drawLine(endPointX, drawPoint, { color: '#555' })

  // keep just 40 end points
  endPoints = endPoints.reverse().slice(-1200).reverse()
  // + 1 => depends on frameRate
  endPoints = endPoints.map(i => ({ ...i, x: i.x + 3 }))

  // endPoints = endPoints.map((p, i) => ({ x: p.x - i, y: p.y }))

  endPoints.forEach((p, i) => {
    const prevPoint = endPoints[i - 1]
    // uncomment to show nice line
    const widthByTime = 4 // (endPoints.length - i) / 8
    drawLine(prevPoint || p, p, { color: 'red', width: widthByTime })
  })
}
// ------------------------------------------------------------

// ------------------------------------------------------------

// square wave
// amplitude

const fourierTransformData = Array.from({ length: 10 })
  .map((_, i) => ({
    radius: 1 / (i * 2 + 1),
    freq: i * 2 + 1,
  }))
  .map(i => ({ ...i, rotationPerSecond: 1 / i.freq }))

const RADIUS_RESIZE = 100
const examples = {
  a: [
    {
      radius: 10,
      rotationPerSecond: -1,
      touchPointAngle: Math.PI / 2,
    },
    {
      radius: 10,
      rotationPerSecond: 1,
      touchPointAngle: Math.PI / 2,
    },
  ],
  b: [
    ...fourierTransformData,
    // {
    //   radius: 0.67201625231031,
    //   rotationPerSecond: 1.024,
    //   touchPointAngle: 0,
    // },
    // {
    //   radius: 0.6667146789544217,
    //   rotationPerSecond: 1.1377777777777778,
    //   touchPointAngle: 0,
    // },
    // {
    //   radius: 0.22667382195124688,
    //   rotationPerSecond: 0.3303225806451613,
    //   touchPointAngle: 0,
    // },
    // {
    //   radius: 0.20723312387496987,
    //   rotationPerSecond: 0.9309090909090909,
    //   touchPointAngle: 0,
    // },
    // {
    //   radius: 0.19694730833188054,
    //   rotationPerSecond: 0.3413333333333333,
    //   touchPointAngle: 0,
    // },
    // {
    //   radius: 0.14814951567985596,
    //   rotationPerSecond: 0.2048,
    //   touchPointAngle: 0,
    // },
    // {
    //   radius: 0.14414789446265455,
    //   rotationPerSecond: 1.28,
    //   touchPointAngle: 0,
    // },
    // {
    //   radius: 0.11702512194550076,
    //   rotationPerSecond: 0.2007843137254902,
    //   touchPointAngle: 0,
    // },
  ].map(i => ({
    ...i,
    radius: i.radius * RADIUS_RESIZE,
    rotationPerSecond: -(i.rotationPerSecond * 2),
    touchPointAngle: 0,
    // touchPointAngle: -Math.PI / 3,
    // rotationPerSecond: i.rotationPerSecond / 3,
  })),
}

let runProgram = true

const renderCycleTick = () => {
  timeMs = Date.now() - startTimeMs // - stopProgrammeTime
  // console.log(timeMs)

  setTimeout(() => {
    if (!runProgram) {
      // stopProgrammeTime = Date.now() - timeMs
    } else {
      clearCanvas()
      drawRect({ x: 0, y: 0 }, view.width, view.height, {
        color: 'black',
      })

      // console.log(timeMs)
      renderFourier2Circles(timeMs, examples.a, examples.b)
      // runProgram = false
    }

    // uncomment to step it
    // runProgram = false

    renderCycleTick()
  }, 1000 / fps)
}

const initRenderUI = () => {
  startTimeMs = Date.now()
  setCanvasSize()
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    runProgram = !runProgram
  }
})

// TODO: resize is not working yet
window.addEventListener('resize', e => {
  view.width = window.innerWidth
  view.height = window.innerHeight
  // initRenderUI()
  setCanvasSize()
  // renderCycleTick()
})

// window.onload = initRenderUI
initRenderUI()

// ---------------

export const xd = (data: any[]) => {
  console.log(data)
  examples.b = data.map(i => ({
    ...i,
    radius: i.radius * RADIUS_RESIZE,
    rotationPerSecond: i.rotationPerSecond * 10, // * 20, //  / 8,
    touchPointAngle: 0,
  }))
  startTimeMs = Date.now() // - startTimeMs
  renderCycleTick()
}
