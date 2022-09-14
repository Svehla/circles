import { getCanvasDrawMethods } from './canvas'

type Point = {
  x: number
  y: number
}

// --------------------------- canvas utils ---------------------------

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

const draw = getCanvasDrawMethods(ctx, view.width)

let timeMs = Date.now()
let startTimeMs = Date.now()
// little abstraction to enable stop and continue the animation
let stopProgrammeTime = 0
const fps = 33

const normalizeIntoInterval = (val: number, max: number, min: number) => (val - min) / (max - min)

let endPoints = [] as Point[]

type SinFnDesc = {
  radius: number
  frequency: number
  phase: number
}

const drawFourierCircle = (time: number, startPoint: Point, meta: SinFnDesc) => {
  draw.circle(startPoint, meta.radius, { color: '#BBF' })

  const rotationsPerSecond = 1 / meta.frequency
  // draw rotating point on Line
  const percentageAngle = normalizeIntoInterval(
    time % (rotationsPerSecond * 1_000),
    rotationsPerSecond * 1_000,
    0
  )

  // const angleRad = meta.frequency * time + meta.phase + Math.PI / 2
  const angleRad = percentageAngle * (2 * Math.PI) + meta.phase + Math.PI / 2
  const endPoint = {
    // x sin or cos?
    x: startPoint.x + Math.cos(angleRad) * meta.radius,
    y: startPoint.y + Math.sin(angleRad) * meta.radius,
  }

  draw.line(startPoint, endPoint, { color: '#66F' })
  return endPoint
}

const renderFourierCircles = (time: number, startPoint: Point, fftCircles: SinFnDesc[]) => {
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
  fftCirclesX: SinFnDesc[],
  fftCirclesY: SinFnDesc[]
) => {
  // left circles
  const endPointY = renderFourierCircles(
    time,
    {
      x: view.width / 2 - 500,
      y: view.height / 2,
    },
    fftCirclesY
  )

  // top circles
  const endPointX = {
    x: view.width / 2,
    y: view.height / 2 - 400,
  }
  // renderFourierCircles(
  //   time,
  //   {
  //     x: view.width / 2,
  //     y: view.height / 2 - 400,
  //   },
  //   fftCirclesX
  // )

  const drawPoint = {
    x: endPointY.x + 500,
    y: endPointY.y,
  }

  endPoints = [drawPoint, ...endPoints]

  draw.line(endPointY, drawPoint, { color: '#555' })
  draw.line(endPointX, drawPoint, { color: '#555' })

  // keep just 40 end points
  endPoints = endPoints.reverse().slice(-500).reverse()
  // + 1 => depends on frameRate
  // endPoints = endPoints.map(i => ({ ...i, x: i.x + 3 }))

  // endPoints = endPoints.map((p, i) => ({ x: p.x - i, y: p.y }))

  endPoints.forEach((p, i) => {
    const prevPoint = endPoints[i - 1]
    // uncomment to show nice line
    const widthByTime = 4 // (endPoints.length - i) / 8
    draw.line(prevPoint || p, p, { color: 'red', width: widthByTime })
  })
}
// ------------------------------------------------------------

// ------------------------------------------------------------

// square wave
// amplitude

// const squareWaveFns = Array.from({ length: 10 })
//   .map((_, i) => ({
//     radius: 1 / (i * 2 + 1),
//     freq: i * 2 + 1,
//   }))
//   .map(({ freq, ...i }) => ({ ...i, frequency: freq }))

// const RADIUS_RESIZE = 100
const examples = {
  a: [
    {
      radius: 10,
      frequency: -1,
      phase: Math.PI / 2,
    },
    {
      radius: 10,
      frequency: 1,
      phase: Math.PI / 2,
    },
  ],
  b: [] as any,
}
// [...squareWaveFns].map(i => ({
//     ...i,
//     radius: i.radius * RADIUS_RESIZE,
//     frequency: -(i.frequency * 2),
//     phase: 0,
//     // phase: -Math.PI / 3,
//     // frequency: i.frequency / 3,
//   })),
// }

let runProgram = true

const renderCycleTick = () => {
  timeMs = Date.now() - startTimeMs // - stopProgrammeTime
  // console.log(timeMs)

  setTimeout(() => {
    if (!runProgram) {
      // stopProgrammeTime = Date.now() - timeMs
    } else {
      clearCanvas()
      draw.rect({ x: 0, y: 0 }, view.width, view.height, {
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
    e.preventDefault()
    e.stopPropagation()
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

initRenderUI()

// ---------------

export const setupLeftCirclesXD = (data: SinFnDesc[]) => {
  examples.b = data
  // examples.b = [
  //   { radius: 100, frequency: 0.25, phase: 0 },
  //   { radius: 50, frequency: 0.8, phase: 0 },
  // ]
  // data
}

export const setupTopCirclesXD = (data: SinFnDesc[]) => {
  examples.a = data
}

export const runCircles = () => {
  startTimeMs = Date.now() // - startTimeMs
  renderCycleTick()
}
