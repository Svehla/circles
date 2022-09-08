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

// ----------------------------
// ----------------------------
// ----------------------------
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

  // musí to být dopíči zkurvenej násob 2 na něco
  // proč!!!
  const SAMPLE_RATE = 2 ** 11 / 6 // => je to kurwa závislé na SIZE!!!!
  // the number of waves that pass a fixed point in unit time (1sec)
  const frequency = 1
  const SIZE = 2 ** 11 // 2048

  const getSinSquareWavePartSample = (order: number) =>
    Array.from(
      { length: SIZE },
      (_, i) => Math.sin(frequency * order * Math.PI * 2 * (i / SAMPLE_RATE)) * (1 / order)
    )

  const APPROXIMATION_COUNT = 40
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
    { sampleRate: SAMPLE_RATE, xAxisScaleFactor: 1, yAxisScaleFactor: 100 }
  )

  const fns2 = getFTMetadata(fftOutputSpectrum, {
    size: SIZE,
    sampleRate: SAMPLE_RATE,
    maxPeaksCount: APPROXIMATION_COUNT,
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
  const SAMPLE_RATE = 2 ** 11 / 6
  const SIZE = 2 ** 10 // 2048
  const fns = [
    getSinusFunctionSamples({
      size: SIZE,
      sampleRate: SAMPLE_RATE,
      // float frequencies are not working!!!! => TODO reimplement FFT
      frequency: 2,
      amplitude: 1.2,
    }),
    getSinusFunctionSamples({
      size: SIZE,
      sampleRate: SAMPLE_RATE,
      frequency: 10,
      amplitude: 0.5,
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
    maxPeaksCount: fns.length,
  })

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
  return ftWave
    .map((amplitude, index) => ({ amplitude, xPosition: index + 1 }))
    .filter((lol, index) => {
      const amplitude = lol.amplitude
      const prevVal = ftWave[index - 1] ?? 0
      // const p2 = ftWave[index - 2] ?? 0
      // const p3 = ftWave[index - 3] ?? 0
      const nextVal = ftWave[index + 1] ?? 0
      // const n2 = ftWave[index + 2] ?? 0
      // const n3 = ftWave[index + 3] ?? 0
      const isPeak =
        // amplitude > p2 &&
        // amplitude > p3 &&
        amplitude > prevVal && amplitude > nextVal
      // amplitude > n2 &&
      // amplitude > n3
      return isPeak
    })
    .sort((a, b) => a.amplitude - b.amplitude)
    .reverse()
}

// How to read data:

//length of the array / sample rate

// the peak means how many frequency will be done in that time

// https://towardsdatascience.com/insight-to-the-fourier-transform-and-the-simple-implementation-of-it-eee293317efd
// size === duration of the sound
const getFrequencyFromFT = (a: { xPosition: number; size: number; sampleRate: number }) => {
  const waveDuration = a.size / a.sampleRate
  // wtf names
  const inTheWaveSinWasCalledTimes = a.xPosition

  return inTheWaveSinWasCalledTimes / waveDuration
}

const getFTMetadata = (
  ftWave: number[],
  a: {
    size: number
    sampleRate: number
    maxPeaksCount: number
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
  // console.log('peaks')
  // console.log(peaks)
  // console.log(peaks)

  // broken debug GUI
  peaks.forEach(v => {
    drawLine(
      {
        x: 10 + v.xPosition,
        y: 300,
      },
      {
        x: 10 + v.xPosition,
        y: 300 + v.amplitude * 100,
      },
      { width: 1, color: 'green' }
    )
  })

  const data = peaks.slice(0, a.maxPeaksCount).map(f => ({
    amplitude: f.amplitude,
    frequency: getFrequencyFromFT({
      xPosition: f.xPosition,
      size: a.size,
      sampleRate: a.sampleRate,
    }),
  }))
  // console.log(JSON.stringify(data, null, 2))
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
