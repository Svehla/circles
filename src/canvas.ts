export const getDrawLine =
  (ctx: any) =>
  (point1: Point, point2: Point, { color = 'black', width = 2 } = {}) => {
    ctx.beginPath()
    ctx.moveTo(point1.x, point1.y)
    ctx.lineTo(point2.x, point2.y)
    ctx.lineWidth = width
    ctx.strokeStyle = color
    ctx.stroke()
  }

const getDrawRect =
  (ctx: any) =>
  (point: Point, width: number, height: number, { color = 'black' } = {}) => {
    ctx.beginPath()
    ctx.rect(point.x, point.y, width, height)
    ctx.fillStyle = color
    ctx.fill()
  }

const getDrawCircle =
  (ctx: any) =>
  (center: Point, radius: number, { color = 'black', width = 2 } = {}) => {
    ctx.beginPath()
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.stroke()
  }

export const getCanvasDrawMethods = (ctx: any, canvasWidth: number) => ({
  rect: getDrawRect(ctx),
  circle: getDrawCircle(ctx),
  line: getDrawLine(ctx),
  chart: getRenderChart(ctx, canvasWidth),
})

export type Point = {
  x: number
  y: number
}

export const getRenderChart = (ctx: any, canvasWidth: number) => {
  const drawRect = getDrawRect(ctx)
  // const drawCircle = getDrawCircle(ctx)
  const drawLine = getDrawLine(ctx)

  return (
    // width is not make sense for canvasWidth global setup
    grid: { leftTop: Point; width: number; height: number },
    values: number[][],
    {
      sampleRate,
      xAxisScaleFactor = 1,
    }: // TODO: remove
    // yAxisScaleFactor,
    { sampleRate: number; xAxisScaleFactor?: number }
  ) => {
    // ---- Y SCALE ----
    const maxXValue = Math.max(...values.flat())
    const minXValue = Math.min(...values.flat())
    // find peak for negative & positive numbers
    const maxValue = Math.max(maxXValue, -minXValue)
    // /2 => because is X0 is centered in the chart
    const yAxisScaleFactor = grid.height / 2 / maxValue

    // ---- X SCALE ----
    const longesChart = Math.max(...values.map(i => i.length))
    xAxisScaleFactor = canvasWidth / longesChart

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
}
