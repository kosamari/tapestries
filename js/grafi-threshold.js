;(function () {
  /**
    ## ImageData object constructor
    Every return from grafi method is formatted to an ImageData object.
    This constructor is used when `window` is not available.
    (for example you are using grafi in node)
   */
  function GrafiImageData (pixelData, width, height) {
    this.width = width
    this.height = height
    this.data = pixelData
  }

  /**
    ## Color Depth Checker
    To maintain simplicity of code, grafi only accepts ImageData in RGBA
    Length of pixelData must be 4 times as much as available pixels (width * height).
   */
  function checkColorDepth (dataset, width, height) {
    var colorDepth
    if (dataset.width && dataset.height) {
      // When ImageData object was passed as dataset
      colorDepth = dataset.data.length / (dataset.width * dataset.height)
    } else {
      // When just an array was passed as dataset
      colorDepth = dataset.length / (width * height)
    }

    if (colorDepth !== 4) {
      throw new Error('data and size of the image does now match')
    }
  }

  /**
    ## formatter
    Internal function used to format pixel data into ImageData object

    ### Parameters
      - pixelData `Uint8ClampedArray`: pixel representation of the image
      - width `Number`: width of the image
      - hight `Number`: height of the image

    ### Example
        formatter(new Uint8ClampedArray[400], 10, 10)
        // ImageData { data: Uint8ClampedArray[400], width: 10, height: 10, }
   */
  function formatter (pixelData, width, height) {
    // check the size of data matches
    checkColorDepth(pixelData, width, height)

    if (!(pixelData instanceof Uint8ClampedArray)) {
      throw new Error('pixel data passed is not an Uint8ClampedArray')
    }

    // If window is available create ImageData using browser API,
    // otherwise call ImageData constructor
    if (typeof window === 'object') {
      return new window.ImageData(pixelData, width, height)
    }
    return new GrafiImageData(pixelData, width, height)
  }
  /**
    ## grayscale method
    Grayscale color of an given image.
    If no option is passed, it defaults to { mode: 'luma', monochrome: false }

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object
          - mode `String` : grayscaling mode, 'luma', 'simple', or 'average'
          - monochrome `Boolean` : output to be monochrome (single color depth) image

    ### Example
        var input = { data: Uint8ClampedArray[400], width: 10, height: 10, }
        grafi.grayscale(input, {mode: 'average', monochrome: true})
        // Since monochrome flag is true, returned object will have smaller data
        // ImageData { data: Uint8ClampedArray[100], width: 10, height: 10, }
   */
  function grayscale (imgData, option) {
    // sanitary check for input data
    checkColorDepth(imgData)

    // set check options object & set default options if necessary
    option = option || {}
    option.mode = option.mode || 'luma'
    option.channel = Number(option.channel) || 1

    // different grayscale methods
    var mode = {
      'luma': function (r, g, b) {
        return 0.299 * r + 0.587 * g + 0.114 * b
      },
      'simple': function (r, g, b, a, c) {
        return arguments[c]
      },
      'average': function (r, g, b) {
        return (r + g + b) / 3
      }
    }

    var pixelSize = imgData.width * imgData.height
    var newPixelData = new Uint8ClampedArray(pixelSize * 4)
    var i, _grayscaled, _index

    // loop through pixel size, extract r, g, b values & calculate grayscaled value
    for (i = 0; i < pixelSize; i++) {
      _index = i * 4
      _grayscaled = mode[option.mode](imgData.data[_index], imgData.data[_index + 1], imgData.data[_index + 2], imgData.data[_index + 3], option.channel)
      newPixelData[_index] = _grayscaled
      newPixelData[_index + 1] = _grayscaled
      newPixelData[_index + 2] = _grayscaled
      newPixelData[_index + 3] = imgData.data[_index + 3]
    }
    return formatter(newPixelData, imgData.width, imgData.height)
  }
  /**
    ## threshold method
    Threshold an image on the level passed as option

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object
          - level `Number` : threshold level, from 0 to 255
          - grayscaled `Boolean` : input imageData is grayscaled or not

    ### Example
        var input = { data: Uint8ClampedArray[400], width: 10, height: 10 }
        // threshold at level 200
        grafi.threshold(input, {level: 200})
        // if input image is already grayscaled, pass grayscaeled flag to bypass redundant grayscaling
        grafi.threshold(input, {level: 200, grayscaled: true})
   */
  function threshold (imgData, option) {
    // make sure data is good data
    checkColorDepth(imgData)

    // set check options object & set default options if necessary
    option = option || {}
    option.level = option.level || 127
    option.grayscaled = option.grayscaled || false

    var pixelSize = imgData.width * imgData.height
    var grayscaledData = imgData.data
    if (!option.grayscaled) {
      grayscaledData = grayscale(imgData, {mode:'simple'}).data
    }
    var newPixelData = new Uint8ClampedArray(pixelSize * 4)
    var lookupTable = new Uint8Array(256)
    var i, pixel, index
    for (i = option.level; i < 256; i++) {
      lookupTable[i] = 255
    }

    for (pixel = 0; pixel < pixelSize; pixel++) {
      index = pixel * 4
      newPixelData[index] = lookupTable[grayscaledData[index]]
      newPixelData[index + 1] = lookupTable[grayscaledData[index + 1]]
      newPixelData[index + 2] = lookupTable[grayscaledData[index + 2]]
      newPixelData[index + 3] = imgData.data[index + 3]
    }
    return formatter(newPixelData, imgData.width, imgData.height)
  }

  var grafi = {}
  grafi.threshold = threshold

  if (typeof module === 'object' && module.exports) {
    module.exports = grafi
  } else {
    this.grafi = grafi
  }
}())
