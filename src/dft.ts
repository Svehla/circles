// https://www.algorithm-archive.org/contents/cooley_tukey/cooley_tukey.html
// definition:"j"
// https://en.wikipedia.org/wiki/Discrete_Fourier_transform
// discreteFourierTransform
// export const dft = (signal: number[]) => {
//   const x = signal
//   const N = x.length
//   const X = [] as {
//     re: number
//     im: number
//     freq: number
//     amplitude: number
//     phase: number
//   }[]

//   // when the k is ending?
//   for (let k = 0; k < N; k++) {
//     let re = 0
//     let im = 0

//     for (let n = 0; n < N; n++) {
//       const phi = (2 * Math.PI * k * n) / N
//       re += x[n] * Math.cos(phi)
//       im -= x[n] * Math.sin(phi)
//     }

//     re = re / N
//     im = im / N

//     const freq = k
//     // pythagor
//     const amplitude = Math.sqrt(re ** 2 + im ** 2)
//     const phase = Math.atan2(im, re)

//     X[k] = {
//       re,
//       im,
//       freq,
//       amplitude,
//       phase,
//     }
//   }
//   return X
// }

// Coding Challenge 130.3: Drawing with Fourier Transform and Epicycles
// Daniel Shiffman
// https://thecodingtrain.com/CodingChallenges/130.1-fourier-transform-drawing.html
// https://thecodingtrain.com/CodingChallenges/130.2-fourier-transform-drawing.html
// https://thecodingtrain.com/CodingChallenges/130.3-fourier-transform-drawing.html
// https://youtu.be/7_vKzcgpfvU

export class Complex {
  re: number
  im: number
  constructor(a: number, b: number) {
    this.re = a
    this.im = b
  }

  add(c: Complex) {
    this.re += c.re
    this.im += c.im
  }

  mult(c: Complex) {
    const re = this.re * c.re - this.im * c.im
    const im = this.re * c.im + this.im * c.re
    return new Complex(re, im)
  }
}

export function dft(x: Complex[]) {
  const X = []
  const N = x.length
  for (let k = 0; k < N; k++) {
    let sum = new Complex(0, 0)
    for (let n = 0; n < N; n++) {
      const phi = (Math.PI * 2 * k * n) / N
      const c = new Complex(Math.cos(phi), -Math.sin(phi))
      sum.add(x[n].mult(c))
    }
    sum.re = sum.re / N
    sum.im = sum.im / N

    let freq = k
    let amp = Math.sqrt(sum.re * sum.re + sum.im * sum.im)
    let phase = Math.atan2(sum.im, sum.re)
    X[k] = { re: sum.re, im: sum.im, freq, amp, phase }
  }
  return X
}
