import { Complex, dft } from './dft'
import { Point, getCanvasDrawMethods } from './canvas'
import { runCircles, setupLeftCirclesXD, setupTopCirclesXD } from './renderFFTEngine'
var ft = require('fourier-transform')

// --------------------------- canvas utils ---------------------------

const view = {
  width: 5000, // window.innerWidth,
  height: 1500, // window.innerHeight,
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

const draw = getCanvasDrawMethods(ctx, view.width)

// ------------------------------------------------------------

const computeFT = (wave: number[]) => {
  var inputWaveform = new Float32Array(wave)
  var fftOutputSpectrum = ft(inputWaveform) as number[]
  return fftOutputSpectrum
  // return dft(wave)
}

// TODO: add transpose matrix to keep the code simpler... but I don't care tbh
export const getSumOfFns = (fns: number[][]) => {
  return (fns?.[0] ?? []).map((v, index) => {
    let sum = 0
    for (let i = 0; i < fns.length; i++) {
      sum += fns[i][index]
    }
    return sum
  })
}

const renderGivingUpWave = () => {
  // const signal = Array.from({ length: 30 }).map((_, i) => i)
  const signal = [
    // 100, 100, 100, -100, -100, -100, 100, 100, 100, -100, -100, -100,
    ...Array.from({ length: 100 }).map((_, i) => i),
    //   // ...Array.from({ length: 100 }).map((_, i) => 100 - i),
    // console.log(signal)
    // getSinusFunctionSamples({
    //   size: 200,
    //   sampleRate: 10,
    //   frequency: 3,
    //   amplitude: 200,
    // })
    // [
    // 100, 100, 100, -100, -100, -100, 100, 100, 100, -100, -100, -100,
    //   -100,
    // ].map(i => i + 100)
  ]

  const fourierY = dft(signal.map(i => new Complex(i, i)))
  // .filter(({ im }) => im > 0)
  // .filter(({ re }) => re > 0)
  // .sort((a, b) => b.amplitude - a.amplitude)

  // draw.chart(
  //   {
  //     leftTop: { x: 10, y: 10 },
  //     width: view.width,
  //     height: 190,
  //   },
  //   [
  //     fourierY.map(({ re }) => re),
  //     //  fourierY.map(({ im }) => im)
  //   ],
  //   { sampleRate: 1000, xAxisScaleFactor: 1 }
  // )

  // draw.chart(
  //   {
  //     leftTop: { x: 10, y: 210 },
  //     width: view.width,
  //     height: 190,
  //   },
  //   [
  //     // fourierY.map(({ re }) => re),
  //     fourierY.map(({ im }) => im),
  //   ],
  //   { sampleRate: 1000, xAxisScaleFactor: 1 }
  // )

  console.log('ahoj')
  console.log(fourierY)

  setupLeftCirclesXD(
    fourierY.map(i => ({
      radius: i.amp,
      phase: i.phase,
      frequency: i.freq * 2,
    }))
  )

  runCircles()
}

// TODO: xAxisScaleFactor does not scale background
const renderSquareWave = () => {
  // The sampling rate refers to the number of samples per second.
  const SAMPLE_RATE = 2 ** 11 / 6
  // the number of waves that pass a fixed point in unit time (1sec)
  const frequency = 1
  const SIZE = 2 ** 11 // 2048

  const getSinSquareWavePartSample = (order: number) =>
    Array.from(
      { length: SIZE },
      (_, i) => Math.sin(frequency * order * Math.PI * 2 * (i / SAMPLE_RATE)) * (1 / order)
    )

  const APPROXIMATION_COUNT = 10
  const squareWaveFns = Array.from({ length: APPROXIMATION_COUNT }).map((_, i) =>
    getSinSquareWavePartSample(1 + i * 2)
  )

  const sumFn = getSumOfFns(squareWaveFns)
  draw.chart(
    {
      leftTop: { x: 10, y: 610 },
      width: SIZE,
      height: 190,
    },
    [sumFn, ...squareWaveFns],
    { sampleRate: SAMPLE_RATE, xAxisScaleFactor: 1 }
  )

  const fftOutputSpectrum = computeFT(sumFn)

  draw.chart(
    {
      leftTop: { x: 10, y: 810 },
      width: SIZE,
      height: 190,
    },
    [fftOutputSpectrum],
    { sampleRate: SAMPLE_RATE, xAxisScaleFactor: 1 }
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

  const dataToEngine = fns2
    .map(i => ({
      radius: i.amplitude,
      frequency: i.frequency,
      phase: 0,
    }))
    .map(i => ({
      // setup nice UI
      radius: i.radius * 150,
      frequency: i.frequency * 5,
      phase: i.phase,
    }))

  // square wave
  setupLeftCirclesXD(dataToEngine)

  draw.chart(
    {
      leftTop: { x: 10, y: 1010 },
      width: SIZE,
      height: 190,
    },

    // TODO: add sum function
    [getSumOfFns(fnsData), sumFn],
    { sampleRate: SAMPLE_RATE, xAxisScaleFactor: 1 }
  )

  runCircles()
}

export const getSinusFunctionSamples = (a: {
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

export const render2DSignal = (kunda: Point[]) => {
  const SLOW_ANIMATION_COEFFICIENT = 2
  const APPROXIMATION_COUNT = 10
  const REPEAT_DATA_COEFFICIENT = 5 // 0 === identity

  // TODO: no idea why i put minus sign here
  const ySignal = kunda.map(({ y }) => y)

  // make more signal sample to keep FT working better
  const ySumFn = Array.from({ length: 2 ** REPEAT_DATA_COEFFICIENT }).flatMap(() => ySignal)

  // const amplitude = 1
  // the number of samples per second. (1 sec = red line in the chart)
  const SAMPLE_RATE = ySignal.length // 2 ** 11 / 6
  const SIZE = ySumFn.length // 2 ** 10 // 2048

  draw.chart(
    {
      leftTop: { x: 10, y: 0 },
      width: SIZE,
      height: 190,
    },

    [ySumFn /*, ...fns*/],
    { sampleRate: SAMPLE_RATE }
  )

  const fftOutputSpectrum = computeFT(ySumFn)

  // height of the bar === amplitude
  // X coords === frequency
  draw.chart(
    {
      leftTop: { x: 10, y: 210 },
      width: SIZE,
      height: 190,
    },

    [fftOutputSpectrum],
    { sampleRate: SAMPLE_RATE }
  )

  const fns2 = getFTMetadata(fftOutputSpectrum, {
    size: SIZE,
    sampleRate: SAMPLE_RATE,
    maxPeaksCount: APPROXIMATION_COUNT, // fns.length,
  })

  // console.log(fns2)
  // console.log(fns2.map(i => `sin(${i.frequency}*x) * ${i.amplitude}`).join(' + '))

  const fourierFoundFns = fns2.map(i =>
    getSinusFunctionSamples({
      ...i,
      size: SIZE,
      sampleRate: SAMPLE_RATE,
    })
  )

  draw.chart(
    {
      leftTop: { x: 10, y: 410 },
      width: SIZE,
      height: 190,
    },

    // TODO: add sum function
    [getSumOfFns(fourierFoundFns), ySumFn],
    { sampleRate: SAMPLE_RATE }
  )

  // render data
  const yDataToEngine = fns2
    .map(i => ({
      radius: i.amplitude,
      // TODO: refactor info frequency
      frequency: i.frequency,
    }))
    .map(i => ({
      radius: i.radius * 100,
      frequency: i.frequency * SLOW_ANIMATION_COEFFICIENT,
      phase: 0,
    }))

  // setup data to render cycles
  setupLeftCirclesXD(yDataToEngine)

  // --------------------------------------
  // --------------------------------------
  // --------------------------------------
  // --------------- X axis ---------------

  const xSignal = kunda.map(({ x }) => x)
  const xSumFns = Array.from({ length: 2 ** REPEAT_DATA_COEFFICIENT }).flatMap(() => xSignal)

  draw.chart(
    {
      leftTop: { x: 10, y: 610 },
      width: SIZE,
      height: 190,
    },

    [xSumFns /*, ...fns*/],
    { sampleRate: SAMPLE_RATE }
  )

  const xFftOutputSpectrum = computeFT(xSumFns)

  // height of the bar === amplitude
  // X coords === frequency
  draw.chart(
    {
      leftTop: { x: 10, y: 810 },
      width: SIZE,
      height: 190,
    },

    [xFftOutputSpectrum],
    { sampleRate: SAMPLE_RATE }
  )

  const xFns2 = getFTMetadata(xFftOutputSpectrum, {
    size: SIZE,
    sampleRate: SAMPLE_RATE,
    maxPeaksCount: APPROXIMATION_COUNT,
  })

  const xFourierFoundFns = xFns2.map(i =>
    getSinusFunctionSamples({
      ...i,
      size: SIZE,
      sampleRate: SAMPLE_RATE,
    })
  )

  draw.chart(
    {
      leftTop: { x: 10, y: 1010 },
      width: SIZE,
      height: 190,
    },

    // TODO: add sum function
    [getSumOfFns(xFourierFoundFns), xSumFns],
    { sampleRate: SAMPLE_RATE, xAxisScaleFactor: 1 }
  )

  const xDataToEngine = xFns2
    .map(i => ({
      radius: i.amplitude,
      // TODO: refactor info frequency
      frequency: i.frequency,
    }))
    .map(i => ({
      radius: i.radius * 100,
      frequency: i.frequency * SLOW_ANIMATION_COEFFICIENT,
      phase: 0,
    }))

  setupTopCirclesXD(xDataToEngine)
  // --------------------------------------------

  runCircles()
}

// not sure if it workings well => will be better to have only peaks
const getSignalPeaks = (ftWave: number[]) => {
  return ftWave
    .map((amplitude, index) => ({ amplitude, xPosition: index + 1 }))
    .filter((lol, index) => {
      const amplitude = lol.amplitude
      const prevVal = ftWave[index - 1] ?? 0
      const nextVal = ftWave[index + 1] ?? 0
      const isPeak = amplitude > prevVal && amplitude > nextVal
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
  draw.rect({ x: 0, y: 0 }, view.width, view.height, {
    color: '#000',
  })

  renderGivingUpWave()
  // renderSquareWave()

  // render2DSignal()
}

initRenderUI()
// window.onload = initRenderUI

// ---------------

export {}
