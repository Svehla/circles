import { distance } from './math'

// duplicated code!!!!!!!!!!
// duplicated code!!!!!!!!!!
// duplicated code!!!!!!!!!!
// duplicated code!!!!!!!!!!
// duplicated code!!!!!!!!!!
// duplicated code!!!!!!!!!!
// duplicated code!!!!!!!!!!
export const renderChart = (
  grid: { leftTop: Point; width: number; height: number },
  values: number[][],
  {
    sampleRate,
    xAxisScaleFactor,
    yAxisScaleFactor,
  }: { sampleRate: number; xAxisScaleFactor: number; yAxisScaleFactor: number }
) => {
  drawRect(grid.leftTop, grid.width, grid.height, {
    color: '#fff',
  })

  const yZeroCoords = { x: grid.leftTop.x, y: grid.leftTop.y + grid.height / 2 }

  // center 0 point
  drawLine(
    yZeroCoords,
    { x: grid.leftTop.x + grid.width, y: grid.leftTop.y + grid.height / 2 },
    { color: '#DDD' }
  )

  // show 1 sec delimiter
  const COUNT_OF_LINES_BETWEEN_SECS = 10
  Array.from({
    length: (Math.floor(grid.width / sampleRate) + 1) * 10,
  })
    .map((_, i) => (i * xAxisScaleFactor) / COUNT_OF_LINES_BETWEEN_SECS)
    .map((i, index) => {
      const isSec = index % COUNT_OF_LINES_BETWEEN_SECS === 0
      drawLine(
        {
          x: yZeroCoords.x + i * sampleRate,
          y: yZeroCoords.y - grid.height / 2,
        },
        {
          x: yZeroCoords.x + i * sampleRate,
          y: yZeroCoords.y + grid.height / 2,
        },
        { color: isSec ? 'red' : '#DDD', width: isSec ? 3 : 1 }
      )
    })

  values.forEach((points, valIndex) => {
    let [prevPoint, ...restPoints] = points
      .map(x => x * yAxisScaleFactor)
      // add relative position to the yZeroLine
      .map((v, i) => ({
        x: yZeroCoords.x + i * xAxisScaleFactor,
        y: yZeroCoords.y - v, // there is `-` sign because of display is mirror rotatable by Y axis
      }))

    restPoints.forEach(p => {
      drawLine(prevPoint, p, {
        color: valIndex === 0 ? 'blue' : '#BBB',
      })
      prevPoint = p
    })
  })
}

type Point = {
  x: number
  y: number
}

// --------------------------- canvas utils ---------------------------
// duplicated code!!!!!!!!!!
// duplicated code!!!!!!!!!!
// duplicated code!!!!!!!!!!
// duplicated code!!!!!!!!!!
// duplicated code!!!!!!!!!!
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

var c = document.getElementById('myCanvas3')!

const setCanvasSize = () => {
  // @ts-expect-error
  c.width = view.width
  // @ts-expect-error
  c.height = view.height
}

// @ts-expect-error
var ctx = c.getContext('2d')

const radius = 50
const DETAIL_COEFFICIENT = 50
const image1 = [
  // ...Array.from({ length: DETAIL_COEFFICIENT * Math.PI * 2 * radius }).map((_, i) => [
  //   Math.sin(i / DETAIL_COEFFICIENT) * radius,
  //   Math.cos(i / DETAIL_COEFFICIENT) * radius,
  // ]),
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
  // [0, 0],
  // [10, -200],
  // [20, -180],
  // [200, 100],
  // [-200, 100],
  // [0, 50],
  // [-110, 15],
  // [-0, 10],
  // [0, 0],
].map(([x, y]) => ({ x: x * 1.2 - 200, y: y * 1.2 - 180 }))

// console.log(image1)
// const RENDER_IMAGE_SPEED_PX_SEC = 100 // px/sec
// --- calculate points for image ---

const getSignalBetween2Points = (p1: Point, p2: Point) => {
  const xDiff = p2.x - p1.x
  const yDiff = p2.y - p1.y
  const dist = Math.floor(distance(p1, p2))

  return Array.from({ length: dist }).map((_, idx) => ({
    x: p1.x + (xDiff / dist) * idx,
    y: p1.y + (yDiff / dist) * idx,
  }))
}

const getLinearSignalFromPoints = (points: Point[]) => {
  /*signalSize*/
  const frequency = 1

  const [firstPoint, ...restPoints] = points

  // let prevPoint = firstPoint
  // const v = restPoints.map(p => {
  //   const dist = distance(prevPoint, p)
  //   // const ret = getSignalBetween2Points(prevPoint, p)
  //   prevPoint = p
  //   return dist
  //   // return ret
  // })

  let prevPoint = firstPoint
  const v = restPoints.map(p => {
    const ret = getSignalBetween2Points(prevPoint, p)
    prevPoint = p
    return ret
  })

  return v.flat()
  // return v.flat()
}

const initRenderUI = () => {
  setCanvasSize()
  clearCanvas()
  drawRect({ x: 0, y: 0 }, view.width, view.height, {
    color: '#000',
  })

  // TODO: uncomment
  const linearPoints = getLinearSignalFromPoints(image1)
  // const linearPoints = image1

  // filter to test density
  // .filter((_, i) => i % 5 === 0)

  /*
  const DENSITY_MULTIPLIER = 1 // generate metadata between points

  // make X times more points to lower density
  const x = linearPoints.flatMap((point, index) => {
    const prevPoint = linearPoints[index - 1]

    if (!prevPoint ) return []

    // const dist = distance(prevPoint, point)
    const xDiff = prevPoint.x - point.x
    const yDiff = prevPoint.y - point.y

    return [
      ...Array.from({ length: DENSITY_MULTIPLIER }).map((_, i) => ({
        x: prevPoint.x + (xDiff / DENSITY_MULTIPLIER) * i,
        y: prevPoint.y + (yDiff / DENSITY_MULTIPLIER) * i,
      })),
      point,
    ]
  })
*/

  const points = linearPoints // getLinearSignalFromPoints(image1)
    // shit code
    // shit code
    // shit code
    // make FT work by this shit code
    .slice(0, 2 ** 10)
    .map(p => ({ x: p.x, y: -p.y }))

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
    { color: 'green' }
  )

  // mega global object
  // @ts-expect-error
  window.kunda = points

  const xSignal = points.map(({ x }) => x)
  const ySignal = points.map(({ y }) => y)

  renderChart(
    {
      leftTop: {
        x: 10,
        y: 510,
      },
      width: xSignal.length,
      height: 400,
    },
    [xSignal, ySignal],
    {
      // this is int, not float!!!
      sampleRate: xSignal.length,
      xAxisScaleFactor: 1,
      yAxisScaleFactor: 0.5,
    }
  )
}

// TODO: should i invert axes???
// TODO: Add scale factors
const renderPoints = (
  grid: { leftTop: Point; width: number; height: number },
  points: Point[],
  { /*xAxisScaleFactor = 1, yAxisScaleFactor = 1,*/ color = 'white' } = {}
) => {
  drawRect(grid.leftTop, grid.width, grid.height, {
    color: 'white',
  })

  const centerPoint = {
    x: grid.leftTop.x + grid.width / 2,
    y: grid.leftTop.y + grid.height / 2,
  }
  // horizontal line
  drawLine(
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
  drawLine(
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
    // invert axis!!!
    .map(p => ({ x: p.x, y: -p.y }))

  pointsToRender
    // make user UI sure that we have analogue continuous signal
    .filter((_, i) => i % 10 === 0)
    .forEach(p => {
      drawCircle(
        {
          x: centerPoint.x + p.x,
          y: centerPoint.y + p.y,
        },
        2,
        { color }
      )
    })

  // red circle is the start of the image signal
  drawCircle(
    {
      x: centerPoint.x + pointsToRender[0].x,
      y: centerPoint.y + pointsToRender[0].y,
    },
    10,
    { color: 'red', width: 5 }
  )
  drawCircle(
    {
      x: centerPoint.x + pointsToRender[20].x,
      y: centerPoint.y + pointsToRender[20].y,
    },
    10,
    { color: 'red', width: 2 }
  )
}

initRenderUI()
