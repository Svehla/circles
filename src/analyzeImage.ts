import { Point, getCanvasDrawMethods } from './canvas'
import { distance, normalizeIntoMinus1to1 } from './math'
import { getSinusFunctionSamples, getSumOfFns, render2DSignal } from './analyzeSignal'

// --------------------------- canvas utils ---------------------------

const view = {
  width: 2000, // window.innerWidth,
  height: 1000, // window.innerHeight,
}

const clearCanvas = () => ctx.clearRect(0, 0, view.width, view.height)

var c = document.getElementById('myCanvas3')!

const setCanvasSize = () => {
  // @ts-expect-error
  c.width = view.width
  // @ts-expect-error
  c.height = view.height
}

// @ts-expect-error
var ctx = c.getContext('2d')

const draw = getCanvasDrawMethods(ctx, view.width)

// TODO: add numeric integration
const DETAIL_COEFFICIENT = 20
const radius = 50
// image is drawn in -1 to 1 coordination square
const image1 = [
  // triangles

  // square
  // [0, 0],
  // [DETAIL_COEFFICIENT, 0],
  // [DETAIL_COEFFICIENT, DETAIL_COEFFICIENT],
  // [0, DETAIL_COEFFICIENT],
  // // [0, DETAIL_COEFFICIENT],
  // // [DETAIL_COEFFICIENT, DETAIL_COEFFICIENT],
  // // [DETAIL_COEFFICIENT, 0],
  // [0, 0],

  // circle
  // ...Array.from({ length: DETAIL_COEFFICIENT * Math.PI * 2 * radius }).map((_, i) => [
  //   Math.sin(i / DETAIL_COEFFICIENT) * radius,
  //   Math.cos(i / DETAIL_COEFFICIENT) * radius,
  // ]),

  // note
  ...[
    [193, 47],
    [140, 204],
    [123, 193],
    [99, 189],
    [74, 196],
    [58, 213],
    [49, 237],
    [52, 261],
    [65, 279],
    [86, 292],
    [113, 295],
    [135, 282],
    [152, 258],
    [201, 95],
    [212, 127],
    [218, 150],
    [213, 168],
    [201, 185],
    [192, 200],
    [203, 214],
    [219, 205],
    [233, 191],
    [242, 170],
    [244, 149],
    [242, 131],
    [233, 111],
    [193, 47],
  ].map(([x, y]) => [x / 2, y / 2]),
].map(([x, y]) => ({ x, y }))

const getSignalBetween2Points = (p1: Point, p2: Point, step = 1) => {
  const dist = distance(p1, p2)

  // -1 because we don't want to have first point
  const stepsBetweenPoints = Math.ceil(dist / step) - 1
  const relStepSize = dist / step

  const xDiff = p2.x - p1.x
  const yDiff = p2.y - p1.y

  return [
    p1,
    ...Array.from({ length: stepsBetweenPoints }).map((_, idx) => ({
      x: p1.x + (xDiff / relStepSize) * (idx + 1),
      y: p1.y + (yDiff / relStepSize) * (idx + 1),
    })),
    p2,
  ]
}

// const pp = (d: any) => console.log(JSON.stringify(d, null, 2))

// pp(getSignalBetween2Points({ x: 0, y: 0 }, { x: 1, y: 0 }, 0.15))

export const mapWithNextValue = <T, U>(
  fn: (item: T, next: T, index: number) => U,
  arr: T[]
): U[] => {
  const withoutLastItem = arr.slice(0, -1)

  return withoutLastItem.reduce(
    (prev, current, index) => [...prev, fn(current, arr[index + 1], index)],
    //
    [] as U[]
  )
}
// console.log(mapWithNextValue((a, b) => a + b, ['a', 'b', 'c', '3']))

const getPointsPerimeter = (points: Point[]) =>
  mapWithNextValue((current, next) => distance(current, next), points).reduce((p, c) => p + c, 0)

const getLinearSignalFromPoints = (points: Point[], step = 1) =>
  mapWithNextValue((current, next) => getSignalBetween2Points(current, next, step), points).flat()

const normalizeSignalIntoN1toP1 = (signal: number[]) => {
  const min = Math.min(...signal)
  const max = Math.max(...signal)
  return signal.map(v => normalizeIntoMinus1to1(v, min, max))
}

const normalize2DSignalIntoN1toP1 = (signal: Point[]) => {
  const xSignal = signal.map(({ x }) => x)
  const ySignal = signal.map(({ y }) => y)

  const normalizedX = normalizeSignalIntoN1toP1(xSignal)
  const normalizedY = normalizeSignalIntoN1toP1(ySignal)

  return normalizedX.map((x, i) => ({ x, y: normalizedY[i] }))
}

const initRenderUI = () => {
  setCanvasSize()
  clearCanvas()
  draw.rect({ x: 0, y: 0 }, view.width, view.height, {
    color: '#000',
  })

  const signalPeriodSize = 2 ** 10
  const shapePerimeter = getPointsPerimeter(image1)
  const step = shapePerimeter / signalPeriodSize

  const linearPoints = getLinearSignalFromPoints(image1, step)
  // TODO: normalization is not working properly because it change the position of the shape object into the "center"
  // is that okey?
  const normalizedLinearPoints = normalize2DSignalIntoN1toP1(linearPoints)

  // console.log(normalizedLinearPoints)

  // something is broken (maybe float rounds) => make sure that signal is power of 2
  const points = normalizedLinearPoints
    .slice(0, signalPeriodSize)
    // invert axis
    .map(p => ({ x: p.x, y: p.y }))

  const IMAGE_ZOOM = 100

  renderPoints(
    {
      leftTop: {
        x: 10,
        y: 10,
      },
      width: 500,
      height: 500,
    },
    // revert axis
    points,
    { color: 'green', IMAGE_ZOOM }
  )

  // TODO: find x === 0 and set it as the start of the signal
  // TODO: center signal into the average mass = 0

  // mega global object
  // signal should be
  // - between -1 to 1
  // - 1 period without repetition
  // - must be power of two // length should be 2 ** X
  // TODO call render charts

  /*
  const xSignal = getSumOfFns([
    getSinusFunctionSamples({
      size: signalPeriodSize,
      sampleRate: signalPeriodSize,
      frequency: 2,
      amplitude: 1,
    }),
    getSinusFunctionSamples({
      size: signalPeriodSize,
      sampleRate: signalPeriodSize,
      frequency: 4,
      amplitude: 0.5,
    }),
  ])

  const ySignal = getSumOfFns([
    getSinusFunctionSamples({
      size: signalPeriodSize,
      sampleRate: signalPeriodSize,
      frequency: 5,
      amplitude: 0.5,
    }),
    getSinusFunctionSamples({
      size: signalPeriodSize,
      sampleRate: signalPeriodSize,
      frequency: 4,
      amplitude: 0.5,
    }),
  ])
  //points
  const kunda = xSignal.map((x, i) => ({ x, y: ySignal[i] }))
  */

  const xSignal = points.map(({ x }) => x)
  const ySignal = points.map(({ y }) => y)

  // const xSignal = shiftFnPeriod(
  //   points.map(({ x }) => x),
  //   0
  // )
  // const ySignal = shiftFnPeriod(
  //   points.map(({ y }) => y),
  //   0
  // )

  const pointsFromSignal = xSignal.map((x, i) => ({ x, y: ySignal[i] }))

  // render2DSignal(pointsFromSignal)
  // show chart with signals

  draw.chart(
    {
      leftTop: {
        x: 10,
        y: 510,
      },
      width: view.width,
      height: 400,
    },
    [xSignal, ySignal],
    {
      // sampleRate is int!!!! not float!!!
      sampleRate: points.length,
      xAxisScaleFactor: 1,
    }
  )
}

const shiftFnPeriod = (signal: number[], shift: number) => [
  ...signal.slice(shift, Infinity),
  ...signal.slice(0, shift),
]

// TODO: should i invert axes???
// TODO: Add scale factors
const renderPoints = (
  grid: { leftTop: Point; width: number; height: number },
  points: Point[],
  { IMAGE_ZOOM = 1, color = 'white' } = {}
) => {
  draw.rect(grid.leftTop, grid.width, grid.height, {
    color: 'white',
  })

  const centerPoint = {
    x: grid.leftTop.x + grid.width / 2,
    y: grid.leftTop.y + grid.height / 2,
  }
  // horizontal line
  draw.line(
    {
      x: grid.leftTop.x,
      y: grid.leftTop.y + grid.height / 2,
    },
    {
      x: grid.leftTop.x + grid.width,
      y: grid.leftTop.y + grid.height / 2,
    },
    { color: '#AAA' }
  )

  // vertical line
  draw.line(
    {
      x: grid.leftTop.x + grid.width / 2,
      y: grid.leftTop.y,
    },
    {
      x: grid.leftTop.x + grid.width / 2,
      y: grid.leftTop.y + grid.height,
    },
    { color: '#AAA' }
  )

  const pointsToRender = points
    .map(p => ({
      // + IMAGE_ZOOM
      x: p.x,
      y: p.y,
    }))
    // invert axis!!!
    .map(p => ({ x: p.x, y: -p.y }))

  pointsToRender
    // make user UI sure that we have analogue continuous signal
    .filter((_, i) => i % 7 === 0)
    .forEach(p => {
      draw.circle(
        {
          x: centerPoint.x + p.x * IMAGE_ZOOM,
          y: centerPoint.y + p.y * IMAGE_ZOOM,
        },
        2,
        { color }
      )
    })

  // red circle is the start of the image signal
  const SIGN_SIZE = 3
  Array.from({ length: SIGN_SIZE }).map((_, index) => {
    draw.circle(
      {
        x: centerPoint.x + pointsToRender[index * 10].x,
        y: centerPoint.y + pointsToRender[index * 10].y,
      },
      5,
      { color: 'red', width: 2 }
    )
  })
  // draw.circle(
  //   {
  //     x: centerPoint.x + pointsToRender[20].x,
  //     y: centerPoint.y + pointsToRender[20].y,
  //   },
  //   10,
  //   { color: 'red', width: 2 }
  // )
}

initRenderUI()
