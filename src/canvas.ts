import { Angle } from './Angle'
import { distance } from './math'
import { mapWithPrevValue } from './utils'

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

var c = document.getElementById('myCanvas')!

const setCanvasSize = () => {
  // @ts-expect-error
  c.width = view.width
  // @ts-expect-error
  c.height = view.height
}

// @ts-expect-error
var ctx = c.getContext('2d')

let timeMs = 0
const startTimeMs = 0
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

  const angleRad = percentageAngle * (2 * Math.PI) + meta.touchPointAngle
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
  endPoints = endPoints.reverse().slice(-480).reverse()

  // endPoints = endPoints.map((p, i) => ({ x: p.x - i, y: p.y }))

  endPoints.forEach((p, i) => {
    const prevPoint = endPoints[i - 1]
    // uncomment to show nice line
    const widthByTime = 4 // (endPoints.length - i) / 8
    drawLine(prevPoint || p, p, { color: 'red', width: widthByTime })
  })
}
// ------------------------------------------------------------
const p = (x: number, y: number) => ({ x, y })

const image1 = [
  //
  p(100, 150),
  p(400, 200),
  p(300, 450),
  p(100, 450),
  p(200, 210),
]

const RENDER_IMAGE_SPEED_PX_SEC = 100 // px/sec

const getSignalBetween2Points = (p1: Point, p2: Point) => {
  const xDiff = p2.x - p1.x
  const yDiff = p2.y - p1.y
  // const angle = Angle.getAngleBetweenPoints(p1, p2)
  const dist = Math.floor(distance(p1, p2))

  return Array.from({ length: dist }).map((_, idx) => ({
    x: p1.x + (xDiff / dist) * idx,
    y: p1.y + (yDiff / dist) * idx,
  }))
}

const getSignalFromPoints = (points: Point[]) => {
  const [firstPoint, ...restPoints] = points

  let prevPoint = firstPoint
  const v = restPoints.map(p => {
    const ret = getSignalBetween2Points(prevPoint, p)
    prevPoint = p
    return ret
  })
  return v.flat()
}
const renderImageAndExtract = (ms: number) => {
  const [firstPoint, ...restPoints] = image1
  let prevPoint = firstPoint

  // red lines
  restPoints.forEach(p => {
    drawLine(prevPoint, p, { color: 'red' })
    prevPoint = p
  })

  const signal = getSignalFromPoints(image1)

  signal.forEach(p => {
    drawPoint({ x: p.x + 300, y: p.y }, { color: 'green', size: 10 })
  })

  console.log(signal.map(({ x }) => x))

  signal.forEach((p, index) => {
    drawPoint({ x: 100 + index, y: 400 + p.x }, { color: 'yellow', size: 10 })

    drawPoint({ x: 100 + index, y: 700 + p.y }, { color: 'blue', size: 10 })
  })
}

// ------------------------------------------------------------
const examples = {
  1: [
    { radius: 100, rotationPerSecond: 6, touchPointAngle: Math.PI / 2 },

    {
      radius: 100,
      rotationPerSecond: -6,
      touchPointAngle: Math.PI / 2,
    },

    { radius: 70, rotationPerSecond: 9, touchPointAngle: Math.PI / 2 },

    {
      radius: 70,
      rotationPerSecond: -9,
      touchPointAngle: Math.PI / 2,
    },
  ],

  2: [
    {
      radius: 100,
      rotationPerSecond: 4,
      touchPointAngle: 0,
    },
    {
      radius: 100,
      rotationPerSecond: -4,
      touchPointAngle: 0,
    },
    {
      radius: 30,
      rotationPerSecond: 9,
      touchPointAngle: 0,
    },
    {
      radius: 30,
      rotationPerSecond: -9,
      touchPointAngle: 0,
    },
    {
      radius: 10,
      rotationPerSecond: 10,
      touchPointAngle: 0,
    },
    {
      radius: 10,
      rotationPerSecond: -10,
      touchPointAngle: 0,
    },
  ],

  3: [
    {
      radius: 100,
      rotationPerSecond: 5,
      touchPointAngle: Math.PI / 2,
    },
    {
      radius: 100,
      rotationPerSecond: -5,
      touchPointAngle: Math.PI / 2,
    },
    {
      radius: 50,
      rotationPerSecond: 2,
      touchPointAngle: Math.PI / 2,
    },
    {
      radius: 50,
      rotationPerSecond: -2,
      touchPointAngle: Math.PI / 2,
    },
  ],
}
let runProgram = true

const renderCycleTick = () => {
  setTimeout(() => {
    if (!runProgram) {
      stopProgrammeTime = performance.now() - timeMs
    } else {
      clearCanvas()
      drawRect({ x: 0, y: 0 }, view.width, view.height, {
        color: 'black',
      })
      timeMs = performance.now() - stopProgrammeTime - startTimeMs

      // renderFourier2Circles(timeMs, examples['2'], examples['3'])
      renderImageAndExtract(timeMs)
    }

    // uncomment to step it
    // runProgram = false

    renderCycleTick()
  }, 1000 / fps)
}

const initRenderUI = () => {
  setCanvasSize()
  renderCycleTick()
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
  setCanvasSize()
  renderCycleTick()
})

window.onload = initRenderUI
initRenderUI

// ---------------

export {}
