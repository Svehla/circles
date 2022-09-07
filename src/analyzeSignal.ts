import { distance } from './math'
import { xd } from './renderFFTEngine'
var ft = require('fourier-transform')

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
// ------------------------------------------------------------

// configure the space

const image1 = [
  //
  [100, 150],
  [400, 200],
  [300, 450],
  [100, 450],
  [200, 210],
].map(([x, y]) => ({ x, y }))

const RENDER_IMAGE_SPEED_PX_SEC = 100 // px/sec

const getSignalBetween2Points = (p1: Point, p2: Point) => {
  const xDiff = p2.x - p1.x
  const yDiff = p2.y - p1.y
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

// ----------------------------
// ----------------------------
// ----------------------------
const renderChart = (
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

const computeFT = (wave: number[]) => {
  var inputWaveform = new Float32Array(wave)
  var fftOutputSpectrum = ft(inputWaveform) as number[]
  return fftOutputSpectrum
}

// TODO: add transpose matrix to keep the code simpler... but I don't care tbh
const getSumOfFns = (fns: number[][]) => {
  return fns[0].map((v, index) => {
    let sum = 0
    for (let i = 0; i < fns.length; i++) {
      sum += fns[i][index]
    }
    return sum
  })
}

// TODO: xAxisScaleFactor does not scale background
const renderSquareWave = () => {
  // The sampling rate refers to the number of samples per second.
  const SAMPLE_RATE = 200
  // the number of waves that pass a fixed point in unit time (1sec)
  const frequency = 1
  const SIZE = 2 ** 11 // 2048

  const getSinSquareWavePartSample = (order: number) =>
    Array.from(
      { length: SIZE },
      (_, i) => Math.sin(frequency * order * Math.PI * 2 * (i / SAMPLE_RATE)) * (1 / order)
    )

  const APPROXIMATION_COUNT = 2
  const squareWaveFns = Array.from({ length: APPROXIMATION_COUNT }).map((_, i) =>
    getSinSquareWavePartSample(1 + i * 2)
  )

  const sumFn = getSumOfFns(squareWaveFns)
  renderChart(
    {
      leftTop: { x: 10, y: 610 },
      width: SIZE,
      height: 190,
    },
    [sumFn, ...squareWaveFns],
    { sampleRate: SAMPLE_RATE, xAxisScaleFactor: 1, yAxisScaleFactor: 80 }
  )

  const fftOutputSpectrum = computeFT(sumFn)

  renderChart(
    {
      leftTop: { x: 10, y: 810 },
      width: SIZE,
      height: 190,
    },
    [fftOutputSpectrum],
    { sampleRate: SAMPLE_RATE, xAxisScaleFactor: 3, yAxisScaleFactor: 100 }
  )

  const fns2 = getFTMetadata(fftOutputSpectrum, {
    size: SIZE,
    sampleRate: SAMPLE_RATE,
    peaksCount: APPROXIMATION_COUNT,
  })

  const fnsData = fns2.map(i =>
    getSinusFunctionSamples({
      size: SIZE,
      sampleRate: SAMPLE_RATE,
      frequency: i.frequency,
      amplitude: i.amplitude,
    })
  )

  const dataToEngine = fns2.map(i => ({
    radius: i.amplitude,
    rotationPerSecond: 1 / i.frequency,
    touchPointAngle: 0,
  }))

  // square wave
  xd(dataToEngine)

  // console.log(JSON.stringify(fns2, null, 2))

  renderChart(
    {
      leftTop: { x: 10, y: 1010 },
      width: SIZE,
      height: 190,
    },

    // TODO: add sum function
    [getSumOfFns(fnsData), sumFn],
    { sampleRate: SAMPLE_RATE, xAxisScaleFactor: 1, yAxisScaleFactor: 50 }
  )
}

const getSinusFunctionSamples = (a: {
  size: number
  // the number of samples per second. (1 sec = red line in the chart)
  sampleRate: number
  // the number of waves that pass a fixed point in unit time (1sec)
  frequency: number
  amplitude: number
}) =>
  Array.from(
    { length: a.size },
    // todo: check this formula if its working well
    (_, i) => Math.sin(a.frequency * Math.PI * 2 * (i / a.sampleRate)) * a.amplitude
  )

const renderBasicComposedSins = () => {
  // const amplitude = 1
  // the number of samples per second. (1 sec = red line in the chart)
  const SAMPLE_RATE = 2 ** 10 / 3
  // the number of waves that pass a fixed point in unit time (1sec)
  // const frequency = 1
  const SIZE = 2 ** 10 // 2048
  const fns = [
    getSinusFunctionSamples({
      size: SIZE,
      sampleRate: SAMPLE_RATE,
      frequency: 1,
      amplitude: 1.2,
    }),

    getSinusFunctionSamples({
      size: SIZE,
      sampleRate: SAMPLE_RATE,
      frequency: 5,
      amplitude: 0.5,
    }),

    // getSinusFunctionSamples({
    //   size: SIZE,
    //   sampleRate: SAMPLE_RATE,
    //   frequency: 1.5,
    //   amplitude: 1,
    // }),

    getSinusFunctionSamples({
      size: SIZE,
      sampleRate: SAMPLE_RATE,
      frequency: 7,
      amplitude: 1.5,
    }),
  ]
  const sumFn = getSumOfFns(fns)

  renderChart(
    {
      leftTop: { x: 10, y: 0 },
      width: SIZE,
      height: 190,
    },

    [sumFn, ...fns],
    { sampleRate: SAMPLE_RATE, xAxisScaleFactor: 1, yAxisScaleFactor: 20 }
  )

  const fftOutputSpectrum = computeFT(sumFn)

  // height of the bar === amplitude
  // X coords === frequency
  renderChart(
    {
      leftTop: { x: 10, y: 210 },
      width: SIZE,
      height: 190,
    },

    [fftOutputSpectrum],
    { sampleRate: SAMPLE_RATE, xAxisScaleFactor: 1, yAxisScaleFactor: 50 }
  )

  const fns2 = getFTMetadata(fftOutputSpectrum, {
    size: SIZE,
    sampleRate: SAMPLE_RATE,
    peaksCount: fns.length,
  })

  // console.log(JSON.stringify(fns2, null, 2))

  // render data
  const dataToEngine = fns2.map(i => ({
    radius: i.amplitude,
    // TODO: refactor info frequency
    rotationPerSecond: 1 / i.frequency,
  }))
  // basic function
  // xd(dataToEngine)

  const fourierFoundFns = fns2.map(i =>
    getSinusFunctionSamples({
      ...i,
      size: SIZE,
      sampleRate: SAMPLE_RATE,
    })
  )

  renderChart(
    {
      leftTop: { x: 10, y: 410 },
      width: SIZE,
      height: 190,
    },

    // TODO: add sum function
    [getSumOfFns(fourierFoundFns), sumFn],
    { sampleRate: SAMPLE_RATE, xAxisScaleFactor: 1, yAxisScaleFactor: 20 }
  )
}

// not sure if it workings well => will be better to have only peaks
const getSignalPeaks = (ftWave: number[]) => {
  return (
    ftWave
      // is not working!!!!!
      /*
      .filter((amplitude, index) => {
        const prevVal = ftWave[index - 1] ?? 0
        const nextVal = ftWave[index + 1] ?? 0
        const isPeak = amplitude > prevVal && amplitude > nextVal
        return isPeak
      })
      */
      // TODO: +1??? there is no 0 element i guess
      .map((amplitude, index) => ({ amplitude, xPosition: index + 1 }))
      .sort((a, b) => a.amplitude - b.amplitude)
      .reverse()
  )
}

// How to read data:

//length of the array / sample rate

// the peak means how many frequency will be done in that time

// https://towardsdatascience.com/insight-to-the-fourier-transform-and-the-simple-implementation-of-it-eee293317efd
// size === duration of the sound
const getFrequencyFromFT = (a: { xPosition: number; size: number; sampleRate: number }) =>
  a.xPosition / (a.size / a.sampleRate)

const getFTMetadata = (
  ftWave: number[],
  a: {
    size: number
    sampleRate: number
    peaksCount: number
  }
) => {
  const peaks = getSignalPeaks(ftWave)
  // console.log(peaks)
  // console.log(peaks)
  // const sortedByValue = ftWave
  //   .map((amplitude, index) => ({ amplitude, index }))
  //   .sort((a, b) => a.amplitude - b.amplitude)
  //   .reverse()

  // TODO: how many values

  const data = peaks.slice(0, a.peaksCount).map(f => ({
    amplitude: f.amplitude,
    frequency: getFrequencyFromFT({
      xPosition: f.xPosition,
      size: a.size,
      sampleRate: a.sampleRate,
    }),
  }))
  return data
}

const initRenderUI = () => {
  setCanvasSize()
  clearCanvas()
  drawRect({ x: 0, y: 0 }, view.width, view.height, {
    color: '#000',
  })

  renderSquareWave()
  renderBasicComposedSins()
}

initRenderUI()
// window.onload = initRenderUI

// ---------------

export {}
